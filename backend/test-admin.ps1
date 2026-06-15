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
    $b = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { try { $b = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $b = $_.ErrorDetails.Message } }
    return @{ status = $code; body = $b }
  }
}
function Check($name, $cond, $detail) {
  if ($cond) { $script:pass++; Write-Host "  PASS  $name" -ForegroundColor Green }
  else { $script:fail++; Write-Host "  FAIL  $name -- $detail" -ForegroundColor Red }
}
function HasProp($o, $p) { return ($o.PSObject.Properties.Name -contains $p) }

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$pwd = "Passw0rd!"
$adminToken = (Call POST "/auth/login" @{ email = "admin@example.com"; password = "Admin@123" }).body.accessToken
Check "seeded admin login" ([bool]$adminToken) "no token"

Write-Host "`n1) GET /admin/stats" -ForegroundColor Cyan
$r = Call GET "/admin/stats" $null $adminToken
Check "200 + numeric KPIs" ($r.status -eq 200 -and $r.body.total_users -ge 1 -and $null -ne $r.body.total_stores -and $null -ne $r.body.total_ratings) "body=$($r.body | ConvertTo-Json -Compress)"

Write-Host "`n2) GET /users/store-owners (new)" -ForegroundColor Cyan
$ownerEmail = "apowner.$ts@ex.com"
$ownerId = (Call POST "/users" @{ name = "Admin Panel Store Owner Acct"; email = $ownerEmail; password = $pwd; role = "store_owner" } $adminToken).body.id
$r = Call GET "/users/store-owners" $null $adminToken
Check "200" ($r.status -eq 200) "got $($r.status)"
$found = $r.body | Where-Object { $_.id -eq $ownerId }
Check "includes the new store owner" ([bool]$found) "not found"
Check "returns only id/name/email" ((($found.PSObject.Properties.Name | Sort-Object) -join ',') -eq "email,id,name") "props=$($found.PSObject.Properties.Name -join ',')"

Write-Host "`n3) GET /admin/stores?email= (new filter)" -ForegroundColor Cyan
Call POST "/stores" @{ name = "Zeta Mart"; email = "zeta.$ts@store.com"; owner_id = $ownerId } $adminToken | Out-Null
Call POST "/stores" @{ name = "Other Shop"; email = "other.$ts@store.com" } $adminToken | Out-Null
$r = Call GET "/admin/stores?email=zeta.$ts" $null $adminToken
Check "email filter returns only matching store" ($r.status -eq 200 -and $r.body.Count -eq 1 -and $r.body[0].name -eq "Zeta Mart") "count=$($r.body.Count)"
$r = Call GET "/admin/stores?sortBy=rating&sortOrder=desc&email=$ts" $null $adminToken
Check "email filter + sort by rating -> 200" ($r.status -eq 200) "got $($r.status)"

Write-Host "`n4) GET /users filters/sort/pagination (admin panel)" -ForegroundColor Cyan
$r = Call GET "/users?role=normal&sortBy=email&sortOrder=desc&page=1&limit=5" $null $adminToken
Check "paginated normal users -> 200" ($r.status -eq 200 -and $r.body.limit -eq 5 -and $r.body.data.Count -le 5) "limit=$($r.body.limit)"
Check "list excludes store_owners" (-not (($r.body.data | ForEach-Object { $_.role }) -contains "store_owner")) "store_owner leaked"

Write-Host "`n5) GET /users/:id store_owner avgRating (detail page)" -ForegroundColor Cyan
$r = Call GET "/users/$ownerId" $null $adminToken
Check "store_owner detail has avgRating field" (HasProp $r.body 'avgRating') "missing avgRating"

Write-Host "`n6) store-owners route did not shadow :id" -ForegroundColor Cyan
$r = Call GET "/users/00000000-0000-0000-0000-000000000000" $null $adminToken
Check "unknown user id still -> 404" ($r.status -eq 404) "got $($r.status)"

Write-Host "`n==================== RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
