@echo off
setlocal enabledelayedexpansion

echo ================================================
echo    EXPO LAN MODE - AUTOMATIC SETUP
echo ================================================
echo.

REM Get the current IPv4 address
echo [1/4] Detecting your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP_ADDR=%%a"
    set "IP_ADDR=!IP_ADDR:~1!"
    goto :ip_found
)
:ip_found
echo     Found: %IP_ADDR%
echo.

REM Check if running as admin for firewall rules
echo [2/4] Checking firewall rules...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo     Running as Administrator - Will add firewall rules

    REM Add firewall rules for Metro Bundler
    netsh advfirewall firewall show rule name="Expo Metro Bundler" >nul 2>&1
    if errorlevel 1 (
        echo     Adding Metro Bundler firewall rule...
        netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081
        netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=19000-19001
    ) else (
        echo     Firewall rules already exist
    )
) else (
    echo     NOT running as Administrator
    echo     Firewall rules may need to be added manually
    echo.
    echo     If connection fails, right-click this file and "Run as Administrator"
)
echo.

REM Clear Metro cache
echo [3/4] Clearing Metro cache...
if exist "%LOCALAPPDATA%\Temp\metro-*" (
    rmdir /s /q "%LOCALAPPDATA%\Temp\metro-*" 2>nul
)
if exist "%TEMP%\metro-*" (
    rmdir /s /q "%TEMP%\metro-*" 2>nul
)
if exist "%TEMP%\react-*" (
    rmdir /s /q "%TEMP%\react-*" 2>nul
)
echo     Cache cleared
echo.

REM Start Expo
echo [4/4] Starting Expo Dev Server...
echo.
echo ================================================
echo    Connect your device to: %IP_ADDR%:8081
echo ================================================
echo.
echo     Scan the QR code that appears below
echo     OR
echo     Open Expo Go app and enter: exp://%IP_ADDR%:8081
echo.
echo ================================================
echo.

REM Start Expo with LAN mode
set REACT_NATIVE_PACKAGER_HOSTNAME=%IP_ADDR%
npx expo start --lan --clear

pause
