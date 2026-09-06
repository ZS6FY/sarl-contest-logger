import { describe, it, expect } from 'vitest';
import { isInContestFreeZone } from './bandPlan.js';

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