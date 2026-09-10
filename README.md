# SARL Club Contest Logger

A free, open-source Progressive Web App (PWA) for logging the SARL 80m, 40m, and 20m Club Contests. Works offline once installed, runs on Android, iOS, and desktop browsers, and exports logs in both CSV and Cabrillo v3 format.

Live app: https://zs6fy.github.io/sarl-contest-logger/

## What this is

This logger was built to make entering, scoring, and submitting Club Contest logs faster and less error-prone — automatic scoring per the official rules, real-time duplicate detection, and built-in validation against the official club and grid-square lists, all without needing an internet connection once installed.

It is an independent project, not an official SARL tool, though it aims to follow the official Club Contest rules exactly.

## Installing

1. Open the live app link above in a mobile or desktop browser.
2. **Android (Chrome):** tap the menu (⋮) → "Install app" or "Add to Home Screen."
3. **iOS (Safari):** tap the Share icon → "Add to Home Screen."
4. Once installed, it works fully offline — no signal needed during a contest.

**Important:** to get an updated version later, don't just switch away from the app and back — fully close it (swipe it away from your recent-apps list) and reopen it. If an update is available, you'll get an "Update Now / Later" prompt automatically the next time you open it.

## Starting a contest

On the setup screen, enter:
- **Your Name** and **Your Grid** — your 4-character grid square (e.g. `KG44`)
- **Your Club Code** — your club's official abbreviation (or `NONE` if you're not logging for a club, or `6SRL` if you're a SARL member without a club)
- **Contest Band** — 80m, 40m, or 20m
- **Mode** — your starting mode (you can change it per QSO later)

Tap **Start Contest**.

## Logging a QSO

Fields: Callsign, Frequency (kHz), Name/Grid/Club Received, and Mode.

- **Tab** moves between fields in a sensible order for one-handed entry; pressing **Enter** in any field logs the QSO, same as tapping **Add QSO**.
- **Run Freq: ON** (default) keeps the frequency field filled in between QSOs, for when you're calling CQ on one frequency. Toggle it **OFF** if you're search-and-pounce tuning across the band — the frequency field will clear after each QSO so you don't forget to update it.
- **Clear** wipes the entry fields without logging anything (frequency and mode aren't cleared, per the Run Freq setting).
- **Date and Time (UTC)** auto-fill with the current time when you start logging, but can be edited manually — useful if you're logging on paper during the contest and transcribing afterward. If you manually change the time to something outside this contest's usual UTC window, you'll get a one-time heads-up warning (it won't block you, and won't repeat for every entry after that).

### What happens if something looks wrong

- **Blank or unrecognized Grid/Club:** you'll get a warning ("Log Anyway" or "Edit QSO") — this doesn't block you, since the field might be blank because you're still getting the info from the other station, but it won't count toward scoring until it's a real, recognized value.
- **Duplicate contact** (same callsign, same mode): rejected outright, since it doesn't count toward your score. A different mode with the same callsign is fine — that's genuinely a new contact.
- **Frequency inside the contest-free segment, or outside the band entirely:** blocked outright. These are real, submission-affecting rule violations, not typos to double-check.
- **Callsign with no number in it:** blocked outright — every real callsign contains a digit somewhere, so this is almost always a typo (e.g. missing the call-area number).

### Multipliers

The **Multi** columns next to Grid and Club show a green ✓ the first time you work that grid square or club in the contest — that's when the bonus points are earned. Later contacts with the same grid/club score normally but don't repeat the bonus.

## Fixing a mistake

**Long-press** (or click-and-hold) any row in the log to bring up **Edit** / **Delete** / **Cancel**.

- **Edit** opens a form pre-filled with that QSO's details, including Date/Time — useful for correcting a mistyped timestamp. Saving recalculates the *entire* log's running score and multipliers, and re-sorts the log into correct chronological order, since fixing an early QSO's time, grid, or club can change which other QSO gets credit for being "first."
- **Delete** removes the QSO entirely after a confirmation, and also recalculates the whole log.

## If the app crashes or closes mid-contest

Every QSO is saved automatically as you log it. If you reopen the app before finishing, you'll be asked to **Resume** (picks up exactly where you left off, multipliers and all) or **Start Fresh**.

## Finishing and exporting

Tap **Finish Contest**, then choose:
- **Export CSV** — for pasting into the official log sheet format
- **Export Cabrillo** — asks for a few extra details (your callsign, full name, email, category) required by the Cabrillo standard, then produces a submission-ready `.log` file
- **Export CSV + Cabrillo** — both at once
- The CSV or .log Cabrillo file will be downloaded to your device's **Downloads** folder.

After exporting, the app resets to a clean state, ready for the next contest.

## Known limitations (v1)

- No contest-free segment is enforced on 20m (none is defined in the current SARL Club Contest rules) — only band-edge validation applies there.
- Not yet tested on iOS devices (no test hardware available) — should work per PWA standards, but install flow and file export haven't been verified firsthand.
- No settings/history screen yet — one contest at a time, exported and reset.
- UI is intentionally focused on the SARL Club Contests only; it is not a general-purpose contest logger (yet).

## Feedback

This is an early build looking for real-world testing feedback — if something behaves unexpectedly, doesn't match the official rules, or is just awkward to use, please raise it.
