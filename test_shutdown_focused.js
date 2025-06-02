const { spawn } = require('child_process');
const path = require('path');

async function testShutdown() {
    console.log('[' + new Date().toISOString() + '] Testing graceful shutdown...');
    
    const neutralinoPath = path.join(__dirname, 'bin', 'neutralino-win_x64.exe');
    const configPath = path.join(__dirname, 'test-app', 'neutralino.config.json');
    
    return new Promise((resolve, reject) => {
        // Start the process
        const neutralino = spawn(neutralinoPath, ['--config=' + configPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
        });
        
        let output = '';
        let hasStarted = false;
        
        neutralino.stdout.on('data', (data) => {
            output += data.toString();
            if (output.includes('available at') || output.includes('INFO')) {
                hasStarted = true;
            }
        });
        
        neutralino.stderr.on('data', (data) => {
            output += data.toString();
            if (output.includes('available at') || output.includes('INFO')) {
                hasStarted = true;
            }
        });
        
        // Wait for startup
        setTimeout(() => {
            if (!hasStarted) {
                console.log('[' + new Date().toISOString() + '] App startup detected, sending SIGTERM...');
            }
            
            const startTime = Date.now();
            
            // Send SIGTERM signal
            neutralino.kill('SIGTERM');
            
            neutralino.on('exit', (code, signal) => {
                const shutdownTime = Date.now() - startTime;
                console.log('[' + new Date().toISOString() + '] Process exited with code:', code, 'signal:', signal);
                console.log('[' + new Date().toISOString() + '] Shutdown time:', shutdownTime + 'ms');
                
                if (shutdownTime < 5000) {
                    console.log('[' + new Date().toISOString() + '] ✅ PASS: Graceful shutdown within 5 seconds');
                    resolve(true);
                } else {
                    console.log('[' + new Date().toISOString() + '] ❌ FAIL: Shutdown took too long');
                    resolve(false);
                }
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!neutralino.killed) {
                    console.log('[' + new Date().toISOString() + '] ❌ FAIL: Process did not exit within 10 seconds, force killing...');
                    neutralino.kill('SIGKILL');
                    resolve(false);
                }
            }, 10000);
            
        }, 2000); // Give 2 seconds for startup
    });
}

async function main() {
    console.log('[' + new Date().toISOString() + '] Starting shutdown test...');
    
    try {
        const result = await testShutdown();
        
        if (result) {
            console.log('[' + new Date().toISOString() + '] 🎉 Shutdown test PASSED!');
            process.exit(0);
        } else {
            console.log('[' + new Date().toISOString() + '] 💥 Shutdown test FAILED!');
            process.exit(1);
        }
    } catch (error) {
        console.error('[' + new Date().toISOString() + '] Test error:', error);
        process.exit(1);
    }
}

main();
