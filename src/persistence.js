// persistence.js
// Thin wrapper around localStorage so an in-progress contest survives a
// crash, closed tab, or dead battery. Deliberately small and isolated —
// side effects live here, not in the rest of the engine.

const STORAGE_KEY = 'sarlClubContestSession';

export function saveSession(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load session:', err);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}