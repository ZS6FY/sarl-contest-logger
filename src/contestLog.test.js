import { describe, it, expect } from 'vitest';
import { createContestLog } from './contestLog.js';

const validClubs = new Set(['6PTA', '1DX']);
const contestDef = { newGridBonus: 2, newClubBonus: 1, validClubs };
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
});