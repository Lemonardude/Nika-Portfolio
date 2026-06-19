const fs      = require('fs');
const path    = require('path');
const mammoth = require('mammoth');

const IMAGES_DIR = path.join(__dirname, 'images');
const OUT        = path.join(__dirname, 'manifest.json');
const IMAGE_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
const MEDIA_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov|m4v|avi)$/i;

if (!fs.existsSync(IMAGES_DIR)) {
  console.error('\n  Error: no images/ folder found.\n');
  process.exit(1);
}

// Sort by leading number, then locale-alphabetical
function numSort(a, b) {
  const na = parseInt(a.match(/^(\d+)/)?.[1] ?? 'NaN');
  const nb = parseInt(b.match(/^(\d+)/)?.[1] ?? 'NaN');
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

async function main() {
  let featuredNames = [];
  try {
    const fp = path.join(__dirname, 'featured.json');
    if (fs.existsSync(fp)) featuredNames = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {}

  const folders = fs
    .readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .sort((a, b) => numSort(a.name, b.name));

  const works = (await Promise.all(folders.map(async (dirent, index) => {
    const name    = dirent.name;
    const folder  = path.join(IMAGES_DIR, name);
    const files   = fs.readdirSync(folder);
    const urlBase = `images/${name}`;

    // Main image: prefer "main.*", fallback to first image found
    let mainFile = files.find(f => /^main\./i.test(f) && IMAGE_EXT.test(f));
    if (!mainFile) {
      mainFile = files.filter(f => IMAGE_EXT.test(f)).sort(numSort)[0] ?? null;
    }
    if (!mainFile) return null;

    // Additional media: everything except the main file, sorted numerically
    const additionalMedia = files
      .filter(f => f !== mainFile && MEDIA_EXT.test(f))
      .sort(numSort)
      .map(f => `${urlBase}/${f}`);

    // info.json (description, year, category, client, …)
    let info = {};
    const infoPath = path.join(folder, 'info.json');
    if (fs.existsSync(infoPath)) {
      try { info = JSON.parse(fs.readFileSync(infoPath, 'utf-8')); } catch {}
    }

    // docx → plain text (additional project info)
    let docxText = '';
    const docxFile = files.find(f => /\.docx$/i.test(f));
    if (docxFile) {
      try {
        const result = await mammoth.extractRawText({ path: path.join(folder, docxFile) });
        docxText = result.value.trim().replace(/\n{3,}/g, '\n\n');
      } catch {}
    }

    return {
      index,
      name,
      featured:  featuredNames.includes(name),
      isBig:     additionalMedia.length > 0,
      mainImage: `${urlBase}/${mainFile}`,
      images:    additionalMedia,
      ...(docxText && { docxText }),
      ...info
    };
  }))).filter(Boolean);

  // Featured works stay in the order defined in featured.json
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
    console.log(`  ${w.featured ? '★' : w.isBig ? '◆' : '·'} ${w.name}${w.docxText ? '  [docx]' : ''}`)
  );
  console.log('\n  Commit everything and push to GitHub.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
