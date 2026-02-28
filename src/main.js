// main.js — App entry point, auth guard & router

import './styles/main.css';
import { initStarField } from './components/StarField.js';
import { renderNewDream } from './views/NewDream.js';
import { renderDreamList } from './views/DreamList.js';
import { renderDreamDetail } from './views/DreamDetail.js';
import { renderAnalysis } from './views/Analysis.js';
import { renderSettings } from './views/Settings.js';
import { renderLogin } from './views/Login.js';
import { supabase } from './services/supabase.js';

initStarField();

const app = document.getElementById('app');

function route() {
    const hash = window.location.hash || '#/new';
    if (hash.startsWith('#/dream/')) {
        renderDreamDetail(app, hash.replace('#/dream/', ''));
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

// Auth guard: show login if not signed in, route if signed in
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        window.addEventListener('hashchange', route);
        route();
    } else {
        window.removeEventListener('hashchange', route);
        renderLogin(app);
    }
});
