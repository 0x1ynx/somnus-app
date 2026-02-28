// Analysis.js — Insights page with graph, mood trends, calendar, top keywords

import { createNavBar } from '../components/NavBar.js';
import { getDreams } from '../store.js';
import { MOODS } from '../components/MoodPicker.js';
import { createDreamGraph } from '../components/DreamGraph.js';

export function renderAnalysis(app) {
    const page = document.createElement('div');
    page.className = 'page page-analysis';

    const header = document.createElement('header');
    header.className = 'page-header';
    header.innerHTML = `
    <h1 class="page-title">Dream Insights</h1>
    <p class="page-subtitle">Patterns hiding in your subconscious ✨</p>
  `;
    page.appendChild(header);

    const dreams = getDreams();

    if (dreams.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
      <div class="empty-moon">🔮</div>
      <div class="empty-text">Not enough dreams yet</div>
      <div class="empty-hint">Record a few dreams to unlock insights ✨</div>
      <a href="#/new" class="empty-btn">Record a Dream</a>
    `;
        page.appendChild(empty);
    } else {
        const content = document.createElement('div');
        content.className = 'analysis-content';

        // Stats overview
        createStatsOverview(dreams, content);

        // Dream Graph (Obsidian-style)
        createDreamGraph(dreams, content);

        // Mood Distribution
        createMoodChart(dreams, content);

        // Dream Calendar Heatmap
        createCalendarHeatmap(dreams, content);

        // Top Keywords
        createTopKeywords(dreams, content);

        page.appendChild(content);
    }

    page.appendChild(createNavBar('analysis'));

    app.innerHTML = '';
    app.appendChild(page);
    requestAnimationFrame(() => page.classList.add('page-enter'));
}

function createStatsOverview(dreams, container) {
    const totalDreams = dreams.length;
    const totalKeywords = new Set(dreams.flatMap(d => d.keywords)).size;
    const uniqueMoods = new Set(dreams.map(d => d.mood)).size;

    // Streak calculation
    const dates = [...new Set(dreams.map(d => d.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        if (dates[i] === expectedStr) {
            streak++;
        } else {
            break;
        }
    }

    const section = document.createElement('div');
    section.className = 'stats-overview';
    section.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${totalDreams}</div>
      <div class="stat-label">Dreams</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${totalKeywords}</div>
      <div class="stat-label">Keywords</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${uniqueMoods}</div>
      <div class="stat-label">Moods</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${streak}</div>
      <div class="stat-label">Day Streak</div>
    </div>
  `;
    container.appendChild(section);
}

function createMoodChart(dreams, container) {
    const section = document.createElement('div');
    section.className = 'chart-section';

    // Count moods
    const moodCounts = {};
    dreams.forEach(d => {
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(moodCounts), 1);

    const bars = MOODS.filter(m => moodCounts[m.emoji])
        .sort((a, b) => (moodCounts[b.emoji] || 0) - (moodCounts[a.emoji] || 0))
        .map(m => {
            const count = moodCounts[m.emoji] || 0;
            const pct = (count / maxCount) * 100;
            return `
        <div class="mood-bar-row">
          <span class="mood-bar-emoji">${m.emoji}</span>
          <div class="mood-bar-track">
            <div class="mood-bar-fill" style="width: ${pct}%; background: ${m.color}; --delay: ${Math.random() * 0.3}s"></div>
          </div>
          <span class="mood-bar-count">${count}</span>
        </div>
      `;
        }).join('');

    section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Mood Distribution</h2>
      <p class="section-desc">How your dreams feel</p>
    </div>
    <div class="mood-bars">${bars}</div>
  `;

    container.appendChild(section);
}

function createCalendarHeatmap(dreams, container) {
    const section = document.createElement('div');
    section.className = 'chart-section';

    // Build date count map for last 3 months
    const dateCounts = {};
    dreams.forEach(d => {
        dateCounts[d.date] = (dateCounts[d.date] || 0) + 1;
    });

    const today = new Date();
    const weeks = [];
    let currentWeek = [];

    // Go back ~90 days
    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = dateCounts[dateStr] || 0;
        const dayOfWeek = d.getDay();

        if (dayOfWeek === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }

        currentWeek.push({ date: dateStr, count, day: d.getDate(), dayOfWeek });
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const maxCount = Math.max(...Object.values(dateCounts), 1);

    const cells = weeks.map(week => {
        const weekCells = week.map(day => {
            let level = 0;
            if (day.count > 0) level = Math.min(Math.ceil(day.count / maxCount * 3), 3);
            const isToday = day.date === today.toISOString().split('T')[0];
            return `<div class="heatmap-cell level-${level} ${isToday ? 'today' : ''}" 
                title="${day.date}: ${day.count} dream${day.count !== 1 ? 's' : ''}"></div>`;
        }).join('');
        return `<div class="heatmap-week">${weekCells}</div>`;
    }).join('');

    section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Dream Calendar</h2>
      <p class="section-desc">Last 90 days — darker = more dreams</p>
    </div>
    <div class="heatmap-grid">${cells}</div>
    <div class="heatmap-legend">
      <span class="legend-label">Less</span>
      <div class="heatmap-cell level-0 legend-cell"></div>
      <div class="heatmap-cell level-1 legend-cell"></div>
      <div class="heatmap-cell level-2 legend-cell"></div>
      <div class="heatmap-cell level-3 legend-cell"></div>
      <span class="legend-label">More</span>
    </div>
  `;

    container.appendChild(section);
}

function createTopKeywords(dreams, container) {
    const section = document.createElement('div');
    section.className = 'chart-section';

    const keywordCount = {};
    dreams.forEach(d => {
        d.keywords.forEach(kw => {
            keywordCount[kw] = (keywordCount[kw] || 0) + 1;
        });
    });

    const sorted = Object.entries(keywordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

    const rows = sorted.map(([kw, count], i) => {
        const pct = (count / maxCount) * 100;
        return `
      <div class="keyword-rank-row" style="animation-delay: ${i * 0.05}s">
        <span class="keyword-rank">#${i + 1}</span>
        <span class="keyword-rank-label">${kw}</span>
        <div class="keyword-rank-bar-track">
          <div class="keyword-rank-bar" style="width: ${pct}%"></div>
        </div>
        <span class="keyword-rank-count">${count}×</span>
      </div>
    `;
    }).join('');

    section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Top Keywords</h2>
      <p class="section-desc">Your most recurring dream symbols</p>
    </div>
    <div class="keyword-rankings">${rows || '<p class="no-data">No keywords yet</p>'}</div>
  `;

    container.appendChild(section);
}
