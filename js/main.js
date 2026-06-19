const header      = document.getElementById('siteHeader');
const featuredEl  = document.getElementById('featuredSection');
const mosaicEl    = document.getElementById('mosaicGrid');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

async function loadWorks() {
  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error();
    const { works } = await res.json();

    if (!works?.length) {
      featuredEl.innerHTML = '<p class="state-msg">No works found — add folders to images/ and run BUILD.bat</p>';
      return;
    }

    const featured = works.filter(w => w.featured);
    const rest     = works.filter(w => !w.featured);

    // ── Featured: fullscreen hero items
    featuredEl.innerHTML = '';
    featured.forEach((work, i) => {
      const a = document.createElement('a');
      a.className = 'featured-item';
      a.href = `project.html?work=${encodeURIComponent(work.name)}`;

      const img = document.createElement('img');
      img.src     = work.mainImage;
      img.alt     = work.displayName || work.name;
      img.loading = i === 0 ? 'eager' : 'lazy';

      const overlay = document.createElement('div');
      overlay.className = 'featured-overlay';
      overlay.innerHTML = `
        <h2 class="featured-title">${esc(work.displayName || work.name)}</h2>
        <span class="featured-cta">View Project →</span>
      `;

      a.appendChild(img);
      a.appendChild(overlay);
      featuredEl.appendChild(a);
    });

    // ── Mosaic: all other works at natural image proportions
    mosaicEl.innerHTML = '';
    rest.forEach((work, i) => {
      const a = document.createElement('a');
      a.className = 'mosaic-tile';
      a.href = `project.html?work=${encodeURIComponent(work.name)}`;
      a.setAttribute('aria-label', work.displayName || work.name);

      const img = document.createElement('img');
      img.src     = work.mainImage;
      img.alt     = work.displayName || work.name;
      img.loading = 'lazy';
      img.decoding = 'async';

      const overlay = document.createElement('div');
      overlay.className = 'mosaic-overlay';
      overlay.innerHTML = `<span class="mosaic-name">${esc(work.displayName || work.name)}</span>`;

      a.appendChild(img);
      a.appendChild(overlay);
      mosaicEl.appendChild(a);
    });

  } catch {
    featuredEl.innerHTML = '<p class="state-msg">Could not load works — run BUILD.bat first</p>';
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadWorks();
