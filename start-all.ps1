# Starts every AgriShield service in its own window, then the frontend.
# Run from D:\AgriShield-Complete\dev:
#   powershell -ExecutionPolicy Bypass -File .\start-all.ps1

$root = $PSScriptRoot
$skip = @('node_modules', 'shared', 'frontend')

# Every folder (up to 2 levels deep) that has its own package.json is a service.
$services = Get-ChildItem -Path $root -Recurse -Depth 2 -Filter package.json |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  Where-Object { $skip -notcontains $_.Directory.Name } |
  Where-Object { $_.Directory.FullName -ne $root } |
  Sort-Object { $_.Directory.Name }

function Start-Service-Window($dir, $name) {
  $pkg = Get-Content (Join-Path $dir 'package.json') -Raw | ConvertFrom-Json
  $run = if ($pkg.scripts.dev) { 'npm run dev' } elseif ($pkg.scripts.start) { 'npm start' } else { 'node server.js' }
  $cmd = "`$host.UI.RawUI.WindowTitle = '$name'; Set-Location '$dir'; " +
         "if (!(Test-Path node_modules)) { Write-Host 'Installing packages...'; npm install }; $run"
  Start-Process powershell -ArgumentList '-NoExit', '-Command', $cmd
  Write-Host "  started  $name  ($run)" -ForegroundColor Green
}

Write-Host "`nStarting services:" -ForegroundColor Cyan
foreach ($s in $services) {
  Start-Service-Window $s.Directory.FullName $s.Directory.Name
  Start-Sleep -Milliseconds 800
}

$fe = Join-Path $root 'frontend'
if (Test-Path (Join-Path $fe 'package.json')) {
  Start-Sleep -Seconds 3
  Start-Service-Window $fe 'frontend'
}

Write-Host "`nGive them about 20 seconds, then run:  powershell -ExecutionPolicy Bypass -File .\check-services.ps1`n" -ForegroundColor Cyan