// callsignValidation.js
// Pure function: minimal, deliberately loose callsign validity check.
//
// Rule: a callsign must contain at least one digit, and nothing stricter.
// This is intentional — real callsigns vary too much in shape to validate
// more precisely without wrongly rejecting legitimate ones: special event
// calls (ZS100SARL), rare prefixes (ZS7, ZS8), portable/area notation
// (ZS6FY/5, ZS5/ZS6FY, ZS6FY/P, ZS6FY/M), and foreign DX calls of every
// shape. The one thing that's genuinely near-universal is that a real
// callsign has a digit in it somewhere; a string with none essentially
// never is one.

export function isValidCallsignFormat(callsign) {
  if (!callsign) return false;
  return /\d/.test(callsign);
}