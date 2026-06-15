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

Write-Host "`n=== FULL END-TO-END JOURNEY (all roles) ===" -ForegroundColor Yellow

Write-Host "`n[Admin] login (seeded) + dashboard" -ForegroundColor Cyan
$r = Call POST "/auth/login" @{ email = "admin@example.com"; password = "Admin@123" }
$admin = $r.body.accessToken
Check "seeded admin logs in, role=admin" ($r.status -eq 200 -and $r.body.user.role -eq "admin") "status=$($r.status)"
$stats0 = (Call GET "/admin/stats" $null $admin).body
Check "admin dashboard returns 3 KPIs" ($null -ne $stats0.total_users -and $null -ne $stats0.total_stores -and $null -ne $stats0.total_ratings) "stats=$($stats0 | ConvertTo-Json -Compress)"

Write-Host "`n[Admin] create store_owner, then a store owned by them" -ForegroundColor Cyan
$ownerEmail = "owner.$ts@example.com"
$owner = (Call POST "/users" @{ name = "Journey Store Owner Account"; email = $ownerEmail; password = $pwd; role = "store_owner" } $admin).body
Check "create store_owner -> id returned" ([bool]$owner.id) "no id"
$store = (Call POST "/stores" @{ name = "Journey Coffee House"; email = "store.$ts@store.com"; address = "1 Bean Street"; owner_id = $owner.id } $admin).body
Check "create store with owner -> id returned" ([bool]$store.id) "no id"

Write-Host "`n[Admin] store list shows the store + owner link (navigate to owner detail)" -ForegroundColor Cyan
$adminStores = (Call GET "/admin/stores?name=Journey Coffee" $null $admin).body
$row = $adminStores | Where-Object { $_.id -eq $store.id }
Check "admin store list includes Name/Email/Address/Rating" ((HasProp $row 'name') -and (HasProp $row 'email') -and (HasProp $row 'address') -and (HasProp $row 'overall_rating')) "missing cols"
Check "admin store list exposes owner_id for navigation" ($row.owner_id -eq $owner.id) "owner_id=$($row.owner_id)"
Check "admin store list exposes owner_name" ($row.owner_name -eq "Journey Store Owner Account") "owner_name=$($row.owner_name)"

Write-Host "`n[Admin] view store_owner detail (Name/Email/Address/Role + Rating)" -ForegroundColor Cyan
$detail = (Call GET "/users/$($owner.id)" $null $admin).body
Check "store_owner detail has role=store_owner" ($detail.role -eq "store_owner") "role=$($detail.role)"
Check "store_owner detail exposes avgRating field" (HasProp $detail 'avgRating') "missing avgRating"
Check "avgRating is null before any ratings" ($null -eq $detail.avgRating) "avg=$($detail.avgRating)"

Write-Host "`n[Normal] register + login + browse stores" -ForegroundColor Cyan
$nEmail = "shopper.$ts@example.com"
$reg = Call POST "/auth/register" @{ name = "Journey Normal Shopper Acct"; email = $nEmail; password = $pwd; address = "9 High Street" }
Check "normal user self-registers -> role normal" ($reg.body.user.role -eq "normal") "role=$($reg.body.user.role)"
$normal = (Call POST "/auth/login" @{ email = $nEmail; password = $pwd }).body.accessToken
$myStore = (Call GET "/stores?name=Journey Coffee" $null $normal).body | Where-Object { $_.id -eq $store.id }
Check "store listing shows name/address/overall/my-rating" ((HasProp $myStore 'name') -and (HasProp $myStore 'address') -and (HasProp $myStore 'overall_rating') -and (HasProp $myStore 'user_rating')) "missing fields"
Check "before rating: overall null, my rating null" ($null -eq $myStore.overall_rating -and $null -eq $myStore.user_rating) "ov=$($myStore.overall_rating) mr=$($myStore.user_rating)"

