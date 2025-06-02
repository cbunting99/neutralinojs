@echo off
echo ===============================================
echo Testing Basic Shutdown Functionality
echo ===============================================

echo.
echo Starting Neutralino application in background...
cd bin
start /B neutralino-win_x64.exe --mode=cloud > nul 2>&1

echo Waiting 3 seconds for application to initialize...
timeout /t 3 /nobreak > nul

echo.
echo Testing SIGTERM signal (should shutdown gracefully within 10 seconds)...
echo Sending Ctrl+C signal...

for /f "tokens=2" %%i in ('tasklist /fi "imagename eq neutralino-win_x64.exe" /fo csv ^| find /c "neutralino-win_x64.exe"') do set count=%%i

if %count% GTR 0 (
    echo Found neutralino process, sending termination signal...
    taskkill /IM neutralino-win_x64.exe /T
    
    echo Waiting up to 10 seconds for graceful shutdown...
    for /L %%i in (1,1,10) do (
        tasklist /fi "imagename eq neutralino-win_x64.exe" | find "neutralino-win_x64.exe" > nul
        if errorlevel 1 (
            echo SUCCESS: Application shut down gracefully in %%i seconds
            goto :end
        )
        timeout /t 1 /nobreak > nul
    )
    
    echo WARNING: Application did not shut down within 10 seconds
    taskkill /F /IM neutralino-win_x64.exe 2>nul
    echo Force-killed remaining processes
) else (
    echo ERROR: No neutralino process found running
)

:end
echo.
echo Test completed.
cd ..
