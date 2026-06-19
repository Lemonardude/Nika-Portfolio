const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const ROOT = __dirname;
const IMAGES_DIR = path.join(ROOT, 'images');

app.use(express.static(ROOT));

app.get('/api/works', (req, res) => {
  if (!fs.existsSync(IMAGES_DIR)) {
    return res.json({ works: [] });
  }

  const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;

  const works = fs
    .readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map((dirent, index) => {
      const name = dirent.name;
      const folder = path.join(IMAGES_DIR, name);
      const files = fs.readdirSync(folder);

      const mainFile = files.find(f => /^main\./i.test(f) && IMAGE_EXT.test(f));
      if (!mainFile) return null;

      const enc = s => encodeURIComponent(s);
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

      return {
        index,
        name,
        isBig: additionalImages.length > 0,
        mainImage: `${urlBase}/${enc(mainFile)}`,
        images: additionalImages,
        ...info
      };
    })
    .filter(Boolean);

  res.json({ works });
});

app.listen(PORT, () => {
  console.log('\n  Portfolio running at http://localhost:' + PORT + '\n');
  console.log('  Add work folders inside the  images/  directory.');
  console.log('  Each folder needs a file named  Main.jpg  (or .png, .webp …)');
  console.log('  Optionally add an  info.json  for description, year, category, client.\n');
});
