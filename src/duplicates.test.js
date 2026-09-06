import { describe, it, expect } from 'vitest';
import { isDuplicate } from './duplicates.js';

describe('isDuplicate', () => {
  it('flags the same callsign worked again on the same mode', () => {
    const existing = [{ callsign: 'ZS4WW', mode: 'SSB' }];
    const candidate = { callsign: 'ZS4WW', mode: 'SSB' };

    expect(isDuplicate(existing, candidate)).toBe(true);
  });

  it('does NOT flag the same callsign worked on a different mode', () => {
    const existing = [
      { callsign: 'ZS4WW', mode: 'SSB' },
      { callsign: 'ZS4WW', mode: 'CW' },
    ];
    const candidate = { callsign: 'ZS4WW', mode: 'RTTY' };

    expect(isDuplicate(existing, candidate)).toBe(false);
  });

  it('does NOT flag a different callsign on the same mode', () => {
    const existing = [{ callsign: 'ZS6FY', mode: 'SSB' }];
    const candidate = { callsign: 'ZS4WW', mode: 'SSB' };

    expect(isDuplicate(existing, candidate)).toBe(false);
  });

  it('is case-insensitive on callsign', () => {
    const existing = [{ callsign: 'zs4ww', mode: 'SSB' }];
    const candidate = { callsign: 'ZS4WW', mode: 'SSB' };

    expect(isDuplicate(existing, candidate)).toBe(true);
  });

  it('returns false against an empty log', () => {
    expect(isDuplicate([], { callsign: 'ZS4WW', mode: 'SSB' })).toBe(false);
  });
});