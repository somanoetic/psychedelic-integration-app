@echo off
echo === Expo Debug Information ===
echo.
echo Current IP Address:
ipconfig | findstr "IPv4"
echo.
echo Firewall Status:
netsh advfirewall firewall show rule name="Expo Metro Bundler" dir=in
netsh advfirewall firewall show rule name="Expo Dev Server" dir=in
echo.
echo Starting Expo with maximum verbosity...
set DEBUG=expo:*
npx expo start --lan --clear --verbose
pause
