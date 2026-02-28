// NewDream.js — dream entry page with two-step LLM flow

import { createMoodPicker } from '../components/MoodPicker.js';
import { createNavBar } from '../components/NavBar.js';
import { addDream, getApiKey, getDreamContext, updateDream } from '../store.js';
import { reconstructDream, interpretDream } from '../services/deepseek.js';

export function renderNewDream(app) {
  let mood = '😴';

  const page = document.createElement('div');
  page.className = 'page page-new';

  // Header
  const header = document.createElement('header');
  header.className = 'page-header';
  header.innerHTML = `
    <h1 class="page-title">Record a Dream</h1>
    <p class="page-subtitle">Write freely — fragments, words, sentences ✨</p>
  `;
  page.appendChild(header);

  // Form content
  const form = document.createElement('div');
  form.className = 'dream-form';
  form.id = 'dream-form';

  // Date input
  const dateGroup = document.createElement('div');
  dateGroup.className = 'form-group';
  const today = new Date().toLocaleDateString('en-CA');
  dateGroup.innerHTML = `
    <div class="input-label">Date</div>
    <input type="date" class="date-input" value="${today}" />
  `;
  form.appendChild(dateGroup);

  // Freeform text input (replaces keyword chips)
  const fragmentsGroup = document.createElement('div');
  fragmentsGroup.className = 'form-group';
  fragmentsGroup.innerHTML = `
    <div class="input-label">Dream Fragments</div>
    <textarea
      class="dream-fragments-input"
      id="fragments-input"
      placeholder="Write anything you remember...&#10;&#10;Keywords, phrases, sentences — all welcome.&#10;e.g. 美国大叔抓人 枪械训练 花瓣 刀 恐龙骨架"
      rows="6"
    ></textarea>
  `;
  form.appendChild(fragmentsGroup);

  // Mood picker
  const moodPicker = createMoodPicker(mood, (m) => {
    mood = m;
  });
  form.appendChild(moodPicker);

  // Save & Reconstruct button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.innerHTML = `<span class="save-icon">🌙</span> Save & Reconstruct`;
  saveBtn.addEventListener('click', async () => {
    const fragments = document.getElementById('fragments-input').value.trim();
    if (!fragments) {
      document.getElementById('fragments-input').classList.add('shake');
      setTimeout(() => document.getElementById('fragments-input').classList.remove('shake'), 500);
      return;
    }

    const dateVal = form.querySelector('.date-input').value || today;

    // Save the dream first (with just fragments)
    const dream = await addDream({ fragments, mood, date: dateVal });

    const apiKey = getApiKey();
    const dreamContext = getDreamContext();
    if (apiKey) {
      // Step 1: Reconstruct
      showStep1Loading(page);
      try {
        const result = await reconstructDream(fragments, mood, apiKey, dreamContext);
        showStep1Result(page, result, dream, mood, apiKey, dreamContext);
      } catch (err) {
        console.error('Reconstruct error:', err);
        showError(page, err, dream.id);
      }
    } else {
      // No API key — save and redirect
      showNoApiKey(page, dream.id);
    }
  });
  form.appendChild(saveBtn);

  page.appendChild(form);
  app.innerHTML = '';
  app.appendChild(page);
  app.appendChild(createNavBar('new'));
  requestAnimationFrame(() => page.classList.add('page-enter'));
}

// ========== Step 1: Loading ==========
function showStep1Loading(page) {
  const form = document.getElementById('dream-form');
  if (form) form.style.display = 'none';

  const el = document.createElement('div');
  el.className = 'interp-loading';
  el.id = 'step-loading';
  el.innerHTML = `
    <div class="interp-loading-orb"></div>
    <div class="interp-loading-text">Reconstructing your dream...</div>
    <div class="interp-loading-dots"><span>·</span><span>·</span><span>·</span></div>
  `;
  page.insertBefore(el, page.querySelector('.navbar'));
  requestAnimationFrame(() => el.classList.add('show'));
}

