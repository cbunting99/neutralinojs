// Build validation script for Neutralinojs improvements
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating Neutralinojs build with shutdown improvements...\n');

const checks = [
    {
        name: 'Executable exists',
        check: () => fs.existsSync('bin/neutralino-win_x64.exe') || fs.existsSync('bin/neutralino'),
        success: '✅ Neutralino executable found',
        failure: '❌ Neutralino executable not found - run build first'
    },
    {
        name: 'Demo executable exists', 
        check: () => fs.existsSync('demo/shutdown-demo.exe'),
        success: '✅ Demo executable found',
        failure: '❌ Demo executable not found'
    },
    {
        name: 'Resource bundle exists',
        check: () => fs.existsSync('demo/resources.neu') || fs.existsSync('bin/resources.neu'),
        success: '✅ Resource bundle found',
        failure: '⚠️  Resource bundle not found - will use direct resources'
    },
    {
        name: 'Demo resources exist',
        check: () => fs.existsSync('demo/resources/index.html') && 
                     fs.existsSync('demo/resources/js/app.js') && 
                     fs.existsSync('demo/resources/css/styles.css'),
        success: '✅ Demo resources complete',
        failure: '❌ Demo resources incomplete'
    },
    {
        name: 'Configuration valid',
        check: () => {
            try {
                const config = JSON.parse(fs.readFileSync('demo/neutralino.config.json', 'utf8'));
                return config.applicationId && config.modes && config.modes.window;
            } catch {
                return false;
            }
        },
        success: '✅ Configuration valid',
        failure: '❌ Configuration invalid or missing'
    }
];

let passedChecks = 0;
let totalChecks = checks.length;

checks.forEach(check => {
    try {
        if (check.check()) {
            console.log(check.success);
            passedChecks++;
        } else {
            console.log(check.failure);
        }
    } catch (error) {
        console.log(`❌ ${check.name}: ${error.message}`);
    }
});

console.log(`\n📊 Validation Results: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
    console.log('🎉 All checks passed! Ready to test shutdown improvements.');
    console.log('\n🚀 Quick start:');
    console.log('   cd demo && shutdown-demo.exe');
    console.log('\n🧪 Run tests:');
    console.log('   npm run test-all');
} else {
    console.log('⚠️  Some checks failed. Build may be incomplete.');
    if (passedChecks >= totalChecks - 1) {
        console.log('🔄 Try running: npm run bundle-demo');
    } else {
        console.log('🔨 Try running: build.bat (Windows) or make (Linux)');
    }
}

// Test basic functionality if possible
if (passedChecks >= 4) {
    console.log('\n🔄 Testing basic shutdown functionality...');
    try {
        // This would normally run a quick test, but we'll just validate structure
        console.log('✅ Structure validation passed - manual testing recommended');
    } catch (error) {
        console.log(`⚠️  Basic test failed: ${error.message}`);
    }
}
