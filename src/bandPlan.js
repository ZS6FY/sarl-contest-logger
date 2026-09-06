// bandPlan.js
// Pure functions: is this frequency inside the given band's contest-free
// zone? Is it even within the band's edges at all?

import { BAND_PLANS } from './data/bandPlans.js';

export function isInContestFreeZone(band, frequencyKHz) {
  const plan = BAND_PLANS[band];
  if (!plan) return false;

  const freq = Number(frequencyKHz);
  if (Number.isNaN(freq)) return false;

  return plan.contestFreeRanges.some(([min, max]) => freq >= min && freq <= max);
}

export function isOutsideBand(band, frequencyKHz) {
  const plan = BAND_PLANS[band];
  if (!plan) return false;

  const freq = Number(frequencyKHz);
  if (Number.isNaN(freq)) return false;

  return freq < plan.bandStart || freq > plan.bandEnd;
}