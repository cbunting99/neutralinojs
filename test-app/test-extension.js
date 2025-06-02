// Test extension for shutdown testing
const process = require('process');

console.log('Test extension started');

// Keep the extension running
const keepAlive = setInterval(() => {
    console.log('Extension heartbeat...');
}, 2000);

// Handle shutdown signals
process.on('SIGTERM', () => {
    console.log('Extension received SIGTERM - cleaning up...');
    clearInterval(keepAlive);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Extension received SIGINT - cleaning up...');
    clearInterval(keepAlive);
    process.exit(0);
});

// Prevent immediate exit
process.stdin.resume();
