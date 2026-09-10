// contestLog.js
import { scoreContest, computeMultiplierFlags } from './scoring.js';
import { isDuplicate } from './duplicates.js';

function sortQsosByTimestamp(qsos) {
  return [...qsos].sort((a, b) => {
    const aKey = `${a.date || ''}${a.time || ''}`;
    const bKey = `${b.date || ''}${b.time || ''}`;
    return aKey.localeCompare(bKey);
  });
}

export function createContestLog(operatorProfile, contestDef) {
  let qsos = [];

  function buildResults() {
    const scores = scoreContest(contestDef, qsos);
    const flags = computeMultiplierFlags(contestDef, qsos);
    return qsos.map((qso, i) => ({
      qso,
      runningScore: scores[i],
      isNewGrid: flags[i].isNewGrid,
      isNewClub: flags[i].isNewClub,
    }));
  }

  return {
    operatorProfile,

    addQso(qso) {
      if (isDuplicate(qsos, qso)) {
        return { success: false, reason: 'duplicate' };
      }
      qsos = sortQsosByTimestamp([...qsos, qso]);
      const results = buildResults();
      const addedIndex = qsos.indexOf(qso);
      const added = results[addedIndex];
      return {
        success: true,
        runningScore: added.runningScore,
        isNewGrid: added.isNewGrid,
        isNewClub: added.isNewClub,
      };
    },

    // Replaces the QSO at `index` (index into the CURRENT, already-sorted
    // array) and recomputes the entire log. If the edit changes date/time,
    // the array is re-sorted afterward so chronological order stays correct.
    updateQso(index, updatedQso) {
      if (index < 0 || index >= qsos.length) {
        return { success: false, reason: 'invalid-index' };
      }
      const others = qsos.filter((_, i) => i !== index);
      if (isDuplicate(others, updatedQso)) {
        return { success: false, reason: 'duplicate' };
      }
      qsos = qsos.map((q, i) => (i === index ? updatedQso : q));
      qsos = sortQsosByTimestamp(qsos);
      return { success: true, results: buildResults() };
    },

    deleteQso(index) {
      if (index < 0 || index >= qsos.length) {
        return { success: false, reason: 'invalid-index' };
      }
      qsos = qsos.filter((_, i) => i !== index);
      return { success: true, results: buildResults() };
    },

    getQsos() {
      return [...qsos];
    },

    getResults() {
      return buildResults();
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