// ========== Step 1: Result (editable narrative + keywords) ==========
async function showStep1Result(page, result, dream, mood, apiKey, dreamContext) {
  const loading = document.getElementById('step-loading');
  if (loading) loading.remove();

  // Track editable keywords
  let editableKeywords = [...result.keywords];

  // Save reconstruction to dream
  await updateDream(dream.id, { narrative: result.narrative, keywords: editableKeywords });

  const el = document.createElement('div');
  el.className = 'step-result';
  el.id = 'step1-result';
  el.innerHTML = `
    <div class="step-header">
      <span class="step-badge">Step 1</span>
      <h2 class="step-title">Dream Reconstructed</h2>
    </div>
    <p class="step-hint">Edit the narrative & keywords, then interpret ↓</p>

    <div class="step-narrative-section">
      <div class="input-label">Narrative</div>
      <textarea class="step-narrative-edit" id="narrative-edit" rows="6">${result.narrative}</textarea>
    </div>

    <div class="step-keywords-section">
      <div class="input-label">Keywords <span class="optional-tag">click × to remove, type to add</span></div>
      <div class="step-keywords-editor" id="step-keywords-editor">
        <div class="step-keywords-tags" id="step-keywords-tags"></div>
        <input
          type="text"
          class="step-keyword-add"
          id="step-keyword-add"
          placeholder="+ add keyword"
        />
      </div>
    </div>

    <button class="save-btn interpret-btn" id="interpret-btn">
      <span class="save-icon">🔮</span> Interpret this Dream
    </button>
  `;

  page.insertBefore(el, page.querySelector('.navbar'));
  requestAnimationFrame(() => el.classList.add('show'));

  // Render editable keyword tags
  function renderKeywordTags() {
    const container = document.getElementById('step-keywords-tags');
    if (!container) return;
    container.innerHTML = editableKeywords.map((k, i) =>
      `<span class="editable-tag" data-idx="${i}">${k}<button class="tag-remove" data-idx="${i}">×</button></span>`
    ).join('');

    // Attach remove listeners
    container.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        editableKeywords.splice(idx, 1);
        updateDream(dream.id, { keywords: editableKeywords });
        renderKeywordTags();
      });
    });
  }

  renderKeywordTags();

  // Add keyword on Enter
  const addInput = document.getElementById('step-keyword-add');
  addInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = addInput.value.trim();
      if (val && !editableKeywords.includes(val)) {
        editableKeywords.push(val);
        updateDream(dream.id, { keywords: editableKeywords });
        renderKeywordTags();
      }
      addInput.value = '';
    }
  });

  // Step 2: Interpret
  document.getElementById('interpret-btn')?.addEventListener('click', async () => {
    const narrative = document.getElementById('narrative-edit').value.trim();
    if (!narrative) return;

    // Update dream with possibly edited narrative + keywords
    await updateDream(dream.id, { narrative, keywords: editableKeywords });

    const btn = document.getElementById('interpret-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="save-icon">✨</span> Interpreting...`;

    // Show step 2 loading
    showStep2Loading(page);

    try {
      const interpretation = await interpretDream(narrative, result.keywords, mood, apiKey, dreamContext);
      await updateDream(dream.id, { interpretation });
      showStep2Result(page, interpretation, dream.id);
    } catch (err) {
      console.error('Interpretation error:', err);
      showError(page, err, dream.id);
    }
  });
}

// ========== Step 2: Loading ==========
function showStep2Loading(page) {
  const btn = document.getElementById('interpret-btn');
  if (btn) btn.style.display = 'none';

  const el = document.createElement('div');
  el.className = 'interp-loading interp-loading-inline';
  el.id = 'step2-loading';
  el.innerHTML = `
    <div class="interp-loading-orb"></div>
    <div class="interp-loading-text">The dream oracle is reading...</div>
  `;
  const step1 = document.getElementById('step1-result');
  if (step1) step1.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
}

// ========== Step 2: Interpretation result ==========
function showStep2Result(page, interpretation, dreamId) {
  const loading = document.getElementById('step2-loading');
  if (loading) loading.remove();

  const step1 = document.getElementById('step1-result');
  // Hide the narrative edit section
  const narrativeSection = step1?.querySelector('.step-narrative-section');
  if (narrativeSection) narrativeSection.style.display = 'none';
  const hintEl = step1?.querySelector('.step-hint');
  if (hintEl) hintEl.style.display = 'none';

  const el = document.createElement('div');
  el.className = 'interp-result';
  el.innerHTML = `
    <div class="interp-result-header">
      <span class="step-badge step-badge-2">Step 2</span>
      <h2 class="step-title">Dream Interpretation</h2>
    </div>
    <div class="interp-body">${formatMd(interpretation)}</div>
    <div class="interp-actions">
      <a href="#/dream/${dreamId}" class="interp-btn interp-btn-view">
        <span>📖</span> View Dream
      </a>
      <a href="#/new" class="interp-btn interp-btn-new">
        <span>✏️</span> New Dream
      </a>
    </div>
    <p class="interp-saved-note">✓ Dream, narrative & interpretation saved</p>
  `;

  page.insertBefore(el, page.querySelector('.navbar'));
  requestAnimationFrame(() => el.classList.add('show'));
}

// ========== Error / No API Key ==========
function showError(page, err, dreamId) {
  const loading = document.getElementById('step-loading') || document.getElementById('step2-loading');
  if (loading) loading.remove();

  const msg = err.message === 'INVALID_API_KEY'
    ? 'API key is invalid. Check Settings.'
    : 'Could not reach the dream oracle...';

  const el = document.createElement('div');
  el.className = 'interp-result interp-error show';
  el.innerHTML = `
    <div class="interp-result-header">
      <span class="interp-icon">🌑</span>
      <h2 class="interp-title" style="font-family:Inter,sans-serif;font-size:0.95rem;font-weight:400">${msg}</h2>
    </div>
    <div class="interp-actions">
      <a href="#/dream/${dreamId}" class="interp-btn interp-btn-view"><span>📖</span> View Dream</a>
      <a href="#/settings" class="interp-btn interp-btn-new"><span>⚙️</span> Settings</a>
    </div>
    <p class="interp-saved-note">✓ Dream saved (without interpretation)</p>
  `;
  page.insertBefore(el, page.querySelector('.navbar'));
}

function showNoApiKey(page, dreamId) {
  const form = document.getElementById('dream-form');
  if (form) form.style.display = 'none';

  const el = document.createElement('div');
  el.className = 'interp-result show';
  el.innerHTML = `
    <div class="interp-result-header">
      <span class="interp-icon">🌙</span>
      <h2 class="interp-title">Dream Saved</h2>
    </div>
    <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:20px;">
      Set up your DeepSeek API key to unlock reconstruction & interpretation!
    </p>
    <div class="interp-actions">
      <a href="#/dream/${dreamId}" class="interp-btn interp-btn-view"><span>📖</span> View Dream</a>
      <a href="#/settings" class="interp-btn interp-btn-new"><span>⚙️</span> Settings</a>
    </div>
  `;
  page.insertBefore(el, page.querySelector('.navbar'));
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
