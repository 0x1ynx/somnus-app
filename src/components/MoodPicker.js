// MoodPicker.js — emoji mood selector (English)

const MOODS = [
    { emoji: '😊', label: 'Happy', color: '#fbbf24' },
    { emoji: '😌', label: 'Calm', color: '#60a5fa' },
    { emoji: '😨', label: 'Scared', color: '#a78bfa' },
    { emoji: '😢', label: 'Sad', color: '#67e8f9' },
    { emoji: '🤔', label: 'Confused', color: '#fb923c' },
    { emoji: '😴', label: 'Hazy', color: '#94a3b8' },
    { emoji: '🥰', label: 'Loved', color: '#f472b6' },
    { emoji: '😤', label: 'Intense', color: '#f87171' },
];

export { MOODS };

export function createMoodPicker(selectedMood, onChange) {
    const container = document.createElement('div');
    container.className = 'mood-picker';

    const label = document.createElement('div');
    label.className = 'input-label';
    label.textContent = 'Mood';
    container.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'mood-grid';

    MOODS.forEach(({ emoji, label: moodLabel, color }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mood-btn ${selectedMood === emoji ? 'selected' : ''}`;
        btn.dataset.mood = emoji;
        btn.style.setProperty('--mood-color', color);
        btn.innerHTML = `
      <span class="mood-emoji">${emoji}</span>
      <span class="mood-label">${moodLabel}</span>
    `;
        btn.addEventListener('click', () => {
            grid.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            onChange(emoji);
        });
        grid.appendChild(btn);
    });

    container.appendChild(grid);
    return container;
}
