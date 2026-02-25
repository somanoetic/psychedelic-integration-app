@echo off
echo ================================================
echo    EXPO TUNNEL MODE (Recommended if LAN fails)
echo ================================================
echo.
echo Tunnel mode is slower but works through:
echo  - Any firewall configuration
echo  - Different WiFi networks
echo  - Corporate/restricted networks
echo.
echo Starting Expo with tunnel...
echo.
echo ================================================
echo   Just scan the QR code that appears!
echo ================================================
echo.

npx expo start --tunnel --clear

echo.
echo Expo stopped.
pause
