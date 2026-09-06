// csvExport.js
// Pure function: builds a CSV string matching the official log sheet's
// column order, ready for copy/paste. "Sent" columns come from the
// operator profile (constant for the whole log); "received" columns come
// from each QSO.

const HEADERS = [
  'Date', 'Time', 'Callsign', 'Frequency', 'Mode',
  'Name Sent', 'Grid Sent', 'Club Sent',
  'Name Received', 'Grid Received', 'Club Received',
];

function escapeCsvField(value) {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(operatorProfile, qsos) {
  const rows = [HEADERS.join(',')];

  for (const qso of qsos) {
    const row = [
      qso.date,
      qso.time,
      qso.callsign,
      qso.frequency,
      qso.mode,
      operatorProfile.name,
      operatorProfile.gridSent,
      operatorProfile.clubSent,
      qso.nameReceived,
      qso.gridReceived,
      qso.clubReceived,
    ].map(escapeCsvField);
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}