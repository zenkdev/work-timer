const fs = require('fs');
const path = require('path');

// Read package.json to get the new version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const manifestJsonPath = path.join(__dirname, '..', 'public', 'manifest.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

// Update manifest version to match package.json version
manifestJson.version = packageJson.version;

// Write back to manifest.json
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');

console.log(`✓ Synced version ${packageJson.version} to manifest.json`);
