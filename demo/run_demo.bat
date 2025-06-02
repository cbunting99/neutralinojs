@echo off
echo ========================================
echo Neutralino Shutdown Demo
echo ========================================
echo.
echo Starting demo application...
echo.
echo To test shutdown improvements:
echo - Click "Graceful Shutdown" button
echo - Press Ctrl+C in console
echo - Press Alt+F4 in application
echo - Click the X button in app header
echo.
echo Watch the shutdown log for real-time feedback!
echo.
pause
echo Starting application...
shutdown-demo.exe
echo.
echo Demo finished.
pause
