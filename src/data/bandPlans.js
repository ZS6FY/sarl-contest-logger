// src/data/bandPlans.js
// Contest-free segments per band, straight from the SARL Club Contest rules.
// A frequency inside one of these ranges is a hard stop — no QSO may be
// logged there, regardless of mode.

export const BAND_PLANS = {
  '80m': {
    contestFreeRanges: [[3651, 3700]],
  },
  '40m': {
    contestFreeRanges: [[7101, 7129]],
  },
  '20m': {
    // No contest-free segment is named in the current rules doc.
    contestFreeRanges: [],
  },
};