import { describe, it, expect } from 'vitest';
import { isValidCallsignFormat } from './callsignValidation.js';

describe('isValidCallsignFormat', () => {
  it('accepts ordinary callsigns', () => {
    expect(isValidCallsignFormat('ZS6FY')).toBe(true);
    expect(isValidCallsignFormat('K6ARK')).toBe(true);
    expect(isValidCallsignFormat('V51MJ')).toBe(true);
  });

  it('accepts special event and vanity calls with multi-digit numbers', () => {
    expect(isValidCallsignFormat('ZS100SARL')).toBe(true);
  });

  it('accepts rare prefixes', () => {
    expect(isValidCallsignFormat('ZS7ABC')).toBe(true);
    expect(isValidCallsignFormat('ZS8MI')).toBe(true);
  });

  it('accepts portable and call-area-change notation', () => {
    expect(isValidCallsignFormat('ZS6FY/5')).toBe(true);
    expect(isValidCallsignFormat('ZS5/ZS6FY')).toBe(true);
    expect(isValidCallsignFormat('ZS6FY/P')).toBe(true);
    expect(isValidCallsignFormat('ZS6FY/M')).toBe(true);
  });

  it('rejects a callsign with no digit at all', () => {
    expect(isValidCallsignFormat('ZSFY')).toBe(false);
    expect(isValidCallsignFormat('ZSHI')).toBe(false);
  });

  it('rejects blank input', () => {
    expect(isValidCallsignFormat('')).toBe(false);
    expect(isValidCallsignFormat(null)).toBe(false);
    expect(isValidCallsignFormat(undefined)).toBe(false);
  });
});