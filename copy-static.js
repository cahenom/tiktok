const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Copy files from dist to public directory
const filesToCopy = ['output.css', 'client.js'];

filesToCopy.forEach(file => {
    const source = path.join(__dirname, 'dist', file);
    const destination = path.join(publicDir, file);

    if (fs.existsSync(source)) {
        fs.copyFileSync(source, destination);
        console.log(`Copied ${file} to public directory`);
    } else {
        console.error(`Source file does not exist: ${source}`);
    }
});