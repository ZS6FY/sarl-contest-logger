import { describe, it, expect } from 'vitest';
import { generateCsv } from './csvExport.js';

describe('generateCsv', () => {
  it('produces the header row matching the official log sheet column order', () => {
    const csv = generateCsv({ name: 'PHIL', gridSent: 'KG54', clubSent: '6LOW' }, []);
    expect(csv).toBe(
      'Date,Time,Callsign,Frequency,Mode,Name Sent,Grid Sent,Club Sent,Name Received,Grid Received,Club Received'
    );
  });

  it('includes operator "sent" info on every row, plus per-QSO "received" data', () => {
    const operatorProfile = { name: 'PHIL', gridSent: 'KG54', clubSent: '6LOW' };
    const qsos = [
      {
        date: '2026-09-05', time: '1403', callsign: 'ZS6HI', frequency: '7145', mode: 'SSB',
        nameReceived: 'KEITH', gridReceived: 'KG44', clubReceived: '6STN',
      },
    ];

    const csv = generateCsv(operatorProfile, qsos);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe(
      '2026-09-05,1403,ZS6HI,7145,SSB,PHIL,KG54,6LOW,KEITH,KG44,6STN'
    );
  });

  it('escapes fields containing commas or quotes', () => {
    const operatorProfile = { name: 'PHIL, JR', gridSent: 'KG54', clubSent: '6LOW' };
    const qsos = [
      {
        date: '2026-09-05', time: '1403', callsign: 'ZS6HI', frequency: '7145', mode: 'SSB',
        nameReceived: 'KEITH "K" SMITH', gridReceived: 'KG44', clubReceived: '6STN',
      },
    ];

    const csv = generateCsv(operatorProfile, qsos);
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('"PHIL, JR"');
    expect(lines[1]).toContain('"KEITH ""K"" SMITH"');
  });
});