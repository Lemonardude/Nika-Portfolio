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

    // Same display order as the grid: big works first, then small
    const sorted = [...works.filter(w => w.isBig), ...works.filter(w => !w.isBig)];
    const idx    = sorted.findIndex(w => w.name === workName);
    if (idx === -1) { window.location.href = 'index.html'; return; }

    const work = sorted[idx];
    const prev = idx > 0              ? sorted[idx - 1] : null;
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

    document.title = `${work.name} — Nika`;

    // ── Title
    document.getElementById('projectTitle').textContent = work.name;

    // ── Meta (year, category, client + any extra info.json fields)
    const metaEl     = document.getElementById('projectMeta');
    const metaFields = [
      ['Year',     work.year],
      ['Category', work.category],
      ['Client',   work.client],
    ].filter(([, v]) => v);

    metaEl.innerHTML = metaFields.map(([label, value]) => `
      <div class="meta-row">
        <span class="meta-label">${esc(label)}</span>
        <span class="meta-value">${esc(value)}</span>
      </div>
    `).join('');

    // ── Description
    const descEl = document.getElementById('projectDesc');
    if (work.description) {
      descEl.innerHTML = `<p>${esc(work.description)}</p>`;
    } else {
      descEl.style.display = 'none';
    }

    // ── Media list: main first, then numbered files (deduplicated by URL)
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

    // ── Prev / next
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

// Big works: each media item fills 100vh
function buildFullscreen(mediaList, name, container) {
  container.className = 'project-fullscreen';

  mediaList.forEach((src, i) => {
    const section = document.createElement('div');
    section.className = 'project-img project-img--full';

    if (VIDEO_RE.test(src)) {
      const v = document.createElement('video');
      v.src       = src;
      v.controls  = true;
      v.playsInline = true;
      v.preload   = 'metadata';
      section.appendChild(v);
    } else {
      const img   = document.createElement('img');
      img.src     = src;
      img.alt     = `${name} — ${i + 1}`;
      img.loading = i === 0 ? 'eager' : 'lazy';
      section.appendChild(img);
    }

    container.appendChild(section);
  });
}

// Small works: 2-column mosaic, wide images span full width
function buildMosaic(mediaList, name, container) {
  container.className = 'project-mosaic';

  mediaList.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'project-img';

    if (VIDEO_RE.test(src)) {
      const v = document.createElement('video');
      v.src       = src;
      v.controls  = true;
      v.playsInline = true;
      v.preload   = 'metadata';
      item.appendChild(v);
      // Videos default to wide span
      item.classList.add('wide');
    } else {
      const img   = document.createElement('img');
      img.src     = src;
      img.alt     = `${name} — ${i + 1}`;
      img.loading = i < 2 ? 'eager' : 'lazy';

      // After loading, span wide if landscape
      const checkRatio = () => {
        if (img.naturalWidth / img.naturalHeight > 1.4) {
          item.classList.add('wide');
        }
      };
      if (img.complete) checkRatio();
      else img.addEventListener('load', checkRatio);

      item.appendChild(img);
    }

    container.appendChild(item);
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadProject();
