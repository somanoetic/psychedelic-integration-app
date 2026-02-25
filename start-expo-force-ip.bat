@echo off
setlocal

echo ================================================
echo    FORCING EXPO TO USE LAN IP
echo ================================================
echo.

REM Detect IP address (skip VirtualBox/Docker IPs)
echo Detecting your WiFi/Ethernet IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*10\." /C:"IPv4.*172\.16\."') do (
    set "IP_TEMP=%%a"
    set "IP_TEMP=!IP_TEMP: =!"
    REM Skip if it's a VirtualBox or Docker IP
    echo !IP_TEMP! | findstr /R "192\.168\.56\. 192\.168\.99\." >nul
    if errorlevel 1 (
        set "MY_IP=!IP_TEMP!"
        goto :ip_found
    )
)

:ip_found
if not defined MY_IP (
    echo ERROR: Could not detect IP address
    echo Your network interfaces:
    ipconfig | findstr "IPv4"
    echo.
    echo Please enter your IP address manually:
    set /p MY_IP="IP Address: "
)

echo.
echo ================================================
echo    DETECTED IP: %MY_IP%
echo ================================================
echo.

REM Set environment variables to force this IP
set REACT_NATIVE_PACKAGER_HOSTNAME=%MY_IP%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=%MY_IP%

echo Environment variables set:
echo   REACT_NATIVE_PACKAGER_HOSTNAME=%MY_IP%
echo   EXPO_DEVTOOLS_LISTEN_ADDRESS=%MY_IP%
echo.

echo Clearing Expo and Metro cache...
rd /s /q .expo 2>nul
rd /s /q node_modules\.cache 2>nul
echo.

echo Starting Expo with forced IP address...
echo.
echo ================================================
echo    CONNECT TO: exp://%MY_IP%:8081
echo ================================================
echo.
echo In Expo Go app, manually enter the URL above
echo or scan the QR code if it appears
echo.
echo ================================================
echo.

REM Start Expo with explicit host
npx expo start --host %MY_IP% --clear

echo.
echo Expo stopped.
pause
