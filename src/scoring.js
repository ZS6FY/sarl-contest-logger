// scoring.js
// Pure function: takes a contest definition + array of QSOs, returns running scores.
// No side effects, no storage, no UI dependency.
//
// Mode points (SARL Club Contest rules 6.1-6.3):
//   SSB = 2 pts, CW = 4 pts, RTTY = 5 pts
//
// Grid/club scoring (rules 6.4/6.5): +2/+1 for the first QSO with each valid
// grid/club, once each. A grid or club that isn't on the official list scores
// no bonus — this also correctly implements rule 6.6 (DX QSOs with entities
// outside SADC get base points only, no grid/club bonus): the official grid
// list only covers ZS call areas plus the neighboring SADC countries, so a
// non-SADC grid automatically fails validation and never earns a bonus. Club
// bonus eligibility depends only on club-code validity, matching real
// evaluator practice — SADC-based DX operators can legitimately hold valid
// SA club membership and correctly earn the bonus.

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

export function isValidGrid(gridCode, validGrids) {
  if (!gridCode) return false;
  const normalized = gridCode.trim().toUpperCase();
  return validGrids.has(normalized);
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

    const gridCode = qso.gridReceived ? qso.gridReceived.trim().toUpperCase() : '';
    if (isValidGrid(gridCode, contestDef.validGrids) && !seenGrids.has(gridCode)) {
      seenGrids.add(gridCode);
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

export function computeMultiplierFlags(contestDef, qsos) {
  const seenGrids = new Set();
  const seenClubs = new Set();

  return qsos.map((qso) => {
    const gridCode = qso.gridReceived ? qso.gridReceived.trim().toUpperCase() : '';
    const isNewGrid = isValidGrid(gridCode, contestDef.validGrids) && !seenGrids.has(gridCode);

    const clubCode = qso.clubReceived ? qso.clubReceived.trim().toUpperCase() : '';
    const isNewClub = isValidClub(clubCode, contestDef.validClubs) && !seenClubs.has(clubCode);

    if (isNewGrid) seenGrids.add(gridCode);
    if (isNewClub) seenClubs.add(clubCode);

    return { isNewGrid, isNewClub };
  });
}