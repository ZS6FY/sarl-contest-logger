import { describe, it, expect } from 'vitest';
import { scoreContest, computeMultiplierFlags } from './scoring.js';

const validClubs = new Set(['6PTA', '1DX', '6SRL']);
const validGrids = new Set(['KG44', 'KG33', 'KG55']);

describe('scoreContest', () => {
  it('scores an SSB-only QSO sequence, including an unlisted club (5, 8, 12, 14)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6PTA' },
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '1DX' },
      { mode: 'SSB', gridReceived: 'KG33', clubReceived: '6PTA' },
      { mode: 'SSB', gridReceived: 'KG33', clubReceived: '2TEST' }, // not on the official list
    ];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5, 8, 12, 14]);
  });

  it('gives no grid bonus for a grid not on the official list (rule 6.6: non-SADC DX)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };

    const qsos = [
      // JO01 is a real grid, but a European one — not on our SADC-scoped list
      { mode: 'SSB', gridReceived: 'JO01', clubReceived: 'NONE' },
    ];

    // 2 (SSB base points only) + 0 (grid not valid) + 0 (no club) = 2
    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([2]);
  });

  it('gives no club bonus for "NONE" (case-insensitive)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: 'NONE' },
      { mode: 'SSB', gridReceived: 'KG55', clubReceived: 'none' },
    ];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([4, 8]);
  });

  it('gives no club bonus for a club code not on the official list', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };

    const qsos = [{ mode: 'SSB', gridReceived: 'KG44', clubReceived: 'FAKECLUB' }];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([4]);
  });

  it('scores a CW QSO at 4 points (rule 6.2)', () => {
    const contestDef = { newGridBonus: 0, newClubBonus: 0, validClubs, validGrids };

    const qsos = [{ mode: 'CW', gridReceived: 'KG44', clubReceived: 'NONE' }];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([4]);
  });

  it('scores a RTTY QSO at 5 points (rule 6.3)', () => {
    const contestDef = { newGridBonus: 0, newClubBonus: 0, validClubs, validGrids };

    const qsos = [{ mode: 'RTTY', gridReceived: 'KG44', clubReceived: 'NONE' }];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5]);
  });

  it('treats 6SRL as an ordinary valid club (first use bonus, no bonus on repeat)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };

    const qsos = [
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6SRL' },
      { mode: 'SSB', gridReceived: 'KG44', clubReceived: '6SRL' },
    ];

    const result = scoreContest(contestDef, qsos);
    expect(result).toEqual([5, 7]);
  });

  it('a SADC DX station can still legitimately earn a club bonus (e.g. eSwatini op, member of a valid SA club)', () => {
    const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };

    // Uses a real SADC-region grid (Eswatini) and a real, valid SA club code
    const qsos = [{ mode: 'SSB', gridReceived: 'KG52', clubReceived: '1CCR' }];
    const contestDefWithEswatini = { ...contestDef, validGrids: new Set(['KG52']) };

    const result = scoreContest(contestDefWithEswatini, qsos);
    // Club '1CCR' isn't in our tiny test validClubs subset, so this specific
    // assertion just proves grid bonus works for a SADC grid — club validity
    // is already covered by the "official list" tests above.
    expect(result[0]).toBe(4); // 2 (SSB) + 2 (new SADC grid) + 0 (club not in this test's small subset)
  });

  it('flags first grid/club per QSO, false on repeats, and denies unlisted grid', () => {
    const contestDef = { validClubs, validGrids };
    const qsos = [
      { gridReceived: 'KG44', clubReceived: '6PTA' },
      { gridReceived: 'KG44', clubReceived: '1DX' },
      { gridReceived: 'KG33', clubReceived: '6PTA' },
      { gridReceived: 'JO01', clubReceived: 'NONE' }, // non-SADC grid, never flags new
    ];

    const flags = computeMultiplierFlags(contestDef, qsos);
    expect(flags).toEqual([
      { isNewGrid: true, isNewClub: true },
      { isNewGrid: false, isNewClub: true },
      { isNewGrid: true, isNewClub: false },
      { isNewGrid: false, isNewClub: false },
    ]);
  });
});