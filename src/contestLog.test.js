import { describe, it, expect } from 'vitest';
import { createContestLog } from './contestLog.js';

const validClubs = new Set(['6PTA', '1DX']);
const validGrids = new Set(['KG44', 'KG33', 'KG99']);
const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs, validGrids };
const operatorProfile = { name: 'PHIL', gridSent: 'KG44', clubSent: '6PTA' };

describe('createContestLog', () => {
  it('starts with zero QSOs and zero score', () => {
    const log = createContestLog(operatorProfile, contestDef);
    expect(log.getQsos()).toEqual([]);
    expect(log.getTotalScore()).toBe(0);
  });

  it('adds a valid QSO and returns the updated running score', () => {
    const log = createContestLog(operatorProfile, contestDef);
    const result = log.addQso({
      callsign: 'ZS4WW',
      mode: 'SSB',
      gridReceived: 'KG33',
      clubReceived: '1DX',
    });

    // 2 (SSB) + 2 (new grid) + 1 (new club) = 5
    expect(result).toEqual({ success: true, runningScore: 5, isNewGrid: true, isNewClub: true });
    expect(log.getQsos().length).toBe(1);
  });

  it('rejects a duplicate QSO (same callsign + mode) without storing it', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });

    const result = log.addQso({
      callsign: 'ZS4WW',
      mode: 'SSB',
      gridReceived: 'KG99',
      clubReceived: '6PTA',
    });

    expect(result).toEqual({ success: false, reason: 'duplicate' });
    expect(log.getQsos().length).toBe(1); // still just the first one
  });

  it('allows the same callsign again on a different mode (not a duplicate)', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });
    const result = log.addQso({
      callsign: 'ZS4WW',
      mode: 'CW',
      gridReceived: 'KG33',
      clubReceived: '1DX',
    });

    // QSO1: 2+2+1=5. QSO2 (CW, same grid/club so no new bonus): 4+0+0=4 -> running 9
    expect(result).toEqual({ success: true, runningScore: 9, isNewGrid: false, isNewClub: false });
    expect(log.getQsos().length).toBe(2);
  });

  it('getRunningScores returns the full progression', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });
    log.addQso({ callsign: 'ZS9XY', mode: 'SSB', gridReceived: 'KG44', clubReceived: '6PTA' });

    // QSO1: 2+2+1=5. QSO2: 2+2(new grid)+1(new club)=5 -> running 10
    expect(log.getRunningScores()).toEqual([5, 10]);
  });

    it('flags new grid and new club multipliers, and clears them on repeat', () => {
    const log = createContestLog(operatorProfile, contestDef);

    const first = log.addQso({
      callsign: 'ZS4WW',
      mode: 'SSB',
      gridReceived: 'KG33',
      clubReceived: '1DX',
    });
    expect(first).toMatchObject({ isNewGrid: true, isNewClub: true });

    const second = log.addQso({
      callsign: 'ZS9XY',
      mode: 'SSB',
      gridReceived: 'KG33', // repeat grid
      clubReceived: '1DX',  // repeat club
    });
    expect(second).toMatchObject({ isNewGrid: false, isNewClub: false });

    const third = log.addQso({
      callsign: 'ZS1AB',
      mode: 'SSB',
      gridReceived: 'KG99', // new grid
      clubReceived: 'FAKECLUB', // invalid club, never counts as new
    });
    expect(third).toMatchObject({ isNewGrid: true, isNewClub: false });
  });

    it('updates a QSO and recomputes multipliers for the whole log', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });
    log.addQso({ callsign: 'ZS9XY', mode: 'SSB', gridReceived: 'KG33', clubReceived: '6PTA' });

    // Fix a typo in the first QSO's grid — this is now a different grid than QSO2,
    // so QSO2's grid should become "new" too (it wasn't before).
    const result = log.updateQso(0, {
      callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG99', clubReceived: '1DX',
    });

    expect(result.success).toBe(true);
    expect(result.results[0]).toMatchObject({ isNewGrid: true, isNewClub: true }); // KG99, 1DX
    expect(result.results[1]).toMatchObject({ isNewGrid: true, isNewClub: true }); // KG33 now new, 6PTA now new
  });

  it('rejects an update that would duplicate another existing QSO', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });
    log.addQso({ callsign: 'ZS9XY', mode: 'SSB', gridReceived: 'KG44', clubReceived: '6PTA' });

    // Try to edit QSO2 to have the same callsign+mode as QSO1
    const result = log.updateQso(1, {
      callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG44', clubReceived: '6PTA',
    });

    expect(result).toEqual({ success: false, reason: 'duplicate' });
  });

  it('allows editing a QSO without it flagging itself as a duplicate', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });

    // Same callsign+mode as itself, just correcting the grid — should succeed
    const result = log.updateQso(0, {
      callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG99', clubReceived: '1DX',
    });

    expect(result.success).toBe(true);
  });

  it('deletes a QSO and recomputes the remaining log', () => {
    const log = createContestLog(operatorProfile, contestDef);
    log.addQso({ callsign: 'ZS4WW', mode: 'SSB', gridReceived: 'KG33', clubReceived: '1DX' });
    log.addQso({ callsign: 'ZS9XY', mode: 'SSB', gridReceived: 'KG33', clubReceived: '6PTA' });

    const result = log.deleteQso(0);

    expect(result.success).toBe(true);
    expect(result.results.length).toBe(1);
    expect(result.results[0]).toMatchObject({ isNewGrid: true, isNewClub: true });
    
  });
});