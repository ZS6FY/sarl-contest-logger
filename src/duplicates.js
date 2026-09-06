// duplicates.js
// Pure function: given the QSOs already logged and a candidate new QSO,
// determine whether the candidate is a duplicate contact.
//
// Rule (per official contest clarification): a duplicate is the same station
// worked again on the same mode. The same station worked on a different mode
// is a separate, valid contact — not a duplicate.

export function isDuplicate(existingQsos, candidateQso) {
  const candidateCall = candidateQso.callsign.trim().toUpperCase();
  const candidateMode = candidateQso.mode;

  return existingQsos.some(
    (qso) =>
      qso.callsign.trim().toUpperCase() === candidateCall &&
      qso.mode === candidateMode
  );
}