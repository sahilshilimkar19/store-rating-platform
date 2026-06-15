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
function HasProp($obj, $prop) { return ($obj.PSObject.Properties.Name -contains $prop) }

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$pwd = "Passw0rd!"

# ---- Setup ----
Write-Host "`n[setup] admin, normal users, store owners" -ForegroundColor Cyan
$adminEmail = "admin.$ts@example.com"
$adminId = (Call POST "/auth/register" @{ name = "System Administrator Main Acct"; email = $adminEmail; password = $pwd }).body.user.id
Sql "UPDATE users SET role='admin' WHERE id='$adminId';" | Out-Null
$adminToken = (Call POST "/auth/login" @{ email = $adminEmail; password = $pwd }).body.accessToken

$normAEmail = "norma.$ts@example.com"
$normAId = (Call POST "/auth/register" @{ name = "Normal Platform User AccountA"; email = $normAEmail; password = $pwd }).body.user.id
$normAToken = (Call POST "/auth/login" @{ email = $normAEmail; password = $pwd }).body.accessToken
$normBEmail = "normb.$ts@example.com"
$normBId = (Call POST "/auth/register" @{ name = "Normal Platform User AccountB"; email = $normBEmail; password = $pwd }).body.user.id

$ownerEmail = "owner.$ts@example.com"
$ownerId = (Call POST "/users" @{ name = "Store Owner Primary Account"; email = $ownerEmail; password = $pwd; role = "store_owner" } $adminToken).body.id
Check "setup complete" ([bool]$adminToken -and [bool]$normAToken -and [bool]$ownerId) "missing ids"

# ============ 1) POST /stores ============
Write-Host "`n1) POST /stores - admin create + validation" -ForegroundColor Cyan
$r = Call POST "/stores" @{ name = "Alpha Coffee House"; email = "alpha.$ts@store.com"; address = "1 Bean St"; owner_id = $ownerId } $adminToken
Check "create with owner_id -> 201" ($r.status -eq 201) "got $($r.status)"
Check "response echoes owner_id" ($r.body.owner_id -eq $ownerId) "owner_id=$($r.body.owner_id)"
$store1 = $r.body.id

$r = Call POST "/stores" @{ name = "Bravo Books"; email = "bravo.$ts@store.com"; address = "2 Page Ave" } $adminToken
$store2 = $r.body.id
Check "create without owner_id -> 201" ($r.status -eq 201) "got $($r.status)"

$r = Call POST "/stores" @{ name = "Charlie Cafe"; email = "charlie.$ts@store.com"; address = "3 Mug Rd" } $adminToken
$store3 = $r.body.id
Check "create third store -> 201" ($r.status -eq 201) "got $($r.status)"

$r = Call POST "/stores" @{ name = ("X" * 61); email = "long.$ts@store.com" } $adminToken
Check "name > 60 chars -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/stores" @{ name = "Bad Email Store"; email = "not-an-email" } $adminToken
Check "invalid email -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/stores" @{ name = "Bad Owner Store"; email = "bo.$ts@store.com"; owner_id = "not-a-uuid" } $adminToken
Check "owner_id not a uuid -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/stores" @{ name = "Wrong Owner Role"; email = "wor.$ts@store.com"; owner_id = $normAId } $adminToken
Check "owner_id pointing to normal user -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/stores" @{ name = "Ghost Owner Store"; email = "go.$ts@store.com"; owner_id = "00000000-0000-0000-0000-000000000000" } $adminToken
Check "owner_id nonexistent -> 400" ($r.status -eq 400) "got $($r.status)"
$r = Call POST "/stores" @{ name = "Dup Email Store"; email = "alpha.$ts@store.com" } $adminToken
Check "duplicate store email -> 409" ($r.status -eq 409) "got $($r.status)"
$r = Call POST "/stores" @{ name = "Sneaky Store"; email = "sneaky.$ts@store.com" } $normAToken
Check "normal user creating store -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call POST "/stores" @{ name = "No Auth Store"; email = "noauth.$ts@store.com" } $null
Check "no token -> 401" ($r.status -eq 401) "got $($r.status)"

# ---- seed ratings: store1 -> avg 3.00, store3 -> avg 4.50, store2 -> none ----
Sql "INSERT INTO ratings (value,user_id,store_id) VALUES (4,'$normAId','$store1'),(2,'$normBId','$store1'),(5,'$normAId','$store3'),(4,'$normBId','$store3');" | Out-Null

# ============ 2) GET /stores as normal user ============
Write-Host "`n2) GET /stores - normal user (overall_rating + user_rating)" -ForegroundColor Cyan
$r = Call GET "/stores" $null $normAToken
Check "200 OK" ($r.status -eq 200) "got $($r.status)"
$s1 = $r.body | Where-Object { $_.id -eq $store1 }
$s2 = $r.body | Where-Object { $_.id -eq $store2 }
Check "user_rating field present for normal user" (HasProp $s1 'user_rating') "missing user_rating"
Check "store1 overall_rating = 3" ([decimal]$s1.overall_rating -eq [decimal]3) "got $($s1.overall_rating)"
Check "store1 user_rating (normalA) = 4" ([int]$s1.user_rating -eq 4) "got $($s1.user_rating)"
Check "store2 overall_rating = null (no ratings)" ($null -eq $s2.overall_rating) "got $($s2.overall_rating)"
Check "store2 user_rating = null (not rated by user)" ($null -eq $s2.user_rating) "got $($s2.user_rating)"

# ============ 3) GET /stores as admin (no user_rating) ============
Write-Host "`n3) GET /stores - admin (no user_rating)" -ForegroundColor Cyan
$r = Call GET "/stores" $null $adminToken
$as1 = $r.body | Where-Object { $_.id -eq $store1 }
Check "overall_rating present for admin" ([decimal]$as1.overall_rating -eq [decimal]3) "got $($as1.overall_rating)"
Check "user_rating field absent for admin" (-not (HasProp $as1 'user_rating')) "user_rating leaked"

# ============ 4) search + sort ============
Write-Host "`n4) GET /stores - search + sort" -ForegroundColor Cyan
$r = Call GET "/stores?name=Alpha" $null $adminToken
Check "name search filters to Alpha" ($r.body.Count -eq 1 -and $r.body[0].id -eq $store1) "count=$($r.body.Count)"
$r = Call GET "/stores?sortBy=rating&sortOrder=desc" $null $adminToken
$ids = $r.body | ForEach-Object { $_.id }
$idx1 = [Array]::IndexOf($ids, $store1); $idx3 = [Array]::IndexOf($ids, $store3)
Check "sort by rating desc: store3(4.5) before store1(3)" ($idx3 -lt $idx1) "idx3=$idx3 idx1=$idx1"
$r = Call GET "/stores?sortBy=bogus" $null $adminToken
Check "invalid sortBy -> 400" ($r.status -eq 400) "got $($r.status)"

# ============ 5) GET /stores/:id ============
Write-Host "`n5) GET /stores/:id" -ForegroundColor Cyan
$r = Call GET "/stores/$store1" $null $normAToken
Check "detail (normal) -> 200 with overall + user_rating" ($r.status -eq 200 -and [decimal]$r.body.overall_rating -eq [decimal]3 -and [int]$r.body.user_rating -eq 4) "body=$($r.body | ConvertTo-Json -Compress)"
$r = Call GET "/stores/$store1" $null $adminToken
Check "detail (admin) -> no user_rating" (-not (HasProp $r.body 'user_rating')) "user_rating leaked"
$r = Call GET "/stores/00000000-0000-0000-0000-000000000000" $null $adminToken
Check "unknown id -> 404" ($r.status -eq 404) "got $($r.status)"
$r = Call GET "/stores/not-a-uuid" $null $adminToken
Check "non-uuid id -> 400" ($r.status -eq 400) "got $($r.status)"

# ============ 6) GET /admin/stores ============
Write-Host "`n6) GET /admin/stores" -ForegroundColor Cyan
$r = Call GET "/admin/stores" $null $adminToken
Check "admin list -> 200" ($r.status -eq 200) "got $($r.status)"
$am1 = $r.body | Where-Object { $_.id -eq $store1 }
Check "admin list has overall_rating" ([decimal]$am1.overall_rating -eq [decimal]3) "got $($am1.overall_rating)"
Check "admin list has NO user_rating" (-not (HasProp $am1 'user_rating')) "user_rating leaked"
$r = Call GET "/admin/stores?sortBy=rating&sortOrder=desc&name=a" $null $adminToken
Check "admin list supports filter+sort -> 200" ($r.status -eq 200) "got $($r.status)"
$r = Call GET "/admin/stores" $null $normAToken
Check "normal user hitting /admin/stores -> 403" ($r.status -eq 403) "got $($r.status)"
$r = Call GET "/admin/stores" $null $null
Check "no token -> 401" ($r.status -eq 401) "got $($r.status)"

Write-Host "`n==================== RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
