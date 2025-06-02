@echo off
echo [%time%] Starting direct shutdown test...

echo [%time%] Starting Neutralino process...
start /B .\bin\neutralino-win_x64.exe --config=.\test-app\neutralino.config.json

echo [%time%] Waiting 3 seconds for startup...
timeout /t 3 /nobreak >nul

echo [%time%] Sending Ctrl+C signal...
taskkill /IM neutralino-win_x64.exe /T

echo [%time%] Checking if process terminated...
timeout /t 2 /nobreak >nul

tasklist | findstr neutralino
if %errorlevel% == 0 (
    echo [%time%] FAIL: Process still running, force killing...
    taskkill /F /IM neutralino-win_x64.exe
) else (
    echo [%time%] PASS: Process terminated gracefully
)

echo [%time%] Test completed.
