// contestLog.js
import { scoreContest, computeMultiplierFlags } from './scoring.js';
import { isDuplicate } from './duplicates.js';

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
      qsos = [...qsos, qso];
      const results = buildResults();
      const last = results[results.length - 1];
      return {
        success: true,
        runningScore: last.runningScore,
        isNewGrid: last.isNewGrid,
        isNewClub: last.isNewClub,
      };
    },

    // Replaces the QSO at `index` and recomputes the entire log, since
    // editing a grid/club can change which later QSO was "first" to work it.
    updateQso(index, updatedQso) {
      if (index < 0 || index >= qsos.length) {
        return { success: false, reason: 'invalid-index' };
      }
      const others = qsos.filter((_, i) => i !== index);
      if (isDuplicate(others, updatedQso)) {
        return { success: false, reason: 'duplicate' };
      }
      qsos = qsos.map((q, i) => (i === index ? updatedQso : q));
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