// NavBar.js — bottom navigation bar (4 tabs)

export function createNavBar(currentPage) {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <a href="#/new" class="nav-item ${currentPage === 'new' ? 'active' : ''}">
      <span class="nav-icon">✏️</span>
      <span class="nav-label">Record</span>
    </a>
    <a href="#/journal" class="nav-item ${currentPage === 'journal' ? 'active' : ''}">
      <span class="nav-icon">📖</span>
      <span class="nav-label">Journal</span>
    </a>
    <a href="#/analysis" class="nav-item ${currentPage === 'analysis' ? 'active' : ''}">
      <span class="nav-icon">✨</span>
      <span class="nav-label">Insights</span>
    </a>
    <a href="#/settings" class="nav-item ${currentPage === 'settings' ? 'active' : ''}">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">Settings</span>
    </a>
  `;
  return nav;
}
