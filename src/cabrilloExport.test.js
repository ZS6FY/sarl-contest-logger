import { describe, it, expect } from 'vitest';
import { generateCabrillo } from './cabrilloExport.js';

describe('generateCabrillo', () => {
  it('matches the official 20m club contest example QSO line', () => {
    const header = {
      callsign: 'ZS6A',
      categoryOperator: 'SINGLE-OP',
      categoryPower: 'LOW',
      name: 'Johannes Smith',
      email: 'js@example.com',
    };
    const operatorProfile = { name: 'JOHANNES', gridSent: 'KG43', clubSent: '6SRL' };
    const qsos = [
      {
        date: '2014-09-12', time: '0531', callsign: 'ZS9HQ', frequency: '28080', mode: 'SSB',
        gridReceived: 'KG43', clubReceived: '6SRL', nameReceived: 'JOHANNES',
      },
    ];

    const cabrillo = generateCabrillo(header, operatorProfile, '20m', qsos);
    expect(cabrillo).toContain('QSO: 28080 PH 2014-09-12 0531 ZS6A ZS9HQ 6SRL KG43 JOHANNES');
  });

  it('includes required header fields, START/END markers, and derived CATEGORY fields', () => {
    const header = {
      callsign: 'ZS6A', categoryOperator: 'SINGLE-OP', categoryPower: 'LOW',
      name: 'Johannes Smith', email: 'js@example.com',
    };
    const operatorProfile = { name: 'JOHANNES', gridSent: 'KG43', clubSent: '6SRL' };
    const qsos = [
      { date: '2014-09-12', time: '0531', callsign: 'ZS9HQ', frequency: '7145', mode: 'SSB', gridReceived: 'KG43', clubReceived: '6SRL', nameReceived: 'JOHANNES' },
    ];

    const cabrillo = generateCabrillo(header, operatorProfile, '40m', qsos);
    const lines = cabrillo.split('\r\n');

    expect(lines[0]).toBe('START-OF-LOG: 3.0');
    expect(lines[lines.length - 1]).toBe('END-OF-LOG:');
    expect(cabrillo).toContain('CONTEST: SARL40CC');
    expect(cabrillo).toContain('CATEGORY-BAND: 40M');
    expect(cabrillo).toContain('CATEGORY-MODE: SSB');
    expect(cabrillo).toContain('CALLSIGN: ZS6A');
    expect(cabrillo).toContain('NAME: Johannes Smith');
    expect(cabrillo).toContain('EMAIL: js@example.com');
  });

  it('sets CATEGORY-MODE to MIXED when more than one mode is logged', () => {
    const header = { callsign: 'ZS6A', categoryOperator: 'SINGLE-OP', categoryPower: 'LOW', name: 'Johannes Smith', email: 'js@example.com' };
    const operatorProfile = { name: 'JOHANNES', gridSent: 'KG43', clubSent: '6SRL' };
    const qsos = [
      { date: '2014-09-12', time: '0531', callsign: 'ZS9HQ', frequency: '7145', mode: 'SSB', gridReceived: 'KG43', clubReceived: '6SRL', nameReceived: 'JOHANNES' },
      { date: '2014-09-12', time: '0532', callsign: 'ZS1AB', frequency: '7100', mode: 'CW', gridReceived: 'KG12', clubReceived: '1DX', nameReceived: 'KEITH' },
    ];

    const cabrillo = generateCabrillo(header, operatorProfile, '40m', qsos);
    expect(cabrillo).toContain('CATEGORY-MODE: MIXED');
  });

  it('maps modes to Cabrillo QSO codes correctly (PH/CW/RY)', () => {
    const header = { callsign: 'ZS6A', categoryOperator: 'SINGLE-OP', categoryPower: 'LOW', name: 'Johannes Smith', email: 'js@example.com' };
    const operatorProfile = { name: 'JOHANNES', gridSent: 'KG43', clubSent: '6SRL' };
    const qsos = [
      { date: '2014-09-12', time: '0531', callsign: 'ZS9HQ', frequency: '28080', mode: 'RTTY', gridReceived: 'KG43', clubReceived: '6SRL', nameReceived: 'JOHANNES' },
    ];

    const cabrillo = generateCabrillo(header, operatorProfile, '20m', qsos);
    expect(cabrillo).toContain('QSO: 28080 RY 2014-09-12 0531 ZS6A ZS9HQ 6SRL KG43 JOHANNES');
  });
});