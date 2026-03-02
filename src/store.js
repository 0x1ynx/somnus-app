// store.js — Supabase for dreams, localStorage for settings

import { supabase } from './services/supabase.js';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- Dreams (Supabase) ----

export async function addDream({ fragments, narrative, keywords, mood, notes, interpretation, date }) {
    const { data: { user } } = await supabase.auth.getUser();
    const dream = {
        id: generateId(),
        user_id: user.id,
        fragments: fragments || '',
        narrative: narrative || '',
        keywords: keywords || [],
        mood: mood || '😴',
        notes: notes || '',
        interpretation: interpretation || null,
        date: date || new Date().toISOString().split('T')[0],
    };
    const { data, error } = await supabase.from('dreams').insert(dream).select().single();
    if (error) throw error;
    return data;
}

export async function updateDream(id, updates) {
    const { data, error } = await supabase.from('dreams').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function getDreams() {
    const { data, error } = await supabase.from('dreams').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function getDreamById(id) {
    const { data, error } = await supabase.from('dreams').select('*').eq('id', id).single();
    if (error) return null;
    return data;
}

export async function deleteDream(id) {
    const { error } = await supabase.from('dreams').delete().eq('id', id);
    if (error) throw error;
}

export async function searchDreams(query) {
    if (!query) return getDreams();
    const q = query.toLowerCase();
    const dreams = await getDreams();
    return dreams.filter(d =>
        d.keywords?.some(k => k.toLowerCase().includes(q)) ||
        d.fragments?.toLowerCase().includes(q) ||
        d.narrative?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q) ||
        d.mood?.includes(q) ||
        d.interpretation?.toLowerCase().includes(q)
    );
}

export async function importDreams(entries) {
    const { data: { user } } = await supabase.auth.getUser();
    const newDreams = entries.map(entry => ({
        id: generateId(),
        user_id: user.id,
        fragments: entry.fragments || '',
        narrative: '',
        keywords: [],
        mood: '😴',
        notes: '',
        interpretation: null,
        date: entry.date || new Date().toISOString().split('T')[0],
    }));
    const { error } = await supabase.from('dreams').insert(newDreams);
    if (error) throw error;
    return newDreams.length;
}

// ---- Draft (localStorage — auto-save in-progress dream) ----

const DRAFT_KEY = 'somnus_dream_draft';

export function saveDraft({ fragments, mood, date }) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ fragments, mood, date }));
}

export function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(DRAFT_KEY);
        return null;
    }
}

export function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

// ---- Settings (localStorage — stays local, never synced) ----

const API_KEY_KEY = 'somnus_deepseek_key';
const CONTEXT_KEY = 'somnus_dream_context';

export function getApiKey() {
    return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
}

export function getDreamContext() {
    return localStorage.getItem(CONTEXT_KEY) || '';
}

export function setDreamContext(ctx) {
    localStorage.setItem(CONTEXT_KEY, ctx);
}
