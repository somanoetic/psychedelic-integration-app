@echo off
REM This version logs everything to a file for debugging

set LOGFILE=%~dp0expo-startup.log

echo Starting Expo with logging... > "%LOGFILE%"
echo Log file: %LOGFILE%
echo.

echo ================================================ >> "%LOGFILE%"
echo Expo Startup Log - %date% %time% >> "%LOGFILE%"
echo ================================================ >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo [Checking Node.js] >> "%LOGFILE%"
node --version >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [Current Directory] >> "%LOGFILE%"
cd >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [IP Addresses] >> "%LOGFILE%"
ipconfig | findstr "IPv4" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [Checking package.json] >> "%LOGFILE%"
if exist package.json (
    echo OK - package.json exists >> "%LOGFILE%"
) else (
    echo ERROR - package.json not found! >> "%LOGFILE%"
)
echo. >> "%LOGFILE%"

echo [Starting Expo] >> "%LOGFILE%"
echo Starting Expo Dev Server...
echo See log file for details: %LOGFILE%
echo.

npx expo start --lan --clear 2>&1 | tee -a "%LOGFILE%"

echo. >> "%LOGFILE%"
echo [Expo Stopped] >> "%LOGFILE%"

echo.
echo Expo has stopped. Check log file for details:
echo %LOGFILE%
echo.
echo Press any key to exit...
pause >nul
