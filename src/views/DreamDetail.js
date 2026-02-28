// DreamDetail.js — dream detail view with narrative + interpretation

import { getDreamById, deleteDream, getApiKey, getDreamContext, updateDream } from '../store.js';
import { reconstructDream, interpretDream } from '../services/deepseek.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function renderDreamDetail(app, dreamId) {
  // Show loading while fetching
  app.innerHTML = `<div class="page" style="display:flex;align-items:center;justify-content:center;">
    <div style="text-align:center;color:var(--text-secondary);">
      <div style="font-size:40px;margin-bottom:12px;">🌙</div>
      <div>Loading dream...</div>
    </div>
  </div>`;

  const dream = await getDreamById(dreamId);

  const page = document.createElement('div');
  page.className = 'page page-detail';

  if (!dream) {
    page.innerHTML = `
      <div class="detail-not-found">
        <div class="empty-moon">🌑</div>
        <div class="empty-text">Dream not found</div>
        <a href="#/journal" class="back-link">← Back to Journal</a>
      </div>
    `;
    app.innerHTML = '';
    app.appendChild(page);
    return;
  }

  const date = new Date(dream.date);
  const dateStr = `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const weekday = WEEKDAYS[date.getDay()];

  page.innerHTML = `
    <header class="detail-header">
      <a href="#/journal" class="back-link">← Back</a>
      <button class="detail-edit-btn" id="edit-dream-btn">✏️ Edit</button>
    </header>
    <div class="detail-content" id="detail-view">
      <div class="detail-mood-large">${dream.mood}</div>
      <div class="detail-date">${dateStr} · ${weekday}</div>

      ${dream.fragments ? `
        <div class="detail-fragments-section">
          <div class="detail-section-title">Fragments</div>
          <div class="detail-fragments">${dream.fragments}</div>
        </div>
      ` : ''}

      ${dream.narrative ? `
        <div class="detail-narrative-section">
          <div class="detail-section-title">Narrative</div>
          <div class="detail-narrative">${dream.narrative}</div>
        </div>
      ` : ''}

      ${dream.keywords?.length > 0 ? `
        <div class="detail-keywords">
          ${dream.keywords.map(k => `<span class="detail-tag">${k}</span>`).join('')}
        </div>
      ` : ''}

      ${dream.notes ? `
        <div class="detail-notes-section">
          <div class="detail-section-title">Notes</div>
          <div class="detail-notes">${dream.notes}</div>
        </div>
      ` : ''}

      <div id="interpretation-section"></div>
      ${!dream.narrative && dream.fragments ? `<div id="reconstruct-section"></div>` : ''}

      <button class="delete-btn" id="delete-dream">
        <span>🗑️</span> Delete this Dream
      </button>
    </div>

    <div class="detail-content detail-edit-mode" id="detail-edit" style="display:none">
      <div class="form-group">
        <div class="input-label">Date</div>
        <input type="date" class="date-input" id="edit-date" value="${dream.date}" />
      </div>

      <div class="form-group">
        <div class="input-label">Dream Fragments</div>
        <textarea class="dream-fragments-input" id="edit-fragments" rows="5">${dream.fragments || ''}</textarea>
      </div>

      ${dream.narrative ? `
        <div class="form-group">
          <div class="input-label">Narrative</div>
          <textarea class="dream-fragments-input" id="edit-narrative" rows="5">${dream.narrative}</textarea>
        </div>
      ` : ''}

      ${dream.keywords?.length > 0 || dream.narrative ? `
        <div class="form-group">
          <div class="input-label">Keywords <span class="optional-tag">click × to remove, type to add</span></div>
          <div class="step-keywords-editor" id="edit-keywords-editor">
            <div class="step-keywords-tags" id="edit-keywords-tags"></div>
            <input type="text" class="step-keyword-add" id="edit-keyword-add" placeholder="+ add keyword" />
          </div>
        </div>
      ` : ''}

      <div class="form-group">
        <div class="input-label">Mood</div>
        <div class="edit-mood-grid" id="edit-mood-grid"></div>
      </div>

      <div class="edit-actions">
        <button class="save-btn" id="save-edit-btn">
          <span class="save-icon">💾</span> Save Changes
        </button>
        <button class="detail-cancel-btn" id="cancel-edit-btn">Cancel</button>
      </div>
    </div>
  `;

  // Interpretation section
  const interpSection = page.querySelector('#interpretation-section');
  if (dream.interpretation) {
    renderInterpretation(interpSection, dream.interpretation, dream);
  } else if (dream.narrative) {
    renderNoInterpretation(interpSection, dream);
  } else {
    renderNeedsReconstruction(interpSection, dream);
  }

  const reconstructSection = page.querySelector('#reconstruct-section');
  if (reconstructSection && !dream.narrative && dream.fragments) {
    renderReconstructBtn(reconstructSection, dream, page);
  }

  // Delete with confirmation
  const deleteBtn = page.querySelector('#delete-dream');
  let deleteConfirming = false;
  let deleteTimeout = null;

  deleteBtn.addEventListener('click', async () => {
    if (deleteConfirming) {
      clearTimeout(deleteTimeout);
      await deleteDream(dream.id);
      window.location.hash = '#/journal';
    } else {
      deleteConfirming = true;
      deleteBtn.innerHTML = '<span>⚠️</span> Tap again to confirm';
      deleteBtn.classList.add('delete-confirming');
      deleteTimeout = setTimeout(() => {
        deleteConfirming = false;
        deleteBtn.innerHTML = '<span>🗑️</span> Delete this Dream';
        deleteBtn.classList.remove('delete-confirming');
      }, 3000);
    }
  });

  // Edit mode
  const moods = ['😊', '😌', '😨', '😢', '🤔', '😴', '🥰', '😤'];
  let editMood = dream.mood;
  let editKeywords = [...(dream.keywords || [])];

  const editBtn = page.querySelector('#edit-dream-btn');
  const viewPanel = page.querySelector('#detail-view');
  const editPanel = page.querySelector('#detail-edit');

  function renderEditKeywords() {
    const container = page.querySelector('#edit-keywords-tags');
    if (!container) return;
    container.innerHTML = editKeywords.map((k, i) =>
      `<span class="editable-tag" data-idx="${i}">${k}<button class="tag-remove" data-idx="${i}">×</button></span>`
    ).join('');
    container.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        editKeywords.splice(parseInt(e.target.dataset.idx), 1);
        renderEditKeywords();
      });
    });
  }
  renderEditKeywords();

  page.querySelector('#edit-keyword-add')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val && !editKeywords.includes(val)) {
        editKeywords.push(val);
        renderEditKeywords();
      }
      e.target.value = '';
    }
  });

  const moodGrid = page.querySelector('#edit-mood-grid');
  if (moodGrid) {
    moodGrid.innerHTML = moods.map(m =>
      `<button class="edit-mood-btn${m === editMood ? ' selected' : ''}" data-mood="${m}">${m}</button>`
    ).join('');
    moodGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.edit-mood-btn');
      if (!btn) return;
      editMood = btn.dataset.mood;
      moodGrid.querySelectorAll('.edit-mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  }

  editBtn?.addEventListener('click', () => {
    viewPanel.style.display = 'none';
    editPanel.style.display = 'block';
    editBtn.style.display = 'none';
  });

  page.querySelector('#cancel-edit-btn')?.addEventListener('click', () => {
    editPanel.style.display = 'none';
    viewPanel.style.display = 'block';
    editBtn.style.display = '';
  });

  page.querySelector('#save-edit-btn')?.addEventListener('click', async () => {
    const newFragments = page.querySelector('#edit-fragments')?.value.trim() || '';
    const newNarrative = page.querySelector('#edit-narrative')?.value.trim() || dream.narrative || '';
    const newDate = page.querySelector('#edit-date')?.value || dream.date;

    await updateDream(dream.id, {
      fragments: newFragments,
      narrative: newNarrative,
      keywords: editKeywords,
      mood: editMood,
      date: newDate,
    });

    renderDreamDetail(app, dreamId);
  });

  app.innerHTML = '';
  app.appendChild(page);
  requestAnimationFrame(() => page.classList.add('page-enter'));
}

function renderInterpretation(container, interpretation, dream) {
  container.innerHTML = `
    <div class="detail-interp-card">
      <div class="detail-interp-header">
        <span class="interp-icon">🔮</span>
        <span class="detail-section-title" style="margin:0">Interpretation</span>
      </div>
      <div class="detail-interp-body">${formatMd(interpretation)}</div>
      <button class="detail-reinterpret-btn" id="reinterpret-btn">
        <span>✨</span> Re-interpret
      </button>
    </div>
  `;
  container.querySelector('#reinterpret-btn')?.addEventListener('click', () => {
    requestInterpretation(container, dream);
  });
}

function renderNoInterpretation(container, dream) {
  const apiKey = getApiKey();
  container.innerHTML = `
    <div class="detail-interp-card detail-interp-empty">
      <div class="detail-interp-header">
        <span class="interp-icon">🔮</span>
        <span class="detail-section-title" style="margin:0">Interpretation</span>
      </div>
      <p class="detail-interp-placeholder">No interpretation yet</p>
      ${apiKey
      ? '<button class="detail-reinterpret-btn" id="interpret-btn"><span>✨</span> Interpret this Dream</button>'
      : '<a href="#/settings" class="detail-reinterpret-btn"><span>⚙️</span> Set up API key</a>'
    }
    </div>
  `;
  container.querySelector('#interpret-btn')?.addEventListener('click', () => {
    requestInterpretation(container, dream);
  });
}

function renderNeedsReconstruction(container, dream) {
  const apiKey = getApiKey();
  if (!apiKey) {
    container.innerHTML = `
      <div class="detail-interp-card detail-interp-empty">
        <div class="detail-interp-header">
          <span class="interp-icon">🔮</span>
          <span class="detail-section-title" style="margin:0">Interpretation</span>
        </div>
        <p class="detail-interp-placeholder">Reconstruct the dream first to get an interpretation</p>
        <a href="#/settings" class="detail-reinterpret-btn"><span>⚙️</span> Set up API key</a>
      </div>
    `;
  }
}

function renderReconstructBtn(container, dream, page) {
  const apiKey = getApiKey();
  if (!apiKey) return;

  container.innerHTML = `
    <button class="save-btn" id="reconstruct-btn" style="margin-top:0">
      <span class="save-icon">🌙</span> Reconstruct & Interpret
    </button>
  `;

  container.querySelector('#reconstruct-btn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#reconstruct-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="save-icon">✨</span> Reconstructing...';

    try {
      const result = await reconstructDream(dream.fragments, dream.mood, apiKey, getDreamContext());
      await updateDream(dream.id, { narrative: result.narrative, keywords: result.keywords });

      btn.innerHTML = '<span class="save-icon">🔮</span> Interpreting...';
      const interpretation = await interpretDream(result.narrative, result.keywords, dream.mood, apiKey, getDreamContext());
      await updateDream(dream.id, { interpretation });

      window.location.reload();
    } catch (err) {
      console.error('Error:', err);
      btn.disabled = false;
      btn.innerHTML = '<span class="save-icon">❌</span> Failed — try again';
    }
  });
}

async function requestInterpretation(container, dream) {
  const apiKey = getApiKey();
  if (!apiKey) return;

  container.innerHTML = `
    <div class="detail-interp-card">
      <div class="interp-loading show" style="position:relative; min-height:120px;">
        <div class="interp-loading-orb"></div>
        <div class="interp-loading-text">Reading the dream fragments...</div>
      </div>
    </div>
  `;

  try {
    const interpretation = await interpretDream(
      dream.narrative || dream.fragments,
      dream.keywords || [],
      dream.mood,
      apiKey,
      getDreamContext()
    );
    await updateDream(dream.id, { interpretation });
    dream.interpretation = interpretation;
    renderInterpretation(container, interpretation, dream);
  } catch (err) {
    container.innerHTML = `
      <div class="detail-interp-card detail-interp-empty">
        <p class="detail-interp-placeholder">${err.message === 'INVALID_API_KEY' ? 'API key is invalid' : 'Could not reach the dream oracle...'}</p>
        <button class="detail-reinterpret-btn" id="retry-btn"><span>🔄</span> Try again</button>
      </div>
    `;
    container.querySelector('#retry-btn')?.addEventListener('click', () => {
      requestInterpretation(container, dream);
    });
  }
}

function formatMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
