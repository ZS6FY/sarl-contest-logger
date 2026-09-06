// contestLog.js
import { scoreContest, isValidClub } from './scoring.js';
import { isDuplicate } from './duplicates.js';

export function createContestLog(operatorProfile, contestDef) {
  const qsos = [];
  const seenGrids = new Set();
  const seenClubs = new Set();

  return {
    operatorProfile,

    addQso(qso) {
      if (isDuplicate(qsos, qso)) {
        return { success: false, reason: 'duplicate' };
      }

      const isNewGrid = Boolean(qso.gridReceived) && !seenGrids.has(qso.gridReceived);
      const clubCode = qso.clubReceived ? qso.clubReceived.trim().toUpperCase() : '';
      const isNewClub = isValidClub(clubCode, contestDef.validClubs) && !seenClubs.has(clubCode);

      qsos.push(qso);
      if (isNewGrid) seenGrids.add(qso.gridReceived);
      if (isNewClub) seenClubs.add(clubCode);

      const scores = scoreContest(contestDef, qsos);
      return {
        success: true,
        runningScore: scores[scores.length - 1],
        isNewGrid,
        isNewClub,
      };
    },

    getQsos() {
      return [...qsos];
    },

    getRunningScores() {
      return scoreContest(contestDef, qsos);
    },

    getTotalScore() {
      const scores = scoreContest(contestDef, qsos);
      return scores.length ? scores[scores.length - 1] : 0;
    },
  };
}