import { describe, it, expect } from 'vitest';
import { scoreContest } from './scoring.js';

const validClubs = new Set(['6PTA', '1DX', '6SRL']);

describe('scoreContest', () => {
  it('scores an SSB-only QSO sequence, including an unlisted club (5, 8, 12, 14)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6PTA' },
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '1DX' },
      { mode: 'SSB', gridReceived: 'KG33', clubReceived: '6PTA' },
      { mode: 'SSB', gridReceived: 'KG33', clubReceived: '2TEST' }, // not on the official list
    ];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5, 8, 12, 14]);
  });

  it('gives no club bonus for "NONE" (case-insensitive)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: 'NONE' },
      { mode: 'SSB', gridReceived: 'KG55', clubReceived: 'none' },
    ];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([4, 8]);
  });

  it('gives no club bonus for a club code not on the official list', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs };

    const qsos = [{ mode: 'SSB', gridReceived: 'KG44', clubReceived: 'FAKECLUB' }];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([4]);
  });

  it('scores a CW QSO at 4 points (rule 6.2)', () => {
    const contestDef = { newGridBonus: 0, newClubBonus: 0, validClubs };

    const qsos = [{ mode: 'CW', gridReceived: 'KG44', clubReceived: 'NONE' }];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([4]);
  });

  it('scores a RTTY QSO at 5 points (rule 6.3)', () => {
    const contestDef = { newGridBonus: 0, newClubBonus: 0, validClubs };

    const qsos = [{ mode: 'RTTY', gridReceived: 'KG44', clubReceived: 'NONE' }];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5]);
  });

  it('treats 6SRL as an ordinary valid club (first use bonus, no bonus on repeat)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6SRL' },
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6SRL' },
    ];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5, 7]);
  });
});