Write-Host "`n[Normal] submit rating, then modify it" -ForegroundColor Cyan
$rate = Call POST "/ratings" @{ store_id = $store.id; value = 5 } $normal
Check "submit rating 5 -> 201" ($rate.status -eq 201) "got $($rate.status)"
$myStore = (Call GET "/stores" $null $normal).body | Where-Object { $_.id -eq $store.id }
Check "listing now shows my rating 5 + overall 5" ($myStore.user_rating -eq 5 -and [decimal]$myStore.overall_rating -eq [decimal]5) "mr=$($myStore.user_rating) ov=$($myStore.overall_rating)"
$dup = Call POST "/ratings" @{ store_id = $store.id; value = 4 } $normal
Check "cannot rate same store twice -> 409 (graceful)" ($dup.status -eq 409 -and $dup.body.message -match "already rated") "status=$($dup.status)"
$upd = Call PATCH "/ratings/$($myStore.user_rating_id)" @{ value = 3 } $normal
Check "modify submitted rating -> 200 value 3" ($upd.status -eq 200 -and $upd.body.value -eq 3) "status=$($upd.status)"

Write-Host "`n[Normal] change password" -ForegroundColor Cyan
$cp = Call PATCH "/auth/change-password" @{ currentPassword = $pwd; newPassword = "Newpass1@" } $normal
Check "change password -> 200" ($cp.status -eq 200) "got $($cp.status)"
Check "login works with new password" ((Call POST "/auth/login" @{ email = $nEmail; password = "Newpass1@" }).status -eq 200) "login failed"

Write-Host "`n[Store Owner] login + dashboard reflects the rating" -ForegroundColor Cyan
$ownerTok = (Call POST "/auth/login" @{ email = $ownerEmail; password = $pwd }).body.accessToken
$dash = (Call GET "/store-owner/dashboard" $null $ownerTok).body
Check "owner dashboard avg rating = 3" ([decimal]$dash.avg_rating -eq [decimal]3) "avg=$($dash.avg_rating)"
$rater = $dash.raters | Where-Object { $_.email -eq $nEmail }
Check "owner dashboard lists the rater with value 3" ($rater.submitted_value -eq 3 -and [bool]$rater.name -and [bool]$rater.submitted_at) "rater=$($rater | ConvertTo-Json -Compress)"

Write-Host "`n[Admin] owner detail now reflects avg rating; stats grew" -ForegroundColor Cyan
$detail2 = (Call GET "/users/$($owner.id)" $null $admin).body
Check "store_owner detail avgRating now = 3" ([decimal]$detail2.avgRating -eq [decimal]3) "avg=$($detail2.avgRating)"
$stats1 = (Call GET "/admin/stats" $null $admin).body
Check "dashboard counts increased (users/stores/ratings)" ($stats1.total_users -gt $stats0.total_users -and $stats1.total_stores -gt $stats0.total_stores -and $stats1.total_ratings -gt $stats0.total_ratings) "before=$($stats0|ConvertTo-Json -Compress) after=$($stats1|ConvertTo-Json -Compress)"

Write-Host "`n[Guards] cross-role access control" -ForegroundColor Cyan
Check "normal user blocked from admin stats -> 403" ((Call GET "/admin/stats" $null $normal).status -eq 403) "not 403"
Check "store owner blocked from rating -> 403" ((Call POST "/ratings" @{ store_id = $store.id; value = 4 } $ownerTok).status -eq 403) "not 403"
Check "no token blocked from stores -> 401" ((Call GET "/stores" $null $null).status -eq 401) "not 401"
Check "store_owner cannot self-register (forced normal)" ((Call POST "/auth/register" @{ name = "Should Become Normal Acct"; email = "x.$ts@ex.com"; password = $pwd }).body.user.role -eq "normal") "role not forced"

Write-Host "`n==================== E2E RESULT ====================" -ForegroundColor Yellow
Write-Host "  PASSED: $pass   FAILED: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail
