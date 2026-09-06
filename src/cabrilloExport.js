// cabrilloExport.js
// Pure function: builds a Cabrillo v3 log for the SARL Club Contests
// (SARL20CC/40CC/80CC), per the new SARL Cabrillo format standard.

const MODE_MAP = { SSB: 'PH', CW: 'CW', RTTY: 'RY' };

const CONTEST_CODES = {
  '20m': 'SARL20CC',
  '40m': 'SARL40CC',
  '80m': 'SARL80CC',
};

const BAND_CODES = {
  '20m': '20M',
  '40m': '40M',
  '80m': '80M',
};

function deriveCategoryMode(qsos) {
  const modesUsed = new Set(qsos.map((q) => q.mode));
  if (modesUsed.size === 0) return '';
  if (modesUsed.size === 1) return [...modesUsed][0]; // e.g. "SSB"
  return 'MIXED';
}

export function generateCabrillo(header, operatorProfile, contestBand, qsos) {
  const lines = [];

  lines.push('START-OF-LOG: 3.0');
  lines.push(`CALLSIGN: ${header.callsign}`);
  lines.push(`CONTEST: ${CONTEST_CODES[contestBand]}`);
  lines.push(`CATEGORY-OPERATOR: ${header.categoryOperator}`);
  lines.push(`CATEGORY-POWER: ${header.categoryPower}`);
  lines.push(`CATEGORY-BAND: ${BAND_CODES[contestBand]}`);
  lines.push(`CATEGORY-MODE: ${deriveCategoryMode(qsos)}`);
  lines.push(`CLUB: ${operatorProfile.clubSent}`);
  lines.push(`GRID-LOCATOR: ${operatorProfile.gridSent}`);
  lines.push(`TX-Name: ${operatorProfile.name}`);
  lines.push(`NAME: ${header.name}`);
  lines.push(`EMAIL: ${header.email}`);

  for (const qso of qsos) {
    const mode = MODE_MAP[qso.mode];
    lines.push(
      `QSO: ${qso.frequency} ${mode} ${qso.date} ${qso.time} ${header.callsign} ${qso.callsign} ${qso.clubReceived} ${qso.gridReceived} ${qso.nameReceived}`
    );
  }

  lines.push('END-OF-LOG:');

  return lines.join('\r\n');
}