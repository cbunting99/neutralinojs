// Build script for Neutralinojs with shutdown improvements
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

console.log('🔨 Building Neutralinojs with shutdown improvements...\n');

const platform = os.platform();
const isWindows = platform === 'win32';
const isLinux = platform === 'linux';

try {
    if (isWindows) {
        console.log('🖥️  Building for Windows...');
        
        // Check if Visual Studio tools are available
        try {
            execSync('where msbuild', { stdio: 'ignore' });
            console.log('✅ MSBuild found');
        } catch {
            console.log('⚠️  MSBuild not found - trying alternative build...');
        }
        
        // Try different build methods
        try {
            console.log('🔄 Running build.bat...');
            execSync('build.bat', { stdio: 'inherit' });
        } catch (error) {
            console.log('⚠️  build.bat failed, trying manual build...');
            // Fallback build commands could go here
            throw error;
        }
        
    } else if (isLinux) {
        console.log('🐧 Building for Linux...');
        
        // Check dependencies
        try {
            execSync('which gcc', { stdio: 'ignore' });
            execSync('which make', { stdio: 'ignore' });
            console.log('✅ Build tools found');
        } catch {
            console.log('❌ Missing build tools. Install with:');
            console.log('   sudo apt install build-essential gcc g++ make libwebkit2gtk-4.0-dev');
            process.exit(1);
        }
        
        console.log('🔄 Running make...');
        execSync('make clean && make', { stdio: 'inherit' });
        
    } else {
        console.log('❌ Unsupported platform:', platform);
        console.log('   Supported: Windows (win32), Linux (linux)');
        process.exit(1);
    }
    
    console.log('\n✅ Build completed successfully!');
    console.log('\n🔄 Running validation...');
    
    // Run validation
    require('./validate-build.js');
    
} catch (error) {
    console.log('\n❌ Build failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    
    if (isWindows) {
        console.log('   • Install Visual Studio Build Tools');
        console.log('   • Ensure Windows SDK is installed');
        console.log('   • Try running from Developer Command Prompt');
    } else if (isLinux) {
        console.log('   • Install build dependencies:');
        console.log('     sudo apt install build-essential gcc g++ make');
        console.log('     sudo apt install libwebkit2gtk-4.0-dev');
    }
    
    process.exit(1);
}
