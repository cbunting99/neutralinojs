@echo off
echo Testing Neutralino shutdown behavior...
start /b bin\neutralino-win_x64.exe --mode=cloud --url=/ --port=8080
timeout /t 3 /nobreak >nul
echo Sending SIGINT (Ctrl+C) signal...
taskkill /im neutralino-win_x64.exe /f
echo Done.
