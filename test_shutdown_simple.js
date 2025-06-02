const { spawn } = require('child_process');
const path = require('path');

console.log('[TEST] Starting simple shutdown test...');

// Path to the neutralino executable
const neutralinoPath = path.join(__dirname, 'bin', 'neutralino-win_x64.exe');

console.log('[TEST] Starting Neutralino process...');

// Start neutralino in window mode
const neuProcess = spawn(neutralinoPath, [
    '--mode=window',
    '--enable-inspector=false',
    '--url=/'
], {
    cwd: path.join(__dirname, 'bin'),
    stdio: ['pipe', 'pipe', 'pipe']
});

let startupComplete = false;

// Monitor stdout for startup completion
neuProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[STDOUT]', output.trim());
    
    if (output.includes('is available at http://')) {
        startupComplete = true;
        console.log('[TEST] Startup completed! Testing shutdown...');
        
        // Wait 2 seconds then test shutdown
        setTimeout(() => {
            console.log('[TEST] Sending SIGTERM to test graceful shutdown...');
            const startTime = Date.now();
            
            // Kill the process with SIGTERM
            neuProcess.kill('SIGTERM');
            
            // Set a timeout to check if process shuts down gracefully
            const shutdownTimeout = setTimeout(() => {
                const elapsed = Date.now() - startTime;
                console.log(`[TEST] Process did not shut down gracefully within 10 seconds (${elapsed}ms)`);
                console.log('[TEST] Force killing process...');
                neuProcess.kill('SIGKILL');
            }, 10000);
            
            neuProcess.on('exit', (code, signal) => {
                clearTimeout(shutdownTimeout);
                const elapsed = Date.now() - startTime;
                console.log(`[TEST] Process exited with code ${code}, signal ${signal} after ${elapsed}ms`);
                
                if (elapsed < 5000) {
                    console.log('[TEST] ✅ PASS: Process shut down gracefully within 5 seconds');
                } else {
                    console.log('[TEST] ❌ FAIL: Process took too long to shut down');
                }
                process.exit(0);
            });
        }, 2000);
    }
});

// Monitor stderr
neuProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.log('[STDERR]', output.trim());
});

// Handle process errors
neuProcess.on('error', (error) => {
    console.log('[ERROR] Failed to start process:', error.message);
    process.exit(1);
});

// Safety timeout - kill test after 30 seconds
setTimeout(() => {
    console.log('[TEST] Test timeout after 30 seconds');
    if (neuProcess && !neuProcess.killed) {
        neuProcess.kill('SIGKILL');
    }
    process.exit(1);
}, 30000);
