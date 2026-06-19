const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');
const OUT        = path.join(__dirname, 'manifest.json');
const IMAGE_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
const VIDEO_EXT  = /\.(mp4|webm|mov|m4v|avi)$/i;
const MEDIA_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov|m4v|avi)$/i;

if (!fs.existsSync(IMAGES_DIR)) {
  console.error('\n  Error: no images/ folder found.\n');
  process.exit(1);
}

// Sort helper: numeric prefix first (01, 02…), then alphabetical
function numSort(a, b) {
  const na = parseInt(a.match(/^(\d+)/)?.[1] ?? 'NaN');
  const nb = parseInt(b.match(/^(\d+)/)?.[1] ?? 'NaN');
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

const folders = fs
  .readdirSync(IMAGES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .sort((a, b) => numSort(a.name, b.name));

const works = folders
  .map((dirent, index) => {
    const name   = dirent.name;
    const folder = path.join(IMAGES_DIR, name);
    const files  = fs.readdirSync(folder);

    const mainFile = files.find(f => /^main\./i.test(f) && IMAGE_EXT.test(f));
    if (!mainFile) return null;

    const enc     = s => encodeURIComponent(s);
    const urlBase = `images/${enc(name)}`;

    // All media except main, sorted numerically by filename
    const additionalMedia = files
      .filter(f => !(/^main\./i.test(f)) && MEDIA_EXT.test(f))
      .sort(numSort)
      .map(f => `${urlBase}/${enc(f)}`);

    let info = {};
    const infoPath = path.join(folder, 'info.json');
    if (fs.existsSync(infoPath)) {
      try { info = JSON.parse(fs.readFileSync(infoPath, 'utf-8')); } catch {}
    }

    return {
      index,
      name,
      isBig: additionalMedia.length > 0,
      mainImage: `${urlBase}/${enc(mainFile)}`,
      images: additionalMedia,
      ...info
    };
  })
  .filter(Boolean);

fs.writeFileSync(OUT, JSON.stringify({ works }, null, 2), 'utf-8');

const big   = works.filter(w => w.isBig).length;
const small = works.filter(w => !w.isBig).length;
console.log(`\n  manifest.json updated — ${works.length} work(s)  [${big} big · ${small} small]\n`);
works.forEach(w => console.log(`  ${w.isBig ? '◆' : '·'} ${w.name}`));
console.log('\n  Commit everything and push to GitHub.\n');
