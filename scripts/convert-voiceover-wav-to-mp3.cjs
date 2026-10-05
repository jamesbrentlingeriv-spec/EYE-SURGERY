const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'audio', 'voiceover');
const publicDir = path.join(rootDir, 'public', 'audio', 'voiceover');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
console.log(`Found ${files.length} items in ${srcDir}`);

let convertedCount = 0;

for (const file of files) {
  if (file.endsWith('.mp3.wav') || file.endsWith('.wav')) {
    const baseName = file.replace(/\.mp3\.wav$/, '').replace(/\.wav$/, '');
    const targetMp3Name = `${baseName}.mp3`;
    
    const srcFile = path.join(srcDir, file);
    const targetInPublic = path.join(publicDir, targetMp3Name);
    const targetInAudio = path.join(srcDir, targetMp3Name);

    console.log(`Converting ${file} -> ${targetMp3Name}...`);
    try {
      execSync(`ffmpeg -y -i "${srcFile}" -b:a 192k "${targetInPublic}"`, { stdio: 'ignore' });
      fs.copyFileSync(targetInPublic, targetInAudio);
      convertedCount++;
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err.message);
    }
  }
}

console.log(`Successfully converted and deployed ${convertedCount} voiceover MP3 files!`);
