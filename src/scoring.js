// scoring.js
// Pure function: takes a contest definition + array of QSOs, returns running scores.
// No side effects, no storage, no UI dependency.
//
// Mode points (SARL Club Contest rules 6.1-6.3):
//   SSB = 2 pts, CW = 4 pts, RTTY = 5 pts
//
// Club scoring (rule 6.5): +1 pt for the first QSO with each valid club, once per club.
// "NONE" (any case) means the contestant claimed no club — no club point.
// A club code that isn't on the official abbreviated list also scores no club point.
//
// Note: gridReceived/clubReceived refer to what the OTHER station reported —
// scoring is based on grids/clubs worked, not the operator's own "sent" info.

const MODE_POINTS = {
  SSB: 2,
  CW: 4,
  RTTY: 5,
};

export function isValidClub(clubCode, validClubs) {
  if (!clubCode) return false;
  const normalized = clubCode.trim().toUpperCase();
  if (normalized === 'NONE') return false;
  return validClubs.has(normalized);
}

export function scoreContest(contestDef, qsos) {
  const runningScores = [];
  let total = 0;
  const seenGrids = new Set();
  const seenClubs = new Set();

  for (const qso of qsos) {
    const modePoints = MODE_POINTS[qso.mode];
    if (modePoints === undefined) {
      throw new Error(`Unsupported mode: "${qso.mode}" (only SSB/CW/RTTY are implemented)`);
    }
    total += modePoints;

    if (qso.gridReceived && !seenGrids.has(qso.gridReceived)) {
      seenGrids.add(qso.gridReceived);
      total += contestDef.newGridBonus;
    }

    const clubCode = qso.clubReceived ? qso.clubReceived.trim().toUpperCase() : '';
    if (isValidClub(clubCode, contestDef.validClubs) && !seenClubs.has(clubCode)) {
      seenClubs.add(clubCode);
      total += contestDef.newClubBonus;
    }

    runningScores.push(total);
  }

  return runningScores;
}

// Returns { isNewGrid, isNewClub } for every QSO, in order — used both when
// adding a QSO and when recomputing the whole log after an edit or delete,
// since "first" grid/club status depends on the full ordered history.
export function computeMultiplierFlags(contestDef, qsos) {
  const seenGrids = new Set();
  const seenClubs = new Set();

  return qsos.map((qso) => {
    const isNewGrid = Boolean(qso.gridReceived) && !seenGrids.has(qso.gridReceived);
    const clubCode = qso.clubReceived ? qso.clubReceived.trim().toUpperCase() : '';
    const isNewClub = isValidClub(clubCode, contestDef.validClubs) && !seenClubs.has(clubCode);

    if (isNewGrid) seenGrids.add(qso.gridReceived);
    if (isNewClub) seenClubs.add(clubCode);

    return { isNewGrid, isNewClub };
  });
}