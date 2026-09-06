import { describe, it, expect } from 'vitest';
import { CLUBS, VALID_CLUB_CODES } from './clubs.js';
import { scoreContest } from '../scoring.js';

describe('CLUBS data', () => {
  it('loads all 70 official clubs', () => {
    expect(CLUBS.length).toBe(70);
  });

  it('has no duplicate club codes', () => {
    const codes = CLUBS.map((c) => c.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('includes 6SRL, 6PTA, and 1DX', () => {
    expect(VALID_CLUB_CODES.has('6SRL')).toBe(true);
    expect(VALID_CLUB_CODES.has('6PTA')).toBe(true);
    expect(VALID_CLUB_CODES.has('1DX')).toBe(true);
  });

  it('does NOT include a made-up code', () => {
    expect(VALID_CLUB_CODES.has('2TEST')).toBe(false);
  });

  it('works end-to-end with scoreContest using the real club list', () => {
    const contestDef = {
      newGridBonus: 2,
      newClubBonus: 1,
      validClubs: VALID_CLUB_CODES,
    };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6PTA' }, // real club
      { mode: 'SSB', gridReceived: 'KG55', clubReceived: 'NOTREAL' }, // not on list
    ];

    // QSO1: 2 + 2 (new grid) + 1 (valid new club) = 5
    // QSO2: 2 + 2 (new grid) + 0 (invalid club) = 4 -> running total 9
    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5, 9]);
  });
});