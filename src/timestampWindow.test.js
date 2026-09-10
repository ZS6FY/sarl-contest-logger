import { describe, it, expect } from 'vitest';
import { isWithinContestWindow, suggestUtcCorrection } from './timestampWindow.js';

describe('isWithinContestWindow', () => {
  it('accepts a time inside the 40m window', () => {
    expect(isWithinContestWindow('40m', '1530')).toBe(true);
  });

  it('accepts the exact window boundaries (inclusive)', () => {
    expect(isWithinContestWindow('40m', '1500')).toBe(true);
    expect(isWithinContestWindow('40m', '1600')).toBe(true);
  });

  it('rejects a time outside the 40m window', () => {
    expect(isWithinContestWindow('40m', '1459')).toBe(false);
    expect(isWithinContestWindow('40m', '1601')).toBe(false);
  });

  it('checks the correct window per band', () => {
    expect(isWithinContestWindow('80m', '1730')).toBe(true);
    expect(isWithinContestWindow('20m', '1130')).toBe(true);
    expect(isWithinContestWindow('80m', '1130')).toBe(false);
  });

  it('does not crash on an unknown band or malformed time', () => {
    expect(isWithinContestWindow('160m', '1500')).toBe(true);
    expect(isWithinContestWindow('40m', 'abcd')).toBe(true);
    expect(isWithinContestWindow('40m', '2500')).toBe(true); // invalid hour
  });
});

describe('suggestUtcCorrection', () => {
  it('suggests the correct UTC time when SAST was typed instead (40m)', () => {
    // 17:30 SAST -> 15:30 UTC, which is inside the 40m window
    expect(suggestUtcCorrection('40m', '1730')).toBe('1530');
  });

  it('suggests the correct UTC time when SAST was typed instead (80m)', () => {
    // 19:45 SAST -> 17:45 UTC, inside the 80m window
    expect(suggestUtcCorrection('80m', '1945')).toBe('1745');
  });

  it('returns null when a -2h shift does not resolve into the window', () => {
    // A time that's wrong in some other way, not a simple SAST/UTC mixup
    expect(suggestUtcCorrection('40m', '0800')).toBeNull();
  });

  it('returns null for an unknown band or malformed time', () => {
    expect(suggestUtcCorrection('160m', '1730')).toBeNull();
    expect(suggestUtcCorrection('40m', 'abcd')).toBeNull();
  });
});