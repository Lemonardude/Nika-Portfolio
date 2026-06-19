const header   = document.getElementById('siteHeader');
const VIDEO_RE = /\.(mp4|webm|mov|m4v|avi)$/i;

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

const params   = new URLSearchParams(window.location.search);
const workName = params.get('work');

async function loadProject() {
  if (!workName) { window.location.href = 'index.html'; return; }

  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error();
    const { works } = await res.json();

    const idx  = works.findIndex(w => w.name === workName);
    if (idx === -1) { window.location.href = 'index.html'; return; }

    const work = works[idx];
    const prev = idx > 0              ? works[idx - 1] : null;
    const next = idx < works.length - 1 ? works[idx + 1] : null;

    document.title = `${work.name} — Nika`;
    document.getElementById('projectTitle').textContent = work.name;

    // ── Meta: year, category, client
    const metaEl     = document.getElementById('projectMeta');
    const metaFields = [
      ['Year',     work.year],
      ['Category', work.category],
      ['Client',   work.client],
    ].filter(([, v]) => v);

    metaEl.innerHTML = metaFields.map(([l, v]) => `
      <div class="meta-row">
        <span class="meta-label">${esc(l)}</span>
        <span class="meta-value">${esc(v)}</span>
      </div>`).join('');

    // ── Description (from info.json)
    const descEl = document.getElementById('projectDesc');
    if (work.description) {
      descEl.innerHTML = `<p>${esc(work.description)}</p>`;
    } else {
      descEl.style.display = 'none';
    }

    // ── Media: main first, then numerically sorted files (deduplicated)
    const seen = new Set();
    const all  = [work.mainImage, ...work.images].filter(src => {
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });

    const imagesEl = document.getElementById('projectImages');

    if (work.isBig) {
      buildFullscreen(all, work.name, imagesEl);
    } else {
      buildMosaic(all, work.name, imagesEl);
    }

    // ── Prev / next navigation
    document.getElementById('projectNav').innerHTML = `
      ${prev
        ? `<a href="project.html?work=${encodeURIComponent(prev.name)}" class="p-nav-link">
             <span class="p-nav-dir">← Previous</span>
             <span class="p-nav-name">${esc(prev.name)}</span>
           </a>`
        : '<span></span>'}
      ${next
        ? `<a href="project.html?work=${encodeURIComponent(next.name)}" class="p-nav-link is-next">
             <span class="p-nav-dir">Next →</span>
             <span class="p-nav-name">${esc(next.name)}</span>
           </a>`
        : '<span></span>'}
    `;

  } catch (err) {
    console.error(err);
    document.getElementById('projectTitle').textContent = 'Failed to load project';
  }
}

// Big works: each image/video fills the full viewport height
function buildFullscreen(media, name, container) {
  container.className = 'project-fullscreen';
  media.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'project-img--full';
    wrap.appendChild(makeMedia(src, name, i));
    container.appendChild(wrap);
  });
}

// Small works: 2-column mosaic at natural proportions
function buildMosaic(media, name, container) {
  container.className = 'project-mosaic';
  media.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'p-img';

    if (VIDEO_RE.test(src)) {
      wrap.classList.add('wide');
    } else {
      const img = makeMedia(src, name, i);
      img.addEventListener('load', () => {
        if (img.naturalWidth / img.naturalHeight > 1.4) wrap.classList.add('wide');
      });
      wrap.appendChild(img);
      container.appendChild(wrap);
      return;
    }

    wrap.appendChild(makeMedia(src, name, i));
    container.appendChild(wrap);
  });
}

function makeMedia(src, name, i) {
  if (VIDEO_RE.test(src)) {
    const v = document.createElement('video');
    v.src       = src;
    v.controls  = true;
    v.playsInline = true;
    v.preload   = 'metadata';
    return v;
  }
  const img   = document.createElement('img');
  img.src     = src;
  img.alt     = `${name} — ${i + 1}`;
  img.loading = i === 0 ? 'eager' : 'lazy';
  return img;
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadProject();
