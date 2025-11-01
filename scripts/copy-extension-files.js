import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// Files to copy from root to dist
const filesToCopy = [
  'manifest.json',
  'background.js',
  'service-worker.js'
];

// Directories to copy from root to dist
const dirsToCopy = [
  'content-scripts'
];

// Special handling for icons (copy from public/icons to dist/icons)
const iconsSrc = path.join(projectRoot, 'public', 'icons');
const iconsDest = path.join(distDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  if (fs.existsSync(iconsDest)) {
    fs.rmSync(iconsDest, { recursive: true, force: true });
  }
  fs.cpSync(iconsSrc, iconsDest, { recursive: true });
  console.log('Copied icons from public/icons to dist/icons');
}

console.log('Copying extension files...');

// Copy individual files
filesToCopy.forEach(file => {
  const srcPath = path.join(projectRoot, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file}`);
  } else {
    console.warn(`File not found: ${file}`);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const srcPath = path.join(projectRoot, dir);
  const destPath = path.join(distDir, dir);
  
  if (fs.existsSync(srcPath)) {
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`Copied directory: ${dir}`);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
});

console.log('Extension files copied successfully!');
