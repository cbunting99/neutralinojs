// Test script to verify shutdown improvements
// This script tests various shutdown scenarios to ensure graceful termination

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_CONFIG = {
    neutralinoPath: path.join(__dirname, 'bin', 'neutralino-win_x64.exe'),
    testAppPath: path.join(__dirname, 'test-app'),
    timeouts: {
        startup: 5000,    // 5 seconds for startup
        shutdown: 10000,  // 10 seconds for shutdown
        process: 3000     // 3 seconds for process operations
    }
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function addTestResult(testName, passed, details = '') {
    testResults.tests.push({ testName, passed, details });
    if (passed) {
        testResults.passed++;
        log(`✓ ${testName}`);
    } else {
        testResults.failed++;
        log(`✗ ${testName}: ${details}`);
    }
}

// Test 1: Basic shutdown with SIGTERM
async function testSigTermShutdown() {
    return new Promise((resolve) => {
        log('Testing SIGTERM shutdown...');
        
        const startTime = Date.now();
        const neutApp = spawn(TEST_CONFIG.neutralinoPath, ['--mode=cloud'], {
            cwd: TEST_CONFIG.testAppPath,
            stdio: 'pipe'
        });
        
        let hasStarted = false;
        
        neutApp.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('available at') || output.includes('port')) {
                hasStarted = true;
                log('Application started, sending SIGTERM...');
                
                // Wait a moment then send SIGTERM
                setTimeout(() => {
                    neutApp.kill('SIGTERM');
                }, 1000);
            }
        });
        
        neutApp.on('exit', (code, signal) => {
            const shutdownTime = Date.now() - startTime;
            const graceful = shutdownTime < TEST_CONFIG.timeouts.shutdown;
            
            addTestResult(
                'SIGTERM Shutdown', 
                graceful && hasStarted,
                `Shutdown time: ${shutdownTime}ms, Code: ${code}, Signal: ${signal}`
            );
            resolve();
        });
        
        // Timeout fallback
        setTimeout(() => {
            if (!neutApp.killed) {
                neutApp.kill('SIGKILL');
                addTestResult('SIGTERM Shutdown', false, 'Timeout - forced kill required');
                resolve();
            }
        }, TEST_CONFIG.timeouts.shutdown);
    });
}

// Test 2: SIGINT shutdown (Ctrl+C simulation)
async function testSigIntShutdown() {
    return new Promise((resolve) => {
        log('Testing SIGINT shutdown...');
        
        const startTime = Date.now();
        const neutApp = spawn(TEST_CONFIG.neutralinoPath, ['--mode=cloud'], {
            cwd: TEST_CONFIG.testAppPath,
            stdio: 'pipe'
        });
        
        let hasStarted = false;
        
        neutApp.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('available at') || output.includes('port')) {
                hasStarted = true;
                log('Application started, sending SIGINT...');
                
                setTimeout(() => {
                    neutApp.kill('SIGINT');
                }, 1000);
            }
        });
        
        neutApp.on('exit', (code, signal) => {
            const shutdownTime = Date.now() - startTime;
            const graceful = shutdownTime < TEST_CONFIG.timeouts.shutdown;
            
            addTestResult(
                'SIGINT Shutdown', 
                graceful && hasStarted,
                `Shutdown time: ${shutdownTime}ms, Code: ${code}, Signal: ${signal}`
            );
            resolve();
        });
        
        setTimeout(() => {
            if (!neutApp.killed) {
                neutApp.kill('SIGKILL');
                addTestResult('SIGINT Shutdown', false, 'Timeout - forced kill required');
                resolve();
            }
        }, TEST_CONFIG.timeouts.shutdown);
    });
}

// Test 3: Window mode shutdown
async function testWindowModeShutdown() {
    return new Promise((resolve) => {
        log('Testing window mode shutdown...');
        
        const startTime = Date.now();
        const neutApp = spawn(TEST_CONFIG.neutralinoPath, ['--mode=window'], {
            cwd: TEST_CONFIG.testAppPath,
            stdio: 'pipe'
        });
        
        let hasStarted = false;
        
        neutApp.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('window') || output.includes('WebView')) {
                hasStarted = true;
                log('Window mode started, sending shutdown signal...');
                
                setTimeout(() => {
                    neutApp.kill('SIGTERM');
                }, 2000); // Give window more time to initialize
            }
        });
        
        neutApp.on('exit', (code, signal) => {
            const shutdownTime = Date.now() - startTime;
            const graceful = shutdownTime < TEST_CONFIG.timeouts.shutdown;
            
            addTestResult(
                'Window Mode Shutdown', 
                graceful,
                `Shutdown time: ${shutdownTime}ms, Code: ${code}, Signal: ${signal}`
            );
            resolve();
        });
        
        setTimeout(() => {
            if (!neutApp.killed) {
                neutApp.kill('SIGKILL');
                addTestResult('Window Mode Shutdown', false, 'Timeout - forced kill required');
                resolve();
            }
        }, TEST_CONFIG.timeouts.shutdown + 5000); // Extra time for window mode
    });
}

