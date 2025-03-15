const fs = require('fs');
const path = require('path');

// Create the output directories if they don't exist
const outDir = path.join(__dirname, 'out');
const uiDir = path.join(outDir, 'ui');
const templatesDir = path.join(uiDir, 'templates');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}
if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir);
}
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir);
}

// Copy the HTML template
const sourceTemplate = path.join(__dirname, 'src', 'ui', 'templates', 'streamControl.html');
const targetTemplate = path.join(templatesDir, 'streamControl.html');

fs.copyFileSync(sourceTemplate, targetTemplate);
console.log('Assets copied successfully!'); 