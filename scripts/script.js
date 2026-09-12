let completedGames = [];
let activePlatform = 'ALL';
let searchQuery = '';

const grid = document.getElementById('game-grid');
const searchInput = document.getElementById('search');
const platformTabs = document.getElementById('platform-tabs');
const countDisplay = document.getElementById('count');

function normalizePlatform(platform = '') {
  const p = platform.trim().toUpperCase();
  if (p.startsWith('PC')) return 'PC';
  if (p === 'PS4') return 'PLAYSTATION';
  return p || 'OTHER';
}

function getPlatformClass(normalizedPlatform = '') {
  if (normalizedPlatform === 'PC') return 'pc';
  if (normalizedPlatform.includes('XBOX')) return 'xbox';
  if (normalizedPlatform.includes('PLAYSTATION')) return 'playstation';
  if (normalizedPlatform.includes('NINTENDO')) return 'nintendo';
  return 'pc';
}

function getFilteredGames() {
  const filtered = completedGames.filter(item => {
    const itemPlatform = normalizePlatform(item.platform);
    const matchesPlatform = activePlatform === 'ALL' || itemPlatform === activePlatform;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery);

    return matchesPlatform && matchesSearch;
  });

  return filtered.sort((a, b) => 
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true })
  );
}

function renderGames() {
  const items = getFilteredGames();
  grid.innerHTML = '';
  countDisplay.textContent = items.length;

  if (items.length === 0) {
    grid.innerHTML = `<p style="color: var(--text-muted); padding: 2rem; grid-column: 1 / -1;">No games found.</p>`;
    return;
  }

  // Group games by first character or '#'
  const groups = items.reduce((acc, item) => {
    const firstChar = item.title.trim().charAt(0).toUpperCase();
    const key = /[0-9]/.test(firstChar) ? '#' : (/[A-Z]/.test(firstChar) ? firstChar : '#');

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  });

  const fragment = document.createDocumentFragment();

  sortedKeys.forEach(letter => {
    const section = document.createElement('section');
    section.className = 'alphabet-section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <span class="section-letter">${letter}</span>
      <span class="section-count">${groups[letter].length}</span>
    `;
    section.appendChild(header);

    const subGrid = document.createElement('div');
    subGrid.className = 'section-grid';

    groups[letter].forEach(item => {
      const card = document.createElement('a');
      card.className = 'card';
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.href = `https://rawg.io/search?query=${encodeURIComponent(item.title)}`;

      const normalizedPlatform = normalizePlatform(item.platform);
      const platformClass = getPlatformClass(normalizedPlatform);

      card.innerHTML = `
        <div class="card-left">
          <span class="platform-indicator ${platformClass}"></span>
          <span class="card-title" title="${item.title}">${item.title}</span>
        </div>
        <div class="card-right">
          <span class="card-platform-text">${normalizedPlatform}</span>
          <svg class="external-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>
      `;
      subGrid.appendChild(card);
    });

    section.appendChild(subGrid);
    fragment.appendChild(section);
  });

  grid.appendChild(fragment);
}

function setupPlatformTabs() {
  const rawPlatforms = Array.from(new Set(completedGames.map(g => normalizePlatform(g.platform))));

  const otherPlatforms = rawPlatforms.filter(p => p !== 'PC').sort();
  const orderedPlatforms = rawPlatforms.includes('PC') ? ['PC', ...otherPlatforms] : otherPlatforms;

  orderedPlatforms.forEach(platform => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.platform = platform;
    btn.textContent = platform;
    platformTabs.appendChild(btn);
  });
}

// Event Listeners
platformTabs.addEventListener('click', (e) => {
  if (!e.target.classList.contains('pill')) return;
  platformTabs.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  activePlatform = e.target.dataset.platform;
  renderGames();
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderGames();
});

// Determine JSON dataset automatically based on the current page URL
const isDretPage = window.location.pathname.toLowerCase().includes('dret');
const jsonFile = isDretPage ? '../JSON/dret_completed_games.json' : '../JSON/soreyasu_completed_games.json';

fetch(jsonFile)
  .then(res => {
    if (!res.ok) throw new Error(`Could not find ${jsonFile}`);
    return res.json();
  })
  .then(data => {
    completedGames = data;
    setupPlatformTabs();
    renderGames();
  })
  .catch(err => {
    grid.innerHTML = `<p style="color: #f87171; padding: 2rem;">Failed to load file: ${err.message}</p>`;
  });