// Test 4: Extension process cleanup
async function testExtensionCleanup() {
    return new Promise((resolve) => {
        log('Testing extension process cleanup...');
        
        // Create a test config with extensions
        const testConfig = {
            "applicationId": "js.neutralino.sample",
            "version": "1.0.0",
            "defaultMode": "cloud",
            "port": 0,
            "enableServer": true,
            "enableExtensions": true,
            "extensions": [
                {
                    "id": "test-ext",
                    "command": "node -e \"setInterval(() => console.log('Extension running'), 1000)\""
                }
            ],
            "modes": {
                "cloud": {
                    "enableServer": true
                }
            }
        };
        
        const configPath = path.join(TEST_CONFIG.testAppPath, 'neutralino.config.json.backup');
        const originalConfig = path.join(TEST_CONFIG.testAppPath, 'neutralino.config.json');
        
        // Backup original config
        if (fs.existsSync(originalConfig)) {
            fs.copyFileSync(originalConfig, configPath);
        }
        
        // Write test config
        fs.writeFileSync(originalConfig, JSON.stringify(testConfig, null, 2));
        
        const startTime = Date.now();
        const neutApp = spawn(TEST_CONFIG.neutralinoPath, ['--mode=cloud'], {
            cwd: TEST_CONFIG.testAppPath,
            stdio: 'pipe'
        });
        
        let hasStarted = false;
        let extensionStarted = false;
        
        neutApp.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('available at')) {
                hasStarted = true;
            }
            if (output.includes('Extension running')) {
                extensionStarted = true;
                log('Extension process detected, sending shutdown...');
                
                setTimeout(() => {
                    neutApp.kill('SIGTERM');
                }, 1000);
            }
        });
        
        neutApp.on('exit', (code, signal) => {
            const shutdownTime = Date.now() - startTime;
            const graceful = shutdownTime < TEST_CONFIG.timeouts.shutdown;
            
            // Restore original config
            if (fs.existsSync(configPath)) {
                fs.copyFileSync(configPath, originalConfig);
                fs.unlinkSync(configPath);
            }
            
            addTestResult(
                'Extension Cleanup', 
                graceful && hasStarted,
                `Shutdown time: ${shutdownTime}ms, Extension started: ${extensionStarted}, Code: ${code}`
            );
            resolve();
        });
        
        setTimeout(() => {
            if (!neutApp.killed) {
                neutApp.kill('SIGKILL');
                
                // Restore config on timeout
                if (fs.existsSync(configPath)) {
                    fs.copyFileSync(configPath, originalConfig);
                    fs.unlinkSync(configPath);
                }
                
                addTestResult('Extension Cleanup', false, 'Timeout - forced kill required');
                resolve();
            }
        }, TEST_CONFIG.timeouts.shutdown + 5000);
    });
}

// Test 5: Multiple rapid shutdown signals
async function testRapidShutdown() {
    return new Promise((resolve) => {
        log('Testing rapid shutdown signals...');
        
        const startTime = Date.now();
        const neutApp = spawn(TEST_CONFIG.neutralinoPath, ['--mode=cloud'], {
            cwd: TEST_CONFIG.testAppPath,
            stdio: 'pipe'
        });
        
        let hasStarted = false;
        
        neutApp.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('available at') || output.includes('port')) {
                hasStarted = true;
                log('Application started, sending rapid shutdown signals...');
                
                // Send multiple rapid signals
                setTimeout(() => {
                    neutApp.kill('SIGTERM');
                    setTimeout(() => neutApp.kill('SIGTERM'), 100);
                    setTimeout(() => neutApp.kill('SIGINT'), 200);
                }, 1000);
            }
        });
        
        neutApp.on('exit', (code, signal) => {
            const shutdownTime = Date.now() - startTime;
            const graceful = shutdownTime < TEST_CONFIG.timeouts.shutdown;
            
            addTestResult(
                'Rapid Shutdown Signals', 
                graceful && hasStarted,
                `Shutdown time: ${shutdownTime}ms, Code: ${code}, Signal: ${signal}`
            );
            resolve();
        });
        
        setTimeout(() => {
            if (!neutApp.killed) {
                neutApp.kill('SIGKILL');
                addTestResult('Rapid Shutdown Signals', false, 'Timeout - forced kill required');
                resolve();
            }
        }, TEST_CONFIG.timeouts.shutdown);
    });
}

