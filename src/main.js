// main.js — App entry point & router

import './styles/main.css';
import { initStarField } from './components/StarField.js';
import { renderNewDream } from './views/NewDream.js';
import { renderDreamList } from './views/DreamList.js';
import { renderDreamDetail } from './views/DreamDetail.js';
import { renderAnalysis } from './views/Analysis.js';
import { renderSettings } from './views/Settings.js';

// Initialize starfield background
initStarField();

// Simple hash router
function route() {
    const app = document.getElementById('app');
    const hash = window.location.hash || '#/new';

    if (hash.startsWith('#/dream/')) {
        const id = hash.replace('#/dream/', '');
        renderDreamDetail(app, id);
    } else if (hash === '#/journal') {
        renderDreamList(app);
    } else if (hash === '#/analysis') {
        renderAnalysis(app);
    } else if (hash === '#/settings') {
        renderSettings(app);
    } else {
        renderNewDream(app);
    }
}

window.addEventListener('hashchange', route);
route();
