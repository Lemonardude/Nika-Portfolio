const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');
const OUT        = path.join(__dirname, 'manifest.json');
const IMAGE_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;

if (!fs.existsSync(IMAGES_DIR)) {
  console.error('\n  Error: no images/ folder found.\n');
  process.exit(1);
}

const works = fs
  .readdirSync(IMAGES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map((dirent, index) => {
    const name   = dirent.name;
    const folder = path.join(IMAGES_DIR, name);
    const files  = fs.readdirSync(folder);

    const mainFile = files.find(f => /^main\./i.test(f) && IMAGE_EXT.test(f));
    if (!mainFile) return null;

    const enc     = s => encodeURIComponent(s);
    const urlBase = `images/${enc(name)}`;

    const additionalImages = files
      .filter(f => !(/^main\./i.test(f)) && IMAGE_EXT.test(f))
      .sort()
      .map(f => `${urlBase}/${enc(f)}`);

    let info = {};
    const infoPath = path.join(folder, 'info.json');
    if (fs.existsSync(infoPath)) {
      try { info = JSON.parse(fs.readFileSync(infoPath, 'utf-8')); } catch {}
    }

    return { index, name, isBig: additionalImages.length > 0, mainImage: `${urlBase}/${enc(mainFile)}`, images: additionalImages, ...info };
  })
  .filter(Boolean);

fs.writeFileSync(OUT, JSON.stringify({ works }, null, 2), 'utf-8');

console.log(`\n  manifest.json updated — ${works.length} work(s):\n`);
works.forEach(w => console.log(`  · ${w.name}`));
console.log('\n  Commit everything and push to GitHub.\n');
