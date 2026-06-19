const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app        = express();
const PORT       = 3000;
const IMAGES_DIR = path.join(__dirname, 'images');
const IMAGE_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
const MEDIA_EXT  = /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov|m4v|avi)$/i;

app.use(express.static(__dirname));

function numSort(a, b) {
  const na = parseInt(a.match(/^(\d+)/)?.[1] ?? 'NaN');
  const nb = parseInt(b.match(/^(\d+)/)?.[1] ?? 'NaN');
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

app.get('/api/works', (req, res) => {
  if (!fs.existsSync(IMAGES_DIR)) return res.json({ works: [] });

  let featuredNames = [];
  try {
    const fp = path.join(__dirname, 'featured.json');
    if (fs.existsSync(fp)) featuredNames = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {}

  const folders = fs
    .readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .sort((a, b) => numSort(a.name, b.name));

  const works = folders
    .map((dirent, index) => {
      const name   = dirent.name;
      const folder = path.join(IMAGES_DIR, name);
      const files  = fs.readdirSync(folder);
      const enc    = s => encodeURIComponent(s);
      const urlBase = `images/${enc(name)}`;

      let mainFile = files.find(f => /^main\./i.test(f) && IMAGE_EXT.test(f));
      if (!mainFile) {
        mainFile = files.filter(f => IMAGE_EXT.test(f)).sort(numSort)[0] || null;
      }
      if (!mainFile) return null;

      const additionalMedia = files
        .filter(f => f !== mainFile && MEDIA_EXT.test(f))
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
        featured:  featuredNames.includes(name),
        isBig:     additionalMedia.length > 0,
        mainImage: `${urlBase}/${enc(mainFile)}`,
        images:    additionalMedia,
        ...info
      };
    })
    .filter(Boolean);

  works.sort((a, b) => {
    const fi = featuredNames.indexOf(a.name);
    const fj = featuredNames.indexOf(b.name);
    if (fi !== -1 && fj !== -1) return fi - fj;
    if (fi !== -1) return -1;
    if (fj !== -1) return 1;
    return 0;
  });

  res.json({ works });
});

app.listen(PORT, () => {
  console.log('\n  Portfolio running at http://localhost:' + PORT + '\n');
  console.log('  · Edit featured.json to set the 3 fullscreen hero works');
  console.log('  · Name files 1.jpg, 2.jpg … inside each folder for ordering');
  console.log('  · Add info.json for description, year, category, client\n');
});
