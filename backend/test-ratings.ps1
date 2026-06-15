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

# ---- Setup (admin via SEEDED account) ----
Write-Host "`n[setup] login as seeded admin + create users/stores" -ForegroundColor Cyan
$r = Call POST "/auth/login" @{ email = "admin@platform.com"; password = "Admin@1234" }
$adminToken = $r.body.accessToken
Check "seeded admin can log in" ($r.status -eq 200 -and $r.body.user.role -eq "admin") "status=$($r.status)"

$nAEmail = "ratera.$ts@example.com"
$nAId = (Call POST "/auth/register" @{ name = "Rating Normal User AccountA"; email = $nAEmail; password = $pwd }).body.user.id
$nAToken = (Call POST "/auth/login" @{ email = $nAEmail; password = $pwd }).body.accessToken
$nBEmail = "raterb.$ts@example.com"
$nBId = (Call POST "/auth/register" @{ name = "Rating Normal User AccountB"; email = $nBEmail; password = $pwd }).body.user.id
$nBToken = (Call POST "/auth/login" @{ email = $nBEmail; password = $pwd }).body.accessToken

$ownerEmail = "ratingowner.$ts@example.com"
$ownerId = (Call POST "/users" @{ name = "Rating Store Owner Account"; email = $ownerEmail; password = $pwd; role = "store_owner" } $adminToken).body.id
$ownerToken = (Call POST "/auth/login" @{ email = $ownerEmail; password = $pwd }).body.accessToken

$store1 = (Call POST "/stores" @{ name = "Rating Target Store"; email = "rstore1.$ts@store.com"; owner_id = $ownerId } $adminToken).body.id
$store2 = (Call POST "/stores" @{ name = "Unowned Store"; email = "rstore2.$ts@store.com" } $adminToken).body.id
Check "setup complete" ([bool]$adminToken -and [bool]$nAToken -and [bool]$ownerToken -and [bool]$store1) "missing ids"

# ============ 1) POST /ratings ============
Write-Host "`n1) POST /ratings - normal user" -ForegroundColor Cyan
$r = Call POST "/ratings" @{ store_id = $store1; value = 4 } $nAToken
Check "submit rating -> 201" ($r.status -eq 201) "got $($r.status)"
Check "response has id/store_id/user_id/value" ([bool]$r.body.id -and $r.body.store_id -eq $store1 -and $r.body.user_id -eq $nAId -and $r.body.value -eq 4) "body=$($r.body | ConvertTo-Json -Compress)"
$ratingAId = $r.body.id

$r = Call POST "/ratings" @{ store_id = $store1; value = 3 } $nAToken
Check "duplicate rating -> 409" ($r.status -eq 409) "got $($r.status)"
Check "409 message is exact" ($r.body.message -eq "You have already rated this store. Use PATCH to update.") "msg=$($r.body.message)"

$r = Call POST "/ratings" @{ store_id = $store1; value = 6 } $nBToken
Check "value 6 -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = $store1; value = 0 } $nBToken
Check "value 0 -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = $store1; value = 3.5 } $nBToken
Check "non-integer value -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = "not-a-uuid"; value = 4 } $nBToken
Check "bad store_id -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = "00000000-0000-0000-0000-000000000000"; value = 4 } $nBToken
Check "nonexistent store -> 404" ($r.status -eq 404) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = $store1; value = 4 } $ownerToken
Check "store_owner submitting -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = $store1; value = 4 } $adminToken
Check "admin submitting -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call POST "/ratings" @{ store_id = $store1; value = 4 } $null
Check "no token -> 401" ($r.status -eq 401) "got $($r.status)"

# normal B rates store1 = 2 (different user allowed)
$r = Call POST "/ratings" @{ store_id = $store1; value = 2 } $nBToken
Check "second user rates same store -> 201" ($r.status -eq 201) "got $($r.status)"

# ============ 2) PATCH /ratings/:id ============
Write-Host "`n2) PATCH /ratings/:id - owner only" -ForegroundColor Cyan
$r = Call PATCH "/ratings/$ratingAId" @{ value = 5 } $nAToken
Check "update own rating -> 200, value 5" ($r.status -eq 200 -and $r.body.value -eq 5) "body=$($r.body | ConvertTo-Json -Compress)"
$r = Call PATCH "/ratings/$ratingAId" @{ value = 1 } $nBToken
Check "updating another user's rating -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call PATCH "/ratings/$ratingAId" @{ value = 9 } $nAToken
Check "value 9 -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call PATCH "/ratings/00000000-0000-0000-0000-000000000000" @{ value = 3 } $nAToken
Check "nonexistent rating -> 404" ($r.status -eq 404) "got $($r.status)"
$r = Call PATCH "/ratings/not-a-uuid" @{ value = 3 } $nAToken
Check "non-uuid rating id -> 400" ($r.status -eq 400) "got $($r.status)"

# ============ 3) GET /store-owner/dashboard ============
Write-Host "`n3) GET /store-owner/dashboard" -ForegroundColor Cyan
$r = Call GET "/store-owner/dashboard" $null $ownerToken
Check "dashboard -> 200" ($r.status -eq 200) "got $($r.status)"
Check "avg_rating = 3.5 (A=5, B=2)" ([decimal]$r.body.avg_rating -eq [decimal]3.5) "got $($r.body.avg_rating)"
Check "raters count = 2" ($r.body.raters.Count -eq 2) "count=$($r.body.raters.Count)"
$raterA = $r.body.raters | Where-Object { $_.user_id -eq $nAId }
Check "rater A has name/email/submitted_value/submitted_at" ([bool]$raterA.name -and [bool]$raterA.email -and $raterA.submitted_value -eq 5 -and [bool]$raterA.submitted_at) "raterA=$($raterA | ConvertTo-Json -Compress)"
$r = Call GET "/store-owner/dashboard" $null $nAToken
Check "normal user hitting dashboard -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call GET "/store-owner/dashboard" $null $null
Check "no token -> 401" ($r.status -eq 401) "got $($r.status)"

# ============ 4) GET /admin/stats ============
Write-Host "`n4) GET /admin/stats" -ForegroundColor Cyan
$r = Call GET "/admin/stats" $null $adminToken
Check "stats -> 200" ($r.status -eq 200) "got $($r.status)"
$uCount = [int](Sql "SELECT count(*) FROM users;")
$sCount = [int](Sql "SELECT count(*) FROM stores;")
$rCount = [int](Sql "SELECT count(*) FROM ratings;")
Check "total_users matches DB ($uCount)" ($r.body.total_users -eq $uCount) "api=$($r.body.total_users)"
Check "total_stores matches DB ($sCount)" ($r.body.total_stores -eq $sCount) "api=$($r.body.total_stores)"
Check "total_ratings matches DB ($rCount)" ($r.body.total_ratings -eq $rCount) "api=$($r.body.total_ratings)"
$r = Call GET "/admin/stats" $null $nAToken
Check "normal user hitting stats -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call GET "/admin/stats" $null $null
Check "no token -> 401" ($r.status -eq 401) "got $($r.status)"

Write-Host "`n==================== RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