// Test 6: Server cleanup validation
async function testServerCleanup() {
    return new Promise((resolve) => {
        log('Testing server cleanup...');
        
        const neutApp = spawn(TEST_CONFIG.neutralinoPath, ['--mode=cloud', '--port=0'], {
            cwd: TEST_CONFIG.testAppPath,
            stdio: 'pipe'
        });
        
        let serverPort = null;
        let hasStarted = false;
        
        neutApp.stdout.on('data', (data) => {
            const output = data.toString();
            const portMatch = output.match(/port[:]\s*(\d+)/i) || output.match(/available at.*:(\d+)/);
            
            if (portMatch) {
                serverPort = parseInt(portMatch[1]);
                hasStarted = true;
                log(`Server started on port ${serverPort}, testing connection then shutdown...`);
                
                // Test server is accessible
                const http = require('http');
                const req = http.request({
                    hostname: 'localhost',
                    port: serverPort,
                    path: '/',
                    timeout: 2000
                }, (res) => {
                    log('Server connection confirmed, sending shutdown...');
                    neutApp.kill('SIGTERM');
                });
                
                req.on('error', () => {
                    log('Server connection failed, but proceeding with shutdown test...');
                    neutApp.kill('SIGTERM');
                });
                
                req.end();
            }
        });
        
        neutApp.on('exit', (code, signal) => {
            if (serverPort) {
                // Test if port is properly released
                const testSocket = require('net').createServer();
                testSocket.listen(serverPort, () => {
                    testSocket.close();
                    addTestResult('Server Cleanup', true, `Port ${serverPort} properly released`);
                    resolve();
                });
                
                testSocket.on('error', () => {
                    addTestResult('Server Cleanup', false, `Port ${serverPort} still in use after shutdown`);
                    resolve();
                });
            } else {
                addTestResult('Server Cleanup', false, 'Could not determine server port');
                resolve();
            }
        });
        
        setTimeout(() => {
            if (!neutApp.killed) {
                neutApp.kill('SIGKILL');
                addTestResult('Server Cleanup', false, 'Timeout - forced kill required');
                resolve();
            }
        }, TEST_CONFIG.timeouts.shutdown);
    });
}

// Main test runner
async function runShutdownTests() {
    log('Starting Neutralino shutdown tests...');
    log('='.repeat(50));
    
    // Check if binary exists
    if (!fs.existsSync(TEST_CONFIG.neutralinoPath)) {
        log(`Error: Neutralino binary not found at ${TEST_CONFIG.neutralinoPath}`);
        log('Please build the project first using: python scripts/build.py');
        process.exit(1);
    }
    
    // Check if test app exists
    if (!fs.existsSync(TEST_CONFIG.testAppPath)) {
        log(`Error: Test app not found at ${TEST_CONFIG.testAppPath}`);
        process.exit(1);
    }
    
    try {
        // Run all tests sequentially
        await testSigTermShutdown();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
        
        await testSigIntShutdown();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testWindowModeShutdown();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testExtensionCleanup();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testRapidShutdown();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testServerCleanup();
        
    } catch (error) {
        log(`Test error: ${error.message}`);
    }
    
    // Print results
    log('='.repeat(50));
    log('Test Results:');
    log(`Passed: ${testResults.passed}`);
    log(`Failed: ${testResults.failed}`);
    log(`Total:  ${testResults.tests.length}`);
    log('');
    
    if (testResults.failed > 0) {
        log('Failed tests:');
        testResults.tests
            .filter(t => !t.passed)
            .forEach(t => log(`  ✗ ${t.testName}: ${t.details}`));
    }
    
    log('='.repeat(50));
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle script termination
process.on('SIGINT', () => {
    log('Test script interrupted');
    process.exit(1);
});

// Run tests
runShutdownTests().catch(error => {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
});
