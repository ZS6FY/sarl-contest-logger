import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, loadSession, clearSession } from './persistence.js';

// Minimal in-memory localStorage stand-in — our test runner has no browser,
// so this fakes just enough of the API to prove the wrapper works.
class MemoryStorage {
  constructor() { this.store = {}; }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

describe('persistence', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadSession()).toBeNull();
  });

  it('saves and loads a session round-trip', () => {
    const state = { operatorProfile: { name: 'PHIL' }, qsos: [{ callsign: 'ZS4WW' }] };
    saveSession(state);
    expect(loadSession()).toEqual(state);
  });

  it('clears a saved session', () => {
    saveSession({ foo: 'bar' });
    clearSession();
    expect(loadSession()).toBeNull();
  });
});