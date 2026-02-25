@echo off
echo ================================================
echo    EXPO LAN MODE - VERBOSE DEBUG
echo ================================================
echo.

REM Don't close on error
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1

echo Step 1: Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo OK - Node.js found
echo.

echo Step 2: Checking current directory...
cd
echo.

echo Step 3: Finding your IP address...
ipconfig | findstr "IPv4"
echo.

echo Step 4: Checking if package.json exists...
if exist package.json (
    echo OK - package.json found
) else (
    echo ERROR: package.json not found!
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo.

echo Step 5: Clearing Metro Bundler cache...
npx expo start --clear --help >nul 2>&1
if errorlevel 1 (
    echo WARNING: Expo might not be installed
    echo Attempting to continue anyway...
)
echo.

echo Step 6: Starting Expo Dev Server...
echo ================================================
echo.
echo If you see a QR code below, it worked!
echo.
echo To connect from Expo Go app:
echo 1. Scan the QR code below, OR
echo 2. Press 'w' for web preview
echo.
echo ================================================
echo.

REM Set environment variable to force LAN mode
set REACT_NATIVE_PACKAGER_HOSTNAME=
npx expo start --lan --clear

echo.
echo ================================================
echo Expo has stopped.
echo Press any key to exit...
pause >nul
