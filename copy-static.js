const fs = require('fs');
const path = require('path');

// Copy files from dist to root
const filesToCopy = ['output.css', 'client.js'];

filesToCopy.forEach(file => {
    const source = path.join(__dirname, 'dist', file);
    const destination = path.join(__dirname, file);
    
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, destination);
        console.log(`Copied ${file} to root directory`);
    } else {
        console.error(`Source file does not exist: ${source}`);
    }
});