import { describe, it, expect } from 'vitest';
import { formatUtcDate, formatUtcTime } from './timestamp.js';

describe('formatUtcDate', () => {
  it('formats a UTC date as yyyy-MM-dd', () => {
    const d = new Date(Date.UTC(2026, 8, 5, 14, 3));
    expect(formatUtcDate(d)).toBe('2026-09-05');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(Date.UTC(2026, 0, 7, 0, 0));
    expect(formatUtcDate(d)).toBe('2026-01-07');
  });
});

describe('formatUtcTime', () => {
  it('formats UTC time as 4-digit HHmm', () => {
    const d = new Date(Date.UTC(2026, 8, 5, 14, 3));
    expect(formatUtcTime(d)).toBe('1403');
  });

  it('pads single-digit hour and minute', () => {
    const d = new Date(Date.UTC(2026, 8, 5, 5, 6));
    expect(formatUtcTime(d)).toBe('0506');
  });
});