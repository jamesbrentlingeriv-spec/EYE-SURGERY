import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (err2) {
          console.warn(`[Sync] Warning copying ${entry.name}: ${err2.message}`);
        }
      }
    }
  }
}

// 1. Copy all public assets to dist first
copyDirRecursive(path.join(ROOT_DIR, 'public'), DIST_DIR);

// 2. Copy dist to docs for GitHub Pages /docs support
console.log('[Sync] Copying dist to docs...');
copyDirRecursive(DIST_DIR, DOCS_DIR);

// 3. Copy production web files to root for GitHub Pages / (root) support
console.log('[Sync] Copying web production bundle to repo root...');
fs.copyFileSync(path.join(DIST_DIR, 'index.html'), path.join(ROOT_DIR, 'index.html'));
fs.copyFileSync(path.join(DIST_DIR, '404.html'), path.join(ROOT_DIR, '404.html'));
fs.copyFileSync(path.join(DIST_DIR, 'index.css'), path.join(ROOT_DIR, 'index.css'));
fs.copyFileSync(path.join(DIST_DIR, 'manifest.json'), path.join(ROOT_DIR, 'manifest.json'));
fs.copyFileSync(path.join(DIST_DIR, 'sw.js'), path.join(ROOT_DIR, 'sw.js'));
fs.copyFileSync(path.join(DIST_DIR, '.nojekyll'), path.join(ROOT_DIR, '.nojekyll'));
copyDirRecursive(path.join(ROOT_DIR, 'public', 'guides'), path.join(DIST_DIR, 'guides'));
copyDirRecursive(path.join(ROOT_DIR, 'public', 'guides'), path.join(DOCS_DIR, 'guides'));
copyDirRecursive(path.join(ROOT_DIR, 'public', 'guides'), path.join(ROOT_DIR, 'guides'));
copyDirRecursive(path.join(DIST_DIR, 'assets'), path.join(ROOT_DIR, 'assets'));
copyDirRecursive(path.join(DIST_DIR, 'images'), path.join(ROOT_DIR, 'images'));
copyDirRecursive(path.join(DIST_DIR, 'icons'), path.join(ROOT_DIR, 'icons'));
copyDirRecursive(path.join(DIST_DIR, 'audio'), path.join(ROOT_DIR, 'audio'));
// Copy video files
const publicVideos = ['cataract.mp4', 'yag.mp4', 'istent.mp4'];
for (const vid of publicVideos) {
  const srcVid = path.join(ROOT_DIR, 'public', vid);
  if (fs.existsSync(srcVid)) {
    fs.copyFileSync(srcVid, path.join(ROOT_DIR, vid));
    fs.copyFileSync(srcVid, path.join(DIST_DIR, vid));
    fs.copyFileSync(srcVid, path.join(DOCS_DIR, vid));
  }
}

console.log('[Sync] Completed successfully! Root, docs/, and dist/ are all prepared for GitHub Pages.');
