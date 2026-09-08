import { describe, it, expect } from 'vitest';
import { generateAdif } from './adifExport.js';

describe('generateAdif', () => {
  it('produces a valid ADIF header', () => {
    const adif = generateAdif({ callsign: 'ZS6FY', gridSent: 'KG54' }, '40m', []);
    expect(adif).toContain('<ADIF_VER:5>3.1.0');
    expect(adif).toContain('<PROGRAMID:12>ZSContestLog');
    expect(adif).toContain('<EOH>');
  });

  it('produces a correctly tagged QSO record', () => {
    const operatorProfile = { callsign: 'ZS6FY', gridSent: 'KG54' };
    const qsos = [
      {
        date: '2026-09-06', time: '1830', callsign: 'ZS6HI', frequency: '7145', mode: 'SSB',
        gridReceived: 'KG44', clubReceived: '6STN', nameReceived: 'KEITH',
      },
    ];

    const adif = generateAdif(operatorProfile, '40m', qsos);

    expect(adif).toContain('<QSO_DATE:8>20260906');
    expect(adif).toContain('<TIME_ON:6>183000');
    expect(adif).toContain('<CALL:5>ZS6HI');
    expect(adif).toContain('<BAND:3>40m');
    expect(adif).toContain('<FREQ:5>7.145');
    expect(adif).toContain('<MODE:3>SSB');
    expect(adif).toContain('<STATION_CALLSIGN:5>ZS6FY');
    expect(adif).toContain('<MY_GRIDSQUARE:4>KG54');
    expect(adif).toContain('<GRIDSQUARE:4>KG44');
    expect(adif).toContain('<NAME:5>KEITH');
    expect(adif).toContain('<APP_ZSCONTESTLOG_CLUB:4>6STN');
    expect(adif).toContain('<eor>');
  });

  it('omits optional tags when a field is blank rather than writing empty tags', () => {
    const operatorProfile = { callsign: 'ZS6FY', gridSent: 'KG54' };
    const qsos = [
      {
        date: '2026-09-06', time: '1830', callsign: 'ZS6HI', frequency: '7145', mode: 'SSB',
        gridReceived: '', clubReceived: '', nameReceived: '',
      },
    ];

    const adif = generateAdif(operatorProfile, '40m', qsos);
    expect(adif).not.toContain('GRIDSQUARE:0');
    expect(adif).not.toContain('APP_ZSCONTESTLOG_CLUB:0');
    expect(adif).not.toContain('NAME:0');
  });

  it('produces one <eor> per QSO for multiple contacts', () => {
    const operatorProfile = { callsign: 'ZS6FY', gridSent: 'KG54' };
    const qsos = [
      { date: '2026-09-06', time: '1830', callsign: 'ZS6HI', frequency: '7145', mode: 'SSB', gridReceived: 'KG44', clubReceived: '6STN', nameReceived: 'KEITH' },
      { date: '2026-09-06', time: '1832', callsign: 'ZS6LZ', frequency: '7145', mode: 'SSB', gridReceived: 'KG43', clubReceived: '6STN', nameReceived: 'PIET' },
    ];

    const adif = generateAdif(operatorProfile, '40m', qsos);
    const eorCount = (adif.match(/<eor>/g) || []).length;
    expect(eorCount).toBe(2);
  });
});