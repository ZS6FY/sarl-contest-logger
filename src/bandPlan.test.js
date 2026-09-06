import { describe, it, expect } from 'vitest';
import { isInContestFreeZone, isOutsideBand } from './bandPlan.js';

describe('isInContestFreeZone', () => {
  it('flags frequencies inside the 80m contest-free segment (inclusive bounds)', () => {
    expect(isInContestFreeZone('80m', 3651)).toBe(true);
    expect(isInContestFreeZone('80m', 3700)).toBe(true);
    expect(isInContestFreeZone('80m', 3675)).toBe(true);
  });

  it('allows frequencies just outside the 80m contest-free segment', () => {
    expect(isInContestFreeZone('80m', 3650)).toBe(false);
    expect(isInContestFreeZone('80m', 3701)).toBe(false);
  });

  it('flags frequencies inside the 40m contest-free segment (inclusive bounds)', () => {
    expect(isInContestFreeZone('40m', 7101)).toBe(true);
    expect(isInContestFreeZone('40m', 7129)).toBe(true);
  });

  it('allows frequencies just outside the 40m contest-free segment', () => {
    expect(isInContestFreeZone('40m', 7100)).toBe(false);
    expect(isInContestFreeZone('40m', 7130)).toBe(false);
  });

  it('never flags anything on 20m (no defined contest-free segment)', () => {
    expect(isInContestFreeZone('20m', 14090)).toBe(false);
  });

  it('does not crash on an unknown band or non-numeric frequency', () => {
    expect(isInContestFreeZone('160m', 1900)).toBe(false);
    expect(isInContestFreeZone('40m', 'abc')).toBe(false);
    expect(isInContestFreeZone('40m', '')).toBe(false);
  });
});

describe('isOutsideBand', () => {
  it('flags a frequency below the band edge', () => {
    expect(isOutsideBand('40m', 6999)).toBe(true);
    expect(isOutsideBand('80m', 3499)).toBe(true);
    expect(isOutsideBand('20m', 13999)).toBe(true);
  });

  it('flags a frequency above the band edge', () => {
    expect(isOutsideBand('40m', 7201)).toBe(true);
    expect(isOutsideBand('80m', 3801)).toBe(true);
    expect(isOutsideBand('20m', 14351)).toBe(true);
  });

  it('allows frequencies exactly on the band edges (inclusive)', () => {
    expect(isOutsideBand('40m', 7000)).toBe(false);
    expect(isOutsideBand('40m', 7200)).toBe(false);
  });

  it('flags the real bug case: 9090 kHz claimed as 40m', () => {
    expect(isOutsideBand('40m', 9090)).toBe(true);
  });

  it('allows a normal in-band frequency', () => {
    expect(isOutsideBand('40m', 7145)).toBe(false);
  });

  it('does not crash on an unknown band or non-numeric frequency', () => {
    expect(isOutsideBand('160m', 1900)).toBe(false);
    expect(isOutsideBand('40m', 'abc')).toBe(false);
  });
});