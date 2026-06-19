const container = document.getElementById('worksGrid');
const header    = document.getElementById('siteHeader');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

async function loadWorks() {
  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error('manifest not found');
    const { works } = await res.json();

    if (!works || works.length === 0) {
      container.innerHTML = '<p class="state-msg">No works found — add image folders inside the <code>images/</code> directory.</p>';
      return;
    }

    container.innerHTML = '';

    const bigWorks   = works.filter(w => w.isBig);
    const smallWorks = works.filter(w => !w.isBig);

    // ── Big works — one per full row
    if (bigWorks.length) {
      const bigGrid = document.createElement('div');
      bigGrid.className = 'big-grid';
      bigWorks.forEach((work, i) => bigGrid.appendChild(makeCard(work, i, true)));
      container.appendChild(bigGrid);
    }

    // ── Small works — 3 per row
    if (smallWorks.length) {
      if (bigWorks.length) {
        const divider = document.createElement('div');
        divider.className = 'works-divider';
        divider.innerHTML = '<span>More Works</span>';
        container.appendChild(divider);
      }
      const smallGrid = document.createElement('div');
      smallGrid.className = 'small-grid';
      smallWorks.forEach((work, i) => smallGrid.appendChild(makeCard(work, i, false)));
      container.appendChild(smallGrid);
    }

  } catch {
    container.innerHTML = '<p class="state-msg">Could not load works — run <code>npm run build</code> first.</p>';
  }
}

function makeCard(work, i, isBig) {
  const num  = String(i + 1).padStart(2, '0');
  const card = document.createElement('a');
  card.className = 'work-card' + (isBig ? ' is-big' : '');
  card.href = `project.html?work=${encodeURIComponent(work.name)}`;
  card.setAttribute('aria-label', work.name);

  card.innerHTML = `
    <div class="card-img">
      <img src="${work.mainImage}" alt="${escHtml(work.name)}" loading="${i < 3 ? 'eager' : 'lazy'}">
    </div>
    <div class="card-panel">
      <span class="card-num">${num}</span>
      <h2 class="card-title">${escHtml(work.name)}</h2>
      <span class="card-cta">View Project</span>
    </div>
  `;

  return card;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadWorks();
