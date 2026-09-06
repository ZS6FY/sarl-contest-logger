// src/data/bandPlans.js
// Band edges and contest-free segments per band, straight from the SARL
// Club Contest rules. A frequency outside the band edges, or inside a
// contest-free segment, is a hard stop — no QSO may be logged there.

export const BAND_PLANS = {
  '80m': {
    bandStart: 3500,
    bandEnd: 3800,
    contestFreeRanges: [[3651, 3700]],
  },
  '40m': {
    bandStart: 7000,
    bandEnd: 7200,
    contestFreeRanges: [[7101, 7129]],
  },
  '20m': {
    bandStart: 14000,
    bandEnd: 14350,
    // No contest-free segment is named in the current rules doc.
    contestFreeRanges: [],
  },
};