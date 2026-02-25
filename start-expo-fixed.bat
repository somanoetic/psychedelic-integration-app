@echo off
echo ================================================
echo    EXPO LAN MODE - SIMPLIFIED
echo ================================================
echo.

echo Your IP addresses:
ipconfig | findstr "IPv4"
echo.

echo Please enter your IP address from above
echo (Usually starts with 192.168.x.x or 10.x.x.x)
echo.
set /p MY_IP="Enter your IP: "

echo.
echo ================================================
echo    USING IP: %MY_IP%
echo ================================================
echo.

REM Set environment variable
set REACT_NATIVE_PACKAGER_HOSTNAME=%MY_IP%

echo Starting Expo...
echo.
echo CONNECT TO: exp://%MY_IP%:8081
echo.

npx expo start --host lan --clear

echo.
pause
