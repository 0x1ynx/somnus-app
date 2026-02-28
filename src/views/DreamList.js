// DreamList.js — journal list view

import { createNavBar } from '../components/NavBar.js';
import { getDreams, searchDreams } from '../store.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function renderDreamList(app) {
  const page = document.createElement('div');
  page.className = 'page page-journal';

  const header = document.createElement('header');
  header.className = 'page-header';
  header.innerHTML = `
    <h1 class="page-title">Dream Journal</h1>
    <p class="page-subtitle">Every night you've collected 🌌</p>
  `;
  page.appendChild(header);

  const searchBar = document.createElement('div');
  searchBar.className = 'search-bar';
  searchBar.innerHTML = `
    <span class="search-icon">🔍</span>
    <input type="text" class="search-input" placeholder="Search keywords..." />
  `;
  page.appendChild(searchBar);

  const listContainer = document.createElement('div');
  listContainer.className = 'dream-list';
  page.appendChild(listContainer);

  function renderList(dreams) {
    listContainer.innerHTML = '';
    if (dreams.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-moon">🌑</div>
        <div class="empty-text">No dreams recorded yet</div>
        <div class="empty-hint">Record your first dream ✨</div>
        <a href="#/new" class="empty-btn">Start Recording</a>
      `;
      listContainer.appendChild(empty);
      return;
    }

    const sorted = [...dreams].sort((a, b) => b.date.localeCompare(a.date));
    const groups = {};
    sorted.forEach(dream => {
      const monthKey = dream.date.substring(0, 7);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(dream);
    });

    const sortedMonths = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    sortedMonths.forEach(monthKey => {
      const monthDreams = groups[monthKey];
      const [year, month] = monthKey.split('-');
      const monthLabel = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;

      const section = document.createElement('div');
      section.className = 'month-section';
      section.innerHTML = `<div class="month-label">${monthLabel}</div>`;

      monthDreams.sort((a, b) => b.date.localeCompare(a.date));
      monthDreams.forEach((dream, index) => {
        section.appendChild(createDreamCard(dream, index));
      });

      listContainer.appendChild(section);
    });
  }

  const searchInput = searchBar.querySelector('.search-input');
  searchInput.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    const dreams = q ? await searchDreams(q) : await getDreams();
    renderList(dreams);
  });

  page.appendChild(createNavBar('journal'));

  app.innerHTML = '';
  app.appendChild(page);
  requestAnimationFrame(() => page.classList.add('page-enter'));

  // Load dreams
  const dreams = await getDreams();
  renderList(dreams);
}

function createDreamCard(dream, index) {
  const card = document.createElement('a');
  card.href = `#/dream/${dream.id}`;
  card.className = 'dream-card';
  card.style.animationDelay = `${index * 0.06}s`;

  const date = new Date(dream.date);
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];

  card.innerHTML = `
    <div class="card-date">
      <span class="card-day">${day}</span>
      <span class="card-weekday">${weekday}</span>
    </div>
    <div class="card-body">
      <div class="card-mood">${dream.mood}</div>
      ${dream.keywords?.length > 0 ? `
        <div class="card-keywords">
          ${dream.keywords.map(k => `<span class="card-tag">${k}</span>`).join('')}
        </div>
      ` : dream.fragments ? `
        <div class="card-notes">${dream.fragments.substring(0, 60)}${dream.fragments.length > 60 ? '...' : ''}</div>
      ` : ''}
      ${dream.notes ? `<div class="card-notes">${dream.notes.substring(0, 60)}${dream.notes.length > 60 ? '...' : ''}</div>` : ''}
    </div>
  `;

  return card;
}
