@echo off
echo ================================================
echo    EXPO CONNECTION DIAGNOSTICS
echo ================================================
echo.

echo [1] Network Adapter Information
echo ================================================
ipconfig | findstr /C:"Wireless LAN adapter" /C:"Ethernet adapter" /C:"IPv4"
echo.

echo [2] Your Current IP Addresses
echo ================================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP_ADDR=%%a"
    echo     IPv4:!IP_ADDR!
)
echo.

echo [3] Firewall Rules for Expo
echo ================================================
netsh advfirewall firewall show rule name=all | findstr /C:"Expo" /C:"Metro" /C:"8081" /C:"19000"
echo.

echo [4] Port Availability Check
echo ================================================
netstat -ano | findstr ":8081 :19000 :19001"
if errorlevel 1 (
    echo     Ports 8081, 19000, 19001 are FREE - Good!
) else (
    echo     Some ports are in use - see above
)
echo.

echo [5] Metro Cache Locations
echo ================================================
if exist "%LOCALAPPDATA%\Temp\metro-*" (
    echo     Metro cache found in: %LOCALAPPDATA%\Temp\
) else (
    echo     No metro cache in %LOCALAPPDATA%\Temp\
)
if exist "%TEMP%\metro-*" (
    echo     Metro cache found in: %TEMP%
) else (
    echo     No metro cache in %TEMP%
)
echo.

echo [6] Expo Installation
echo ================================================
where expo 2>nul
if errorlevel 1 (
    echo     Expo CLI not found in PATH - using npx
) else (
    expo --version 2>nul
)
echo.

echo [7] Node and NPM Versions
echo ================================================
node --version
npm --version
echo.

echo ================================================
echo    RECOMMENDATIONS
echo ================================================
echo.
echo    1. Make sure your phone is on the SAME WiFi network
echo    2. Your current IP: Use 'ipconfig' output above
echo    3. If firewall rules are missing, run start-expo-fix.bat as Administrator
echo    4. Try tunnel mode if LAN fails: start-tunnel.bat
echo.
echo    To connect manually in Expo Go:
echo    exp://YOUR_IP_FROM_ABOVE:8081
echo.
pause
