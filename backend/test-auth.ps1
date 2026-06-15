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
    $content = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      try { $content = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $content = $_.ErrorDetails.Message }
    }
    return @{ status = $code; body = $content }
  }
}

function Check($name, $cond, $detail) {
  if ($cond) { $script:pass++; Write-Host "  PASS  $name" -ForegroundColor Green }
  else { $script:fail++; Write-Host "  FAIL  $name -- $detail" -ForegroundColor Red }
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "normal.user.$ts@example.com"
$validName = "Testing Normal User Account Number One"
$pwd = "Passw0rd!"
$newPwd = "Newpass1@"

Write-Host "`n1) Register - invalid (short name + weak password)" -ForegroundColor Cyan
$r = Call POST "/auth/register" @{ name = "Short"; email = "bad@x.com"; password = "weak" }
Check "rejected with 400" ($r.status -eq 400) "got $($r.status)"
Check "standardized error shape (statusCode/message/path/timestamp)" ($r.body.statusCode -eq 400 -and $r.body.path -eq "/auth/register" -and $r.body.timestamp -and $r.body.message) "body=$($r.body | ConvertTo-Json -Compress)"
Check "validation lists multiple messages" ($r.body.message.Count -ge 2) "messages=$($r.body.message -join '; ')"

Write-Host "`n2) Register - valid normal user" -ForegroundColor Cyan
$r = Call POST "/auth/register" @{ name = $validName; email = $email; password = $pwd; address = "221B Baker Street, London" }
Check "created with 201" ($r.status -eq 201) "got $($r.status)"
Check "role defaults to 'normal'" ($r.body.user.role -eq "normal") "role=$($r.body.user.role)"
Check "password hash NOT returned" ($null -eq $r.body.user.password) "leaked password field"

Write-Host "`n3) Register - duplicate email" -ForegroundColor Cyan
$r = Call POST "/auth/register" @{ name = $validName; email = $email; password = $pwd }
Check "rejected with 409 conflict" ($r.status -eq 409) "got $($r.status)"

Write-Host "`n4) Login - wrong password" -ForegroundColor Cyan
$r = Call POST "/auth/login" @{ email = $email; password = "Wrong0rd!" }
Check "rejected with 401" ($r.status -eq 401) "got $($r.status)"
Check "generic message (no enumeration)" ($r.body.message -eq "Invalid email or password") "msg=$($r.body.message)"

Write-Host "`n5) Login - valid" -ForegroundColor Cyan
$r = Call POST "/auth/login" @{ email = $email; password = $pwd }
Check "200 OK" ($r.status -eq 200) "got $($r.status)"
$token = $r.body.accessToken
Check "accessToken returned" ([bool]$token) "no token"
Check "user.role returned for routing" ($r.body.user.role -eq "normal") "role=$($r.body.user.role)"

Write-Host "`n6) JWT payload contents" -ForegroundColor Cyan
$parts = $token.Split(".")
$p = $parts[1].Replace('-', '+').Replace('_', '/'); while ($p.Length % 4) { $p += "=" }
$payload = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($p)) | ConvertFrom-Json
Check "payload has sub (userId)" ([bool]$payload.sub) "sub=$($payload.sub)"
Check "payload has email" ($payload.email -eq $email) "email=$($payload.email)"
Check "payload has role" ($payload.role -eq "normal") "role=$($payload.role)"
Check "payload has exp (expiry set)" ([bool]$payload.exp) "no exp"

Write-Host "`n7) Change password - no token" -ForegroundColor Cyan
$r = Call PATCH "/auth/change-password" @{ currentPassword = $pwd; newPassword = $newPwd }
Check "rejected with 401" ($r.status -eq 401) "got $($r.status)"

Write-Host "`n8) Change password - wrong current password" -ForegroundColor Cyan
$r = Call PATCH "/auth/change-password" @{ currentPassword = "Nope0rd!"; newPassword = $newPwd } $token
Check "rejected with 401" ($r.status -eq 401) "got $($r.status)"

Write-Host "`n9) Change password - new password fails policy" -ForegroundColor Cyan
$r = Call PATCH "/auth/change-password" @{ currentPassword = $pwd; newPassword = "alllower" } $token
Check "rejected with 400" ($r.status -eq 400) "got $($r.status)"

Write-Host "`n10) Change password - valid" -ForegroundColor Cyan
$r = Call PATCH "/auth/change-password" @{ currentPassword = $pwd; newPassword = $newPwd } $token
Check "200 OK" ($r.status -eq 200) "got $($r.status)"
Check "success message" ($r.body.message -match "updated") "msg=$($r.body.message)"

Write-Host "`n11) Login with NEW password" -ForegroundColor Cyan
$r = Call POST "/auth/login" @{ email = $email; password = $newPwd }
Check "200 OK" ($r.status -eq 200) "got $($r.status)"

Write-Host "`n12) Login with OLD password now fails" -ForegroundColor Cyan
$r = Call POST "/auth/login" @{ email = $email; password = $pwd }
Check "rejected with 401" ($r.status -eq 401) "got $($r.status)"

Write-Host "`n13) Change password - reuse same password" -ForegroundColor Cyan
$r2 = Call POST "/auth/login" @{ email = $email; password = $newPwd }
$r = Call PATCH "/auth/change-password" @{ currentPassword = $newPwd; newPassword = $newPwd } $r2.body.accessToken
Check "rejected with 400 (must differ)" ($r.status -eq 400) "got $($r.status)"

Write-Host "`n14) Unknown field rejected (whitelist)" -ForegroundColor Cyan
$r = Call POST "/auth/register" @{ name = $validName; email = "x.$ts@example.com"; password = $pwd; role = "admin" }
Check "extra 'role' field rejected with 400" ($r.status -eq 400) "got $($r.status) - privilege escalation guard"

Write-Host "`n==================== RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
