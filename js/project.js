const header = document.getElementById('siteHeader');

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

    // Keep same display order as the grid: big works first, then small
    const sorted = [...works.filter(w => w.isBig), ...works.filter(w => !w.isBig)];

    const idx = sorted.findIndex(w => w.name === workName);
    if (idx === -1) { window.location.href = 'index.html'; return; }

    const work = sorted[idx];
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

    document.title = `${work.name} — Nika`;
    document.getElementById('projectTitle').textContent = work.name;

    if (!work.isBig) document.body.classList.add('small-work');

    // Meta
    const metaEl    = document.getElementById('projectMeta');
    const metaFields = [
      ['Year',     work.year],
      ['Category', work.category],
      ['Client',   work.client],
    ].filter(([, v]) => v);

    if (metaFields.length) {
      metaEl.innerHTML = metaFields.map(([label, value]) => `
        <div class="meta-row">
          <span class="meta-label">${escHtml(label)}</span>
          <span class="meta-value">${escHtml(value)}</span>
        </div>
      `).join('');
    }

    // Description
    const descEl = document.getElementById('projectDesc');
    if (work.description) {
      descEl.innerHTML = `<p>${escHtml(work.description)}</p>`;
    } else {
      descEl.style.display = 'none';
    }

    // Images
    const imagesEl = document.getElementById('projectImages');
    if (work.isBig) {
      // Big work: main image + all additional images stacked
      const all = [work.mainImage, ...work.images];
      imagesEl.innerHTML = all.map((src, i) => `
        <div class="project-img">
          <img src="${src}" alt="${escHtml(work.name)} — image ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
        </div>
      `).join('');
    } else {
      // Small work: only the main image, centered
      imagesEl.innerHTML = `
        <div class="project-img project-img--solo">
          <img src="${work.mainImage}" alt="${escHtml(work.name)}" loading="eager">
        </div>
      `;
    }

    // Prev / next
    document.getElementById('projectNav').innerHTML = `
      ${prev
        ? `<a href="project.html?work=${encodeURIComponent(prev.name)}" class="p-nav-link">
             <span class="p-nav-dir">← Previous</span>
             <span class="p-nav-name">${escHtml(prev.name)}</span>
           </a>`
        : '<span></span>'}
      ${next
        ? `<a href="project.html?work=${encodeURIComponent(next.name)}" class="p-nav-link is-next">
             <span class="p-nav-dir">Next →</span>
             <span class="p-nav-name">${escHtml(next.name)}</span>
           </a>`
        : '<span></span>'}
    `;

  } catch (err) {
    console.error(err);
    document.getElementById('projectTitle').textContent = 'Failed to load project';
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadProject();
