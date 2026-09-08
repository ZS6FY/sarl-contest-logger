// adifExport.js
// Pure function: builds an ADIF 3.1 export for personal record-keeping
// (QRZ, LoTW, Club Log, etc.) — separate from contest submission formats.
// Uses APP_ZSCONTESTLOG_* vendor tags for data with no standard ADIF field
// (e.g. club), since ADIF has no built-in concept of contest club bonuses.

function tag(name, value) {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value);
  return `<${name}:${str.length}>${str} `;
}

function freqKhzToMhz(freqKhz) {
  const num = Number(freqKhz);
  if (Number.isNaN(num)) return '';
  return (num / 1000).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

export function generateAdif(operatorProfile, contestBand, qsos) {
  const lines = [];

  lines.push('ADIF Export from ZS Contest Log');
  lines.push('<ADIF_VER:5>3.1.0');
  lines.push('<PROGRAMID:12>ZSContestLog');
  lines.push('<EOH>');
  lines.push('');

  for (const qso of qsos) {
    const record = [
      tag('QSO_DATE', qso.date ? qso.date.replace(/-/g, '') : ''),
      tag('TIME_ON', qso.time ? `${qso.time}00` : ''),
      tag('CALL', qso.callsign),
      tag('BAND', contestBand),
      tag('FREQ', freqKhzToMhz(qso.frequency)),
      tag('MODE', qso.mode),
      tag('STATION_CALLSIGN', operatorProfile.callsign),
      tag('MY_GRIDSQUARE', operatorProfile.gridSent),
      tag('GRIDSQUARE', qso.gridReceived),
      tag('NAME', qso.nameReceived),
      tag('APP_ZSCONTESTLOG_CLUB', qso.clubReceived),
    ].join('');

    lines.push(`${record}<eor>`);
  }

  return lines.join('\n');
}