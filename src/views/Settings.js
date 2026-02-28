// Settings.js — API key + Apple Notes import

import { createNavBar } from '../components/NavBar.js';
import { getApiKey, setApiKey, getDreamContext, setDreamContext, importDreams } from '../store.js';

export function renderSettings(app) {
  const currentKey = getApiKey() || '';
  const maskedKey = currentKey ? currentKey.slice(0, 6) + '•'.repeat(Math.max(0, currentKey.length - 10)) + currentKey.slice(-4) : '';

  app.innerHTML = `
    <div class="page" id="settings-page">
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Configure your dream interpreter ⚙️</p>
      </div>

      <div class="settings-content">
        <!-- API Key Section -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">DeepSeek API</h2>
            <p class="section-desc">Powers the AI dream reconstruction & interpretation</p>
          </div>

          <div class="form-group">
            <label class="input-label">API Key</label>
            <div class="api-key-input-wrapper">
              <input
                type="password"
                id="api-key-input"
                class="api-key-input"
                placeholder="sk-..."
                value="${currentKey}"
                autocomplete="off"
              />
              <button class="toggle-visibility-btn" id="toggle-key-vis" title="Show/hide">👁️</button>
            </div>
            ${currentKey ? `<p class="key-status key-saved">✓ Key saved: ${maskedKey}</p>` : '<p class="key-status">No API key configured</p>'}
          </div>

          <button class="save-btn" id="save-key-btn">
            <span class="save-icon">🔑</span> Save API Key
          </button>

          <div class="settings-help">
            <p class="help-title">How to get your API key:</p>
            <ol class="help-steps">
              <li>Visit <a href="https://platform.deepseek.com" target="_blank" class="help-link">platform.deepseek.com</a></li>
              <li>Sign up / log in</li>
              <li>Go to API Keys → Create new key</li>
              <li>Copy & paste it above</li>
            </ol>
            <p class="help-cost">💡 ~¥0.002 per dream (reconstruct + interpret)</p>
          </div>
        </div>

        <!-- Dream Context Section -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">Dream Context</h2>
            <p class="section-desc">Help the AI understand your personal symbols & codenames</p>
          </div>

          <div class="form-group">
            <label class="input-label">Personal Dictionary <span class="optional-tag">shared with AI during interpretation</span></label>
            <textarea
              id="dream-context-input"
              class="dream-fragments-input"
              placeholder="大叔 = 我爸&#10;阿姨 = 我妈&#10;小黑 = 我的猫&#10;学校 = 通常指高中&#10;那个人 = 前任"
              rows="6"
            >${getDreamContext()}</textarea>
          </div>

          <button class="save-btn" id="save-context-btn">
            <span class="save-icon">📖</span> Save Context
          </button>

          <div class="settings-help">
            <p class="help-cost">💡 This context is appended to the AI prompt so it understands your codenames, recurring people, and personal symbols.</p>
          </div>
        </div>

        <!-- Import Section -->
        <div class="settings-section">
          <div class="section-header">
            <h2 class="section-title">Import from Notes</h2>
            <p class="section-desc">Paste your Apple Notes dream journal here</p>
          </div>

          <div class="settings-help" style="margin-bottom: 16px;">
            <p class="help-title">Supported format:</p>
            <pre class="import-format-example">26.2.9
美国大叔抓人
枪械训练
花瓣 刀

25.12.13
阿根廷
阴天
三人 走廊</pre>
            <p class="help-cost">📋 One date (YY.M.D) per entry, separated by blank lines</p>
          </div>

          <div class="form-group">
            <label class="input-label">Paste your notes</label>
            <textarea
              id="import-input"
              class="dream-fragments-input import-textarea"
              placeholder="Paste your entire dream journal here..."
              rows="10"
            ></textarea>
          </div>

          <button class="save-btn import-preview-btn" id="preview-import-btn">
            <span class="save-icon">👁️</span> Preview Import
          </button>

          <div id="import-preview"></div>
        </div>
      </div>
    </div>
  `;

  app.appendChild(createNavBar('settings'));

  requestAnimationFrame(() => {
    document.getElementById('settings-page')?.classList.add('page-enter');
  });

  // Toggle password visibility
  const toggleBtn = document.getElementById('toggle-key-vis');
  const keyInput = document.getElementById('api-key-input');
  toggleBtn?.addEventListener('click', () => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    toggleBtn.textContent = keyInput.type === 'password' ? '👁️' : '🙈';
  });

  // Save API key
  document.getElementById('save-key-btn')?.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (!key) {
      keyInput.classList.add('shake');
      setTimeout(() => keyInput.classList.remove('shake'), 500);
      return;
    }
    setApiKey(key);
    const btn = document.getElementById('save-key-btn');
    btn.innerHTML = '<span class="save-icon">✨</span> Saved!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
    setTimeout(() => {
      btn.innerHTML = '<span class="save-icon">🔑</span> Save API Key';
      btn.style.background = '';
    }, 2000);
    const status = document.querySelector('.key-status');
    if (status) {
      const masked = key.slice(0, 6) + '•'.repeat(Math.max(0, key.length - 10)) + key.slice(-4);
      status.textContent = `✓ Key saved: ${masked}`;
      status.className = 'key-status key-saved';
    }
  });

  // Save dream context
  document.getElementById('save-context-btn')?.addEventListener('click', () => {
    const ctx = document.getElementById('dream-context-input').value.trim();
    setDreamContext(ctx);
    const btn = document.getElementById('save-context-btn');
    btn.innerHTML = '<span class="save-icon">✨</span> Saved!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
    setTimeout(() => {
      btn.innerHTML = '<span class="save-icon">📖</span> Save Context';
      btn.style.background = '';
    }, 2000);
  });

  // Preview import
  document.getElementById('preview-import-btn')?.addEventListener('click', () => {
    const raw = document.getElementById('import-input').value.trim();
    if (!raw) return;

    const entries = parseAppleNotes(raw);
    const preview = document.getElementById('import-preview');

    if (entries.length === 0) {
      preview.innerHTML = `<p class="import-error">❌ Could not detect any date patterns (YY.M.D)</p>`;
      return;
    }

    preview.innerHTML = `
      <div class="import-preview-container">
        <div class="import-preview-header">
          <span class="import-count">${entries.length} dreams detected</span>
        </div>
        <div class="import-preview-list">
          ${entries.slice(0, 10).map(e => `
            <div class="import-preview-item">
              <span class="import-preview-date">${e.date}</span>
              <span class="import-preview-fragments">${e.fragments.slice(0, 60)}${e.fragments.length > 60 ? '...' : ''}</span>
            </div>
          `).join('')}
          ${entries.length > 10 ? `<p class="import-more">...and ${entries.length - 10} more</p>` : ''}
        </div>
        <button class="save-btn" id="confirm-import-btn">
          <span class="save-icon">📥</span> Import ${entries.length} Dreams
        </button>
      </div>
    `;

    document.getElementById('confirm-import-btn')?.addEventListener('click', async () => {
      const count = await importDreams(entries);
      const btn = document.getElementById('confirm-import-btn');
      btn.innerHTML = `<span class="save-icon">✨</span> Imported ${count} dreams!`;
      btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
      btn.disabled = true;

      // Clear input
      document.getElementById('import-input').value = '';
    });
  });
}

/**
 * Parse Apple Notes dream journal format
 * Date format: YY.M.D or YY.MM.DD
 * Entries separated by blank lines
 */
function parseAppleNotes(raw) {
  const lines = raw.split('\n');
  const entries = [];
  let currentEntry = null;

  // Match date patterns like 26.2.9, 25.12.13, 24.1.31
  const dateRegex = /^(\d{2})\.(\d{1,2})\.(\d{1,2})$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      // Save previous entry
      if (currentEntry) {
        currentEntry.fragments = currentEntry.fragments.trim();
        if (currentEntry.fragments) entries.push(currentEntry);
      }

      // Parse date: YY.M.D → 20YY-MM-DD
      const year = 2000 + parseInt(dateMatch[1]);
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');

      currentEntry = {
        date: `${year}-${month}-${day}`,
        fragments: '',
      };
    } else if (currentEntry) {
      if (line) {
        currentEntry.fragments += (currentEntry.fragments ? '\n' : '') + line;
      }
    }
  }

  // Don't forget last entry
  if (currentEntry) {
    currentEntry.fragments = currentEntry.fragments.trim();
    if (currentEntry.fragments) entries.push(currentEntry);
  }

  return entries;
}
