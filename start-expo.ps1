# PowerShell script for starting Expo with automatic IP detection

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   EXPO LAN MODE - PowerShell Version" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get IP address (exclude loopback and virtual adapters)
$ipAddress = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.IPAddress -notlike "192.168.56.*" -and
        $_.IPAddress -notlike "192.168.99.*"
    } |
    Select-Object -First 1 -ExpandProperty IPAddress

if ($ipAddress) {
    Write-Host "Detected IP: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "Could not auto-detect IP. Available addresses:" -ForegroundColor Yellow
    Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, InterfaceAlias | Format-Table
    $ipAddress = Read-Host "Enter your IP address"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   USING IP: $ipAddress" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variable
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ipAddress
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = $ipAddress

Write-Host "Clearing caches..." -ForegroundColor Yellow
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue }

# Kill any existing Metro processes
Write-Host "Stopping any existing Metro Bundler..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  REACT_NATIVE_PACKAGER_HOSTNAME = $ipAddress" -ForegroundColor White
Write-Host ""
Write-Host "Starting Expo Dev Server..." -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   CONNECT TO: exp://${ipAddress}:8081" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: The QR code URL should show your IP address." -ForegroundColor Yellow
Write-Host "If it shows localhost, use the URL above instead." -ForegroundColor Yellow
Write-Host ""

# Start Expo (use --host lan with environment variable set)
npx expo start --host lan --clear

Write-Host ""
Write-Host "Expo stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
