// bandPlan.js
// Pure function: is this frequency inside the given band's contest-free zone?

import { BAND_PLANS } from './data/bandPlans.js';

export function isInContestFreeZone(band, frequencyKHz) {
  const plan = BAND_PLANS[band];
  if (!plan) return false; // unknown band — nothing to check against

  const freq = Number(frequencyKHz);
  if (Number.isNaN(freq)) return false; // not a number — let other validation handle it

  return plan.contestFreeRanges.some(([min, max]) => freq >= min && freq <= max);
}