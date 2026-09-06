// timestamp.js
// Pure helpers for UTC date/time formatting, used to auto-stamp QSOs at
// the moment they're logged (never rely on local system time/timezone).

export function formatUtcDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatUtcTime(date) {
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}${min}`; // 4-digit HHmm, matches Cabrillo's time format too
}