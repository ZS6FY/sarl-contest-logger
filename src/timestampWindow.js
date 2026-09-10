// timestampWindow.js
// Pure functions: does a manually-entered UTC time fall inside the known
// contest window for the given band? If not, would it fall inside the
// window if shifted by the SAST/UTC offset (+2 hours) — the most likely
// real mistake, since SA is a fixed UTC+2 with no DST?
//
// Time-of-day only is checked, not the specific calendar date, since exact
// contest dates change year to year and aren't worth hardcoding/maintaining.

const CONTEST_WINDOWS = {
  '80m': { startMinutes: 17 * 60, endMinutes: 18 * 60 },       // 17:00-18:00 UTC
  '40m': { startMinutes: 15 * 60, endMinutes: 16 * 60 },       // 15:00-16:00 UTC
  '20m': { startMinutes: 11 * 60, endMinutes: 12 * 60 },       // 11:00-12:00 UTC
};

function toMinutes(timeStr) {
  // Expects "HHmm", e.g. "1830"
  if (!/^\d{4}$/.test(timeStr)) return null;
  const hours = Number(timeStr.slice(0, 2));
  const minutes = Number(timeStr.slice(2, 4));
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function toTimeStr(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440; // wrap 0-1439
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
}

export function isWithinContestWindow(band, timeStr) {
  const window = CONTEST_WINDOWS[band];
  if (!window) return true; // unknown band — nothing to check against

  const minutes = toMinutes(timeStr);
  if (minutes === null) return true; // not our job to validate format here

  return minutes >= window.startMinutes && minutes <= window.endMinutes;
}

// If the entered time is a SAST value mistakenly typed instead of UTC,
// subtracting 2 hours (SAST = UTC+2) should land inside the window.
// Returns the suggested correct UTC time string, or null if that doesn't
// resolve the mismatch either (so we don't guess wrong).
export function suggestUtcCorrection(band, timeStr) {
  const window = CONTEST_WINDOWS[band];
  const minutes = toMinutes(timeStr);
  if (!window || minutes === null) return null;

  const shifted = minutes - 120; // SAST -> UTC
  const shiftedNormalized = ((shifted % 1440) + 1440) % 1440;

  if (shiftedNormalized >= window.startMinutes && shiftedNormalized <= window.endMinutes) {
    return toTimeStr(shifted);
  }
  return null;
}