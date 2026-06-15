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

# normal user + a store
$nEmail = "shopper.$ts@example.com"
Call POST "/auth/register" @{ name = "Normal Shopper User Account"; email = $nEmail; password = $pwd } | Out-Null
$nToken = (Call POST "/auth/login" @{ email = $nEmail; password = $pwd }).body.accessToken
$storeId = (Call POST "/stores" @{ name = "Flow Test Store"; email = "flow.$ts@store.com" } $adminToken).body.id
Check "setup (normal user + store)" ([bool]$nToken -and [bool]$storeId) "missing"

Write-Host "`n1) GET /stores before rating (user_rating_id null)" -ForegroundColor Cyan
$r = Call GET "/stores" $null $nToken
$s = $r.body | Where-Object { $_.id -eq $storeId }
Check "store row has user_rating + user_rating_id fields" ((HasProp $s 'user_rating') -and (HasProp $s 'user_rating_id')) "missing fields"
Check "not rated yet -> both null" ($null -eq $s.user_rating -and $null -eq $s.user_rating_id) "ur=$($s.user_rating) urid=$($s.user_rating_id)"

Write-Host "`n2) POST /ratings then list reflects it" -ForegroundColor Cyan
$created = Call POST "/ratings" @{ store_id = $storeId; value = 4 } $nToken
Check "submit -> 201" ($created.status -eq 201) "got $($created.status)"
$r = Call GET "/stores" $null $nToken
$s = $r.body | Where-Object { $_.id -eq $storeId }
Check "list now shows my rating = 4" ($s.user_rating -eq 4) "got $($s.user_rating)"
Check "user_rating_id matches created rating id" ($s.user_rating_id -eq $created.body.id) "list=$($s.user_rating_id) created=$($created.body.id)"
Check "overall_rating reflects rating (4)" ([decimal]$s.overall_rating -eq [decimal]4) "got $($s.overall_rating)"

Write-Host "`n3) PATCH /ratings/:id (edit) then list reflects it" -ForegroundColor Cyan
$r = Call PATCH "/ratings/$($s.user_rating_id)" @{ value = 5 } $nToken
Check "update -> 200, value 5" ($r.status -eq 200 -and $r.body.value -eq 5) "got $($r.status)/$($r.body.value)"
$r = Call GET "/stores" $null $nToken
$s = $r.body | Where-Object { $_.id -eq $storeId }
Check "list now shows my rating = 5" ($s.user_rating -eq 5) "got $($s.user_rating)"

Write-Host "`n4) PATCH /auth/change-password" -ForegroundColor Cyan
$newPwd = "Newpass1@"
$r = Call PATCH "/auth/change-password" @{ currentPassword = $pwd; newPassword = $newPwd } $nToken
Check "change password -> 200" ($r.status -eq 200) "got $($r.status)"
$r = Call POST "/auth/login" @{ email = $nEmail; password = $newPwd }
Check "login with new password works" ($r.status -eq 200) "got $($r.status)"
$r = Call PATCH "/auth/change-password" @{ currentPassword = "WrongOld!1"; newPassword = "Another1@" } $nToken
Check "wrong current password -> 401" ($r.status -eq 401) "got $($r.status)"

Write-Host "`n==================== RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
