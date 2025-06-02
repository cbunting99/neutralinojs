// Clean build artifacts and temporary files
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build artifacts...\n');

const filesToClean = [
    'bin/*.obj',
    'bin/*.pdb', 
    'bin/*.ilk',
    'bin/*.log',
    'demo/resources.neu',
    'bin/resources.neu',
    'neutralinojs.log'
];

const dirsToClean = [
    'bin/Debug',
    'bin/Release'
];

let cleanedFiles = 0;
let cleanedDirs = 0;

// Clean files
filesToClean.forEach(pattern => {
    const [dir, glob] = pattern.split('/');
    try {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const extension = glob.replace('*', '');
            
            files.forEach(file => {
                if (file.endsWith(extension) || glob === file) {
                    const filePath = path.join(dir, file);
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️  Removed: ${filePath}`);
                        cleanedFiles++;
                    } catch (error) {
                        console.log(`⚠️  Could not remove: ${filePath}`);
                    }
                }
            });
        }
    } catch (error) {
        // Directory doesn't exist or permission issue
    }
});

// Clean directories
dirsToClean.forEach(dir => {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`📁 Removed directory: ${dir}`);
            cleanedDirs++;
        }
    } catch (error) {
        console.log(`⚠️  Could not remove directory: ${dir}`);
    }
});

console.log(`\n✅ Cleanup complete:`);
console.log(`   📄 Files cleaned: ${cleanedFiles}`);
console.log(`   📁 Directories cleaned: ${cleanedDirs}`);

if (cleanedFiles === 0 && cleanedDirs === 0) {
    console.log('✨ No artifacts found - project already clean!');
} else {
    console.log('\n🔨 Ready for fresh build. Run: npm run build');
}
