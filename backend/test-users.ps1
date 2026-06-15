$ErrorActionPreference = "Stop"
$base = "http://localhost:3000"
$pass = 0; $fail = 0

function Call($method, $path, $body, $token) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $json = if ($null -ne $body) { $body | ConvertTo-Json -Compress } else { $null }
  try {
    $r = Invoke-WebRequest -Uri "$base$path" -Method $method -Headers $headers -Body $json -UseBasicParsing
    return @{ status = [int]$r.StatusCode; body = ($r.Content | ConvertFrom-Json) }
  } catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    $bodyObj = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      try { $bodyObj = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $bodyObj = $_.ErrorDetails.Message }
    }
    return @{ status = $code; body = $bodyObj }
  }
}

function Sql($q) {
  $out = docker exec -e PGPASSWORD=postgres sr-pg-test psql -U postgres -d store_rating -q -t -A -c $q
  return ($out | Where-Object { $_ -and $_.Trim() -ne "" } | Select-Object -First 1)
}

function Check($name, $cond, $detail) {
  if ($cond) { $script:pass++; Write-Host "  PASS  $name" -ForegroundColor Green }
  else { $script:fail++; Write-Host "  FAIL  $name -- $detail" -ForegroundColor Red }
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$pwd = "Passw0rd!"

# ---- Setup: create an admin (register normal, then promote via SQL) ----
Write-Host "`n[setup] bootstrap admin" -ForegroundColor Cyan
$adminEmail = "admin.$ts@example.com"
$r = Call POST "/auth/register" @{ name = "System Administrator Main Acct"; email = $adminEmail; password = $pwd }
$adminId = $r.body.user.id
Sql "UPDATE users SET role='admin' WHERE id='$adminId';" | Out-Null
$r = Call POST "/auth/login" @{ email = $adminEmail; password = $pwd }
$adminToken = $r.body.accessToken
Check "admin promoted and logged in" ($r.body.user.role -eq "admin" -and [bool]$adminToken) "role=$($r.body.user.role)"

# ============ 1) POST /users : admin creates each role ============
Write-Host "`n1) POST /users - admin creates users of each role" -ForegroundColor Cyan
$ownerEmail = "owner.$ts@example.com"
$r = Call POST "/users" @{ name = "Store Owner Primary Account"; email = $ownerEmail; password = $pwd; address = "1 Market Road"; role = "store_owner" } $adminToken
Check "create store_owner -> 201" ($r.status -eq 201) "got $($r.status)"
$ownerId = $r.body.id
Check "returned role = store_owner" ($r.body.role -eq "store_owner") "role=$($r.body.role)"
Check "no password in response" ($null -eq $r.body.password) "leaked"

$normalEmail = "normal.$ts@example.com"
$r = Call POST "/users" @{ name = "Normal Platform User Account"; email = $normalEmail; password = $pwd; role = "normal" } $adminToken
$normalId = $r.body.id
Check "create normal -> 201" ($r.status -eq 201) "got $($r.status)"

$r = Call POST "/users" @{ name = "Second Administrator Account"; email = "admin2.$ts@example.com"; password = $pwd; role = "admin" } $adminToken
Check "create admin -> 201" ($r.status -eq 201) "got $($r.status)"

Write-Host "`n1b) POST /users - validation" -ForegroundColor Cyan
$r = Call POST "/users" @{ name = "Too Short"; email = "x.$ts@example.com"; password = $pwd; role = "normal" } $adminToken
Check "short name -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/users" @{ name = "Valid Name For This Account"; email = "y.$ts@example.com"; password = $pwd; role = "superuser" } $adminToken
Check "invalid role -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/users" @{ name = "Valid Name For This Account"; email = $normalEmail; password = $pwd; role = "normal" } $adminToken
Check "duplicate email -> 409" ($r.status -eq 409) "got $($r.status)"

# ============ 2) GET /users : list / filter / sort / exclude store_owner ============
Write-Host "`n2) GET /users - list excludes store_owners" -ForegroundColor Cyan
$r = Call GET "/users?limit=100" $null $adminToken
$roles = $r.body.data | ForEach-Object { $_.role } | Sort-Object -Unique
Check "200 + paginated envelope (total/page/limit/totalPages)" ($r.status -eq 200 -and $null -ne $r.body.total -and $null -ne $r.body.totalPages) "body keys missing"
Check "no store_owner in list" (-not ($roles -contains "store_owner")) "roles=$($roles -join ',')"
Check "store_owner id absent from list" (-not (($r.body.data | ForEach-Object { $_.id }) -contains $ownerId)) "owner present"

Write-Host "`n2b) GET /users - filter by email" -ForegroundColor Cyan
$r = Call GET "/users?email=normal.$ts" $null $adminToken
Check "email filter returns the normal user" ($r.body.data.Count -ge 1 -and $r.body.data[0].email -eq $normalEmail) "count=$($r.body.data.Count)"

Write-Host "`n2c) GET /users - sort + pagination" -ForegroundColor Cyan
$r = Call GET "/users?sortBy=email&sortOrder=desc&page=1&limit=2" $null $adminToken
$emails = $r.body.data | ForEach-Object { $_.email }
$sortedDesc = ($emails | Sort-Object -Descending)
Check "page size respected (limit=2)" ($r.body.data.Count -le 2) "count=$($r.body.data.Count)"
Check "sorted by email desc" (($emails -join '|') -eq ($sortedDesc -join '|')) "got=$($emails -join ',')"
$r = Call GET "/users?sortBy=ssn" $null $adminToken
Check "invalid sortBy -> 400" ($r.status -eq 400) "got $($r.status)"

# ============ 3) GET /users/:id : detail + avgRating for store_owner ============
Write-Host "`n3) GET /users/:id - detail" -ForegroundColor Cyan
$r = Call GET "/users/$normalId" $null $adminToken
Check "normal user detail -> 200" ($r.status -eq 200) "got $($r.status)"
Check "normal user has NO avgRating field" ($null -eq $r.body.avgRating) "avgRating=$($r.body.avgRating)"

# seed a store owned by the store_owner + two ratings (4 and 5 => avg 4.5)
$storeId = Sql "INSERT INTO stores (name,email,address,owner_id) VALUES ('Primary Owner Store','store.$ts@example.com','9 High St','$ownerId') RETURNING id;"
Sql "INSERT INTO ratings (value,user_id,store_id) VALUES (4,'$normalId','$storeId'),(5,'$adminId','$storeId');" | Out-Null

$r = Call GET "/users/$ownerId" $null $adminToken
Check "store_owner detail -> 200" ($r.status -eq 200) "got $($r.status)"
Check "store_owner avgRating = 4.5" ([decimal]$r.body.avgRating -eq [decimal]4.5) "avgRating=$($r.body.avgRating)"

$r = Call GET "/users/00000000-0000-0000-0000-000000000000" $null $adminToken
Check "unknown id -> 404" ($r.status -eq 404) "got $($r.status)"
$r = Call GET "/users/not-a-uuid" $null $adminToken
Check "non-uuid id -> 400" ($r.status -eq 400) "got $($r.status)"

# ============ 4) PATCH /users/:id/change-password : self-service ============
Write-Host "`n4) PATCH /users/:id/change-password - self-service" -ForegroundColor Cyan
$rN = Call POST "/auth/login" @{ email = $normalEmail; password = $pwd }
$normalToken = $rN.body.accessToken
$newPwd = "Newpass1@"

$r = Call PATCH "/users/$normalId/change-password" @{ currentPassword = $pwd; newPassword = $newPwd } $normalToken
Check "owner changes own password -> 200" ($r.status -eq 200) "got $($r.status)"
$r = Call POST "/auth/login" @{ email = $normalEmail; password = $newPwd }
Check "login with new password works" ($r.status -eq 200) "got $($r.status)"

$r = Call PATCH "/users/$normalId/change-password" @{ currentPassword = "WrongOld!1"; newPassword = "Another1@" } $normalToken
Check "wrong current password -> 401" ($r.status -eq 401) "got $($r.status)"

$r = Call PATCH "/users/$ownerId/change-password" @{ currentPassword = $newPwd; newPassword = "Another1@" } $normalToken
Check "changing ANOTHER user's password -> 403" ($r.status -eq 403) "got $($r.status)"

$r = Call PATCH "/users/$adminId/change-password" @{ currentPassword = $pwd; newPassword = "Another1@" } $adminToken
Check "admin has NO override (admin role blocked) -> 403" ($r.status -eq 403) "got $($r.status)"

$r = Call PATCH "/users/$normalId/change-password" @{ currentPassword = $newPwd; newPassword = "weak" } $normalToken
Check "weak new password -> 400" ($r.status -eq 400) "got $($r.status)"

# ============ 5) RBAC on admin routes ============
Write-Host "`n5) RBAC" -ForegroundColor Cyan
$r = Call GET "/users" $null $normalToken
Check "normal user hitting GET /users -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call GET "/users" $null $null
Check "no token -> 401" ($r.status -eq 401) "got $($r.status)"
$r = Call POST "/users" @{ name = "Normal Platform User Account"; email = "z.$ts@x.com"; password = $pwd; role = "normal" } $normalToken
Check "normal user creating a user -> 403" ($r.status -eq 403) "got $($r.status)"

Write-Host "`n==================== RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
