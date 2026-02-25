@echo off
echo Starting Expo in LAN mode...
echo.
echo Your current IP addresses:
ipconfig | findstr "IPv4"
echo.
echo Starting Expo now...
echo.
npx expo start --lan --clear
echo.
echo Press any key to exit...
pause >nul
