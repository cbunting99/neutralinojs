@echo off
REM Neutralino Shutdown Test Runner
REM This script runs comprehensive shutdown tests to verify graceful termination

echo ========================================
echo Neutralino Shutdown Test Runner
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is required to run shutdown tests
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Check if the binary exists
if not exist "bin\neutralino-win_x64.exe" (
    echo Error: Neutralino binary not found
    echo Please build the project first using: python scripts\build.py
    pause
    exit /b 1
)

REM Check if test app exists
if not exist "test-app" (
    echo Error: Test app directory not found
    echo Creating minimal test app...
    mkdir test-app
    echo {"applicationId":"test.shutdown","version":"1.0.0","defaultMode":"cloud","enableServer":true,"modes":{"cloud":{"port":0}}} > test-app\neutralino.config.json
    echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>Test^</title^>^</head^>^<body^>^<h1^>Shutdown Test App^</h1^>^</body^>^</html^> > test-app\index.html
)

echo Running shutdown tests...
echo.

REM Run the test script
node test_shutdown.js

echo.
echo Tests completed. Check the output above for results.
pause
