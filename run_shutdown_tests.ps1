# Neutralino Shutdown Test Runner (PowerShell)
# This script runs comprehensive shutdown tests to verify graceful termination

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Neutralino Shutdown Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is required to run shutdown tests" -ForegroundColor Red
    Write-Host "Please install Node.js and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if the binary exists
$binaryPath = "bin\neutralino-win_x64.exe"
if (-not (Test-Path $binaryPath)) {
    Write-Host "Error: Neutralino binary not found at $binaryPath" -ForegroundColor Red
    Write-Host "Please build the project first using: python scripts\build.py" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if test app exists
$testAppPath = "test-app"
if (-not (Test-Path $testAppPath)) {
    Write-Host "Warning: Test app directory not found. Creating minimal test app..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $testAppPath -Force | Out-Null
    
    $config = @{
        applicationId = "test.shutdown"
        version = "1.0.0"
        defaultMode = "cloud"
        enableServer = $true
        modes = @{
            cloud = @{
                port = 0
            }
        }
    } | ConvertTo-Json -Depth 3
    
    $config | Out-File -FilePath "$testAppPath\neutralino.config.json" -Encoding UTF8
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Shutdown Test App</title>
</head>
<body>
    <h1>Shutdown Test App</h1>
    <p>This is a minimal test application for shutdown testing.</p>
</body>
</html>
"@
    
    $html | Out-File -FilePath "$testAppPath\index.html" -Encoding UTF8
    Write-Host "Created minimal test app" -ForegroundColor Green
}

Write-Host "Starting shutdown tests..." -ForegroundColor Yellow
Write-Host ""

# Run the test script
try {
    & node test_shutdown.js
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "All tests passed! ✓" -ForegroundColor Green
    } else {
        Write-Host "Some tests failed. Check output above for details." -ForegroundColor Red
    }
} catch {
    Write-Host "Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""
Write-Host "Tests completed." -ForegroundColor Cyan
Read-Host "Press Enter to exit"
exit $exitCode
