// store.js — localStorage wrapper for dream data + settings

const STORAGE_KEY = 'somnus_dreams';
const API_KEY_KEY = 'somnus_deepseek_key';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getAllDreams() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveDreams(dreams) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
}

export function addDream({ fragments, narrative, keywords, mood, notes, interpretation, date }) {
    const dreams = getAllDreams();
    const dream = {
        id: generateId(),
        fragments: fragments || '',
        narrative: narrative || '',
        keywords: keywords || [],
        mood: mood || '😴',
        notes: notes || '',
        interpretation: interpretation || null,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
    };
    dreams.unshift(dream);
    saveDreams(dreams);
    return dream;
}

export function updateDream(id, updates) {
    const dreams = getAllDreams();
    const dream = dreams.find(d => d.id === id);
    if (dream) {
        Object.assign(dream, updates);
        saveDreams(dreams);
    }
    return dream;
}

export function getDreams() {
    return getAllDreams();
}

export function getDreamById(id) {
    return getAllDreams().find(d => d.id === id) || null;
}

export function deleteDream(id) {
    const dreams = getAllDreams().filter(d => d.id !== id);
    saveDreams(dreams);
}

export function searchDreams(query) {
    if (!query) return getAllDreams();
    const q = query.toLowerCase();
    return getAllDreams().filter(d =>
        d.keywords?.some(k => k.toLowerCase().includes(q)) ||
        d.fragments?.toLowerCase().includes(q) ||
        d.narrative?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q) ||
        d.mood?.includes(q) ||
        d.interpretation?.toLowerCase().includes(q)
    );
}

// Bulk import dreams (for Apple Notes import)
export function importDreams(entries) {
    const dreams = getAllDreams();
    const newDreams = entries.map(entry => ({
        id: generateId(),
        fragments: entry.fragments || '',
        narrative: '',
        keywords: [],
        mood: '😴',
        notes: '',
        interpretation: null,
        date: entry.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
    }));
    const merged = [...newDreams, ...dreams];
    // Sort by date descending
    merged.sort((a, b) => b.date.localeCompare(a.date));
    saveDreams(merged);
    return newDreams.length;
}

// API Key management
export function getApiKey() {
    return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
}

// Dream context (personal dictionary for AI interpretation)
const CONTEXT_KEY = 'somnus_dream_context';

export function getDreamContext() {
    return localStorage.getItem(CONTEXT_KEY) || '';
}

export function setDreamContext(ctx) {
    localStorage.setItem(CONTEXT_KEY, ctx);
}
