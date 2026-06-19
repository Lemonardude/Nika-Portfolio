const fs   = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');
const OUT        = path.join(__dirname, 'manifest.json');
const IMAGE_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
const MEDIA_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov|m4v|avi)$/i;

if (!fs.existsSync(IMAGES_DIR)) {
  console.error('\n  Error: no images/ folder found.\n');
  process.exit(1);
}

// Read featured work names (controls which appear as fullscreen hero)
let featuredNames = [];
try {
  const fp = path.join(__dirname, 'featured.json');
  if (fs.existsSync(fp)) featuredNames = JSON.parse(fs.readFileSync(fp, 'utf-8'));
} catch {}

// Sort: numeric prefix first (01_, 02_…), then locale alphabetical
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

    const enc     = s => encodeURIComponent(s);
    const urlBase = `images/${enc(name)}`;

    // Main image: prefer a file starting with "main." — fallback to first image
    let mainFile = files.find(f => /^main\./i.test(f) && IMAGE_EXT.test(f));
    if (!mainFile) {
      mainFile = files.filter(f => IMAGE_EXT.test(f)).sort(numSort)[0] || null;
    }
    if (!mainFile) return null; // no image at all — skip

    // Additional media: everything else (images + videos), sorted numerically
    const additionalMedia = files
      .filter(f => f !== mainFile && MEDIA_EXT.test(f))
      .sort(numSort)
      .map(f => `${urlBase}/${enc(f)}`);

    // Read info.json if present
    let info = {};
    const infoPath = path.join(folder, 'info.json');
    if (fs.existsSync(infoPath)) {
      try { info = JSON.parse(fs.readFileSync(infoPath, 'utf-8')); } catch {}
    }

    return {
      index,
      name,
      featured:  featuredNames.includes(name),
      isBig:     additionalMedia.length > 0,
      mainImage: `${urlBase}/${enc(mainFile)}`,
      images:    additionalMedia,
      ...info
    };
  })
  .filter(Boolean);

// Featured works appear in the order listed in featured.json
works.sort((a, b) => {
  const fi = featuredNames.indexOf(a.name);
  const fj = featuredNames.indexOf(b.name);
  if (fi !== -1 && fj !== -1) return fi - fj;
  if (fi !== -1) return -1;
  if (fj !== -1) return 1;
  return 0;
});

fs.writeFileSync(OUT, JSON.stringify({ works }, null, 2), 'utf-8');

const feat  = works.filter(w => w.featured).length;
const big   = works.filter(w => !w.featured && w.isBig).length;
const small = works.filter(w => !w.featured && !w.isBig).length;
console.log(`\n  manifest.json — ${works.length} works  [★ ${feat} featured · ◆ ${big} big · · ${small} small]\n`);
works.forEach(w =>
  console.log(`  ${w.featured ? '★' : w.isBig ? '◆' : '·'} ${w.name}`)
);
console.log('\n  Edit featured.json to change which works appear fullscreen at top.\n');
