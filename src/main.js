import './style.css';
import { createContestLog } from './contestLog.js';
import { VALID_CLUB_CODES } from './data/clubs.js';
import { VALID_GRID_SQUARES } from './data/grids.js';
import { isInContestFreeZone, isOutsideBand } from './bandPlan.js';
import { formatUtcDate, formatUtcTime } from './timestamp.js';
import { generateCsv } from './csvExport.js';
import { generateCabrillo } from './cabrilloExport.js';
import { generateAdif } from './adifExport.js';
import { saveSession, loadSession, clearSession } from './persistence.js';
import { registerSW } from 'virtual:pwa-register';
import { APP_VERSION } from './version.js';
import { isWithinContestWindow, suggestUtcCorrection } from './timestampWindow.js';
import { isValidCallsignFormat } from './callsignValidation.js';


const contestDef = {
  newGridBonus: 2,
  newClubBonus: 1,
  validClubs: VALID_CLUB_CODES,
  validGrids: VALID_GRID_SQUARES,
};

let log = null;
let runFreqMode = true;
let contestBand = '40m';
let pendingRowIndex = null;
let hasWarnedAboutTimeWindow = false;
let qsoDateTimeManuallyEdited = false;


document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1>SARL Club Contest Logger</h1>

    <dialog id="sessionCheckDialog">
      <p id="sessionCheckMsg"></p>
      <button id="resumeBtn" type="button">Resume</button>
      <button id="startFreshBtn" type="button">Start Fresh</button>
    </dialog>

    <dialog id="alertDialog">
      <p id="alertMsg"></p>
      <button id="alertOkBtn" type="button">OK</button>
    </dialog>

     <dialog id="updateDialog">
      <p>A new version of the logger is available.</p>
      <button id="updateNowBtn" type="button">Update Now</button>
      <button id="updateLaterBtn" type="button">Later</button>
    </dialog>

    <section id="setup">
      <h2>Operator Setup</h2>
      <label>Your Callsign <input id="opCallsign" type="text" /></label>
      <label>Your Name <input id="opName" type="text" /></label>
      <label>Your Grid <input id="opGrid" type="text" maxlength="4" /></label>
      <label>Your Club Code <input id="opClub" type="text" /></label>
      <label>Contest Band <select id="opBand">
        <option value="40m">40 m</option>
        <option value="80m">80 m</option>
        <option value="20m">20 m</option>
      </select></label>
      <label>Mode <select id="opMode">
        <option value="SSB">SSB</option>
        <option value="CW">CW</option>
        <option value="RTTY">RTTY</option>
      </select></label>
      <button id="startBtn">Start Contest</button>
    </section>

    <section id="logging" style="display:none">
      <h2>Log a QSO</h2>
      <p>Score: <strong id="scoreDisplay">0</strong></p>

      <div class="freqToggleRow">
        <button id="runFreqToggle" type="button" tabindex="-1">Run Freq: ON</button>
      </div>

            <div class="entryRow">
        <label>Callsign <input id="callsign" type="text" tabindex="1" /></label>
        <label>Frequency (kHz) <input id="frequency" type="text" tabindex="2" /></label>
        <label>Name Received <input id="nameReceived" type="text" tabindex="3" /></label>
        <label>Grid Received <input id="gridReceived" type="text" maxlength="4" tabindex="4" /></label>
        <label>Club Received <input id="clubReceived" type="text" tabindex="5" /></label>
        <label>Mode <select id="qsoMode" tabindex="6">
          <option value="SSB">SSB</option>
          <option value="CW">CW</option>
          <option value="RTTY">RTTY</option>
        </select></label>
        <label>Date (UTC) <input id="qsoDate" type="text" tabindex="8" /></label>
        <label>Time (UTC, HHmm) <input id="qsoTime" type="text" tabindex="9" /></label>
      </div>

      <div class="actionRow">
        <button id="addBtn" tabindex="7">Add QSO</button>
        <span style="display:inline-block; width:60px;"></span>
        <button id="clearBtn" type="button" tabindex="-1">Clear</button>
      </div>

      <dialog id="warningDialog">
        <p id="warningMsg"></p>
        <button id="logAnywayBtn" type="button">Log Anyway</button>
        <button id="editQsoBtn" type="button">Edit QSO</button>
      </dialog>

      <h3>Log</h3>
      <div class="tableWrapper">
      <table id="logTable">
        <thead><tr><th>Date</th><th>Time</th><th>Callsign</th><th>Freq</th><th>Mode</th><th>Grid</th><th>Multi</th><th>Club</th><th>Multi</th></tr></thead>
        <tbody></tbody>
      </table>
      </div>

      <button id="finishBtn" type="button" style="margin-top:20px;">Finish Contest</button>

        <dialog id="finishDialog">
        <p>Export your log (choose any combination):</p>
        <button id="exportCsvBtn" type="button">Export CSV</button>
        <button id="exportCabrilloBtn" type="button">Export Cabrillo</button>
        <button id="exportAdifBtn" type="button">Export ADIF</button>
        <br />
        <button id="finishDoneBtn" type="button">Done</button>
        <button id="finishCancelBtn" type="button">Back to Logging</button>
      </dialog>

      <dialog id="cabrilloDetailsDialog">
        <h3>Cabrillo Details</h3>
        <label>Your Callsign <input id="cabCallsign" type="text" /></label>
        <label>Full Name (Name Surname) <input id="cabName" type="text" /></label>
        <label>Email <input id="cabEmail" type="text" /></label>
        <label>Category Operator <select id="cabCategoryOperator">
          <option value="SINGLE-OP">SINGLE-OP</option>
          <option value="MULTI-OP">MULTI-OP</option>
        </select></label>
        <label>Category Power <select id="cabCategoryPower">
          <option value="LOW">LOW</option>
          <option value="HIGH">HIGH</option>
          <option value="QRP">QRP</option>
        </select></label>
        <button id="cabConfirmBtn" type="button">Generate Cabrillo</button>
        <button id="cabCancelBtn" type="button">Cancel</button>
      </dialog>

      <dialog id="rowActionDialog">
        <p id="rowActionMsg"></p>
        <button id="rowEditBtn" type="button">Edit</button>
        <button id="rowDeleteBtn" type="button">Delete</button>
        <button id="rowCancelBtn" type="button">Cancel</button>
      </dialog>

      <dialog id="editQsoDialog">
        <h3>Edit QSO</h3>
        <label>Callsign <input id="editCallsign" type="text" /></label>
        <label>Frequency (kHz) <input id="editFrequency" type="text" /></label>
        <label>Mode <select id="editMode">
          <option value="SSB">SSB</option>
          <option value="CW">CW</option>
          <option value="RTTY">RTTY</option>
        </select></label>
        <label>Name Received <input id="editNameReceived" type="text" /></label>
        <label>Grid Received <input id="editGridReceived" type="text" maxlength="4" /></label>
        <label>Club Received <input id="editClubReceived" type="text" /></label>
        <label>Date (UTC) <input id="editDate" type="text" /></label>
        <label>Time (UTC, HHmm) <input id="editTime" type="text" /></label>
        <button id="editSaveBtn" type="button">Save</button>
        <button id="editCancelBtn" type="button">Cancel</button>
        <p id="editErrorMsg" style="color:red"></p>
      </dialog>

      <dialog id="deleteConfirmDialog">
        <p id="deleteConfirmMsg"></p>
        <button id="deleteYesBtn" type="button">Yes, Delete</button>
        <button id="deleteCancelBtn" type="button">Cancel</button>
      </dialog>
    </section>
     <p class="versionFooter">ZS Contest Log v${APP_VERSION}</p>
  </div>
`;

// ---------- PWA update checking ----------
// Checked on load, and again every time the app regains focus (e.g. coming
// back from the app tray) — not just whenever the browser feels like it.

const updateSW = registerSW({
  onNeedRefresh() {
    document.querySelector('#updateDialog').showModal();
  },
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateSW(); // checking with no args just re-checks for updates, doesn't force one
  }
});

document.querySelector('#updateNowBtn').addEventListener('click', () => {
  updateSW(true); // true = actually apply the waiting update and reload
});

document.querySelector('#updateLaterBtn').addEventListener('click', () => {
  document.querySelector('#updateDialog').close();
});

// ---------- Generic alert dialog (replaces passive error text) ----------

function showAlert(msg) {
  document.querySelector('#alertMsg').textContent = msg;
  document.querySelector('#alertDialog').showModal();
}

document.querySelector('#alertOkBtn').addEventListener('click', () => {
  document.querySelector('#alertDialog').close();
});

document.querySelector('#qsoDate').addEventListener('input', () => {
  qsoDateTimeManuallyEdited = true;
});
document.querySelector('#qsoTime').addEventListener('input', () => {
  qsoDateTimeManuallyEdited = true;
});

// ---------- Session resume / start fresh ----------

function rebuildTableRow(qso, result, index) {
  const gridTick = result.isNewGrid ? '<span class="multiTick">✓</span>' : '';
  const clubTick = result.isNewClub ? '<span class="multiTick">✓</span>' : '';
  const tbody = document.querySelector('#logTable tbody');
  const row = document.createElement('tr');
  row.dataset.index = index;
  row.innerHTML = `<td>${qso.date}</td><td>${qso.time}</td><td>${qso.callsign}</td><td>${qso.frequency}</td><td>${qso.mode}</td><td>${qso.gridReceived}</td><td class="multiCell">${gridTick}</td><td>${qso.clubReceived}</td><td class="multiCell">${clubTick}</td>`;
  attachLongPress(row, index);
  tbody.appendChild(row);
}

function renderFullLog() {
  const tbody = document.querySelector('#logTable tbody');
  tbody.innerHTML = '';
  const results = log.getResults();
  results.forEach((r, i) => rebuildTableRow(r.qso, r, i));
  const total = results.length ? results[results.length - 1].runningScore : 0;
  document.querySelector('#scoreDisplay').textContent = total;
}

function attachLongPress(row, index) {
  let timer = null;
  const start = () => {
    timer = setTimeout(() => openRowActionMenu(index), 550);
  };
  const cancel = () => clearTimeout(timer);

  row.addEventListener('mousedown', start);
  row.addEventListener('mouseup', cancel);
  row.addEventListener('mouseleave', cancel);
  row.addEventListener('touchstart', start);
  row.addEventListener('touchend', cancel);
  row.addEventListener('touchmove', cancel);
}

function openRowActionMenu(index) {
  pendingRowIndex = index;
  const qso = log.getQsos()[index];
  document.querySelector('#rowActionMsg').textContent = `QSO with ${qso.callsign} (${qso.mode})`;
  document.querySelector('#rowActionDialog').showModal();
}

function enterLoggingScreen() {
  document.querySelector('#setup').style.display = 'none';
  document.querySelector('#logging').style.display = 'block';
  stampCurrentUtcTime();
}

const savedSession = loadSession();
if (savedSession && savedSession.qsos && savedSession.qsos.length > 0) {
  document.querySelector('#sessionCheckMsg').textContent =
    `Found an unfinished session: ${savedSession.qsos.length} QSOs, last logged ${savedSession.lastLoggedAt} UTC. Resume this session, or start fresh?`;
  document.querySelector('#setup').style.display = 'none';
  document.querySelector('#sessionCheckDialog').showModal();
}

document.querySelector('#resumeBtn').addEventListener('click', () => {
  document.querySelector('#sessionCheckDialog').close();
  contestBand = savedSession.contestBand;
  log = createContestLog(savedSession.operatorProfile, contestDef);

  for (const qso of savedSession.qsos) {
    log.addQso(qso);
  }
  renderFullLog();
  enterLoggingScreen();
});

document.querySelector('#startFreshBtn').addEventListener('click', () => {
  clearSession();
  document.querySelector('#sessionCheckDialog').close();
  document.querySelector('#setup').style.display = 'block';
});

// ---------- Contest start ----------

document.querySelector('#startBtn').addEventListener('click', () => {
  const operatorProfile = {
    callsign: document.querySelector('#opCallsign').value.trim().toUpperCase(),
    name: document.querySelector('#opName').value.trim(),
    gridSent: document.querySelector('#opGrid').value.trim().toUpperCase(),
    clubSent: document.querySelector('#opClub').value.trim().toUpperCase(),
  };

    const missing = [];
  if (!operatorProfile.callsign) missing.push('Your Callsign');
  if (!operatorProfile.name) missing.push('Your Name');
  if (!operatorProfile.gridSent) missing.push('Your Grid');
  if (!operatorProfile.clubSent) missing.push('Your Club Code (enter NONE if you have no club)');

  if (missing.length > 0) {
    showAlert(`Please fill in: ${missing.join(', ')}`);
    return;
  }

  if (!isValidCallsignFormat(operatorProfile.callsign)) {
    showAlert(`"${operatorProfile.callsign}" doesn't look like a valid callsign — it needs to contain a number.`);
    return;
  }

  contestBand = document.querySelector('#opBand').value;
  log = createContestLog(operatorProfile, contestDef);
  document.querySelector('#qsoMode').value = document.querySelector('#opMode').value;

  enterLoggingScreen();
});

document.querySelector('#runFreqToggle').addEventListener('click', () => {
  runFreqMode = !runFreqMode;
  document.querySelector('#runFreqToggle').textContent = `Run Freq: ${runFreqMode ? 'ON' : 'OFF'}`;
  if (!runFreqMode) {
    document.querySelector('#frequency').value = '';
  }
});

// ---------- QSO entry ----------

function getQsoFromForm() {
  return {
    date: document.querySelector('#qsoDate').value.trim(),
    time: document.querySelector('#qsoTime').value.trim(),
    callsign: document.querySelector('#callsign').value.trim().toUpperCase(),
    frequency: document.querySelector('#frequency').value.trim(),
    mode: document.querySelector('#qsoMode').value,
    nameReceived: document.querySelector('#nameReceived').value.trim(),
    gridReceived: document.querySelector('#gridReceived').value.trim().toUpperCase(),
    clubReceived: document.querySelector('#clubReceived').value.trim().toUpperCase(),
  };
}

function clearEntryFields() {
  document.querySelector('#callsign').value = '';
  document.querySelector('#nameReceived').value = '';
  document.querySelector('#gridReceived').value = '';
  document.querySelector('#clubReceived').value = '';
  if (!runFreqMode) {
    document.querySelector('#frequency').value = '';
  }
  stampCurrentUtcTime();
}

function stampCurrentUtcTime() {
  const now = new Date();
  document.querySelector('#qsoDate').value = formatUtcDate(now);
  document.querySelector('#qsoTime').value = formatUtcTime(now);
  qsoDateTimeManuallyEdited = false;
}

function persistCurrentSession() {
  saveSession({
    operatorProfile: log.operatorProfile,
    contestBand,
    qsos: log.getQsos(),
    lastLoggedAt: `${formatUtcDate(new Date())} ${formatUtcTime(new Date())}`,
  });
}

function commitQso(qso) {
  const result = log.addQso(qso);

  if (!result.success) {
    showAlert(`Duplicate: ${qso.callsign} already worked on ${qso.mode}.`);
    return;
  }

  renderFullLog();
  persistCurrentSession();

  clearEntryFields();
  document.querySelector('#callsign').focus();
}

document.querySelector('#addBtn').addEventListener('click', () => {
  const qso = getQsoFromForm();

  if (!qso.callsign) {
    showAlert('Callsign is required.');
    return;
  }

  if (!isValidCallsignFormat(qso.callsign)) {
    showAlert(`"${qso.callsign}" doesn't look like a valid callsign — it needs to contain a number.`);
    return;
  }

  if (qsoDateTimeManuallyEdited && !hasWarnedAboutTimeWindow) {
    if (!isWithinContestWindow(contestBand, qso.time)) {
      const suggestion = suggestUtcCorrection(contestBand, qso.time);
      const suggestionText = suggestion
        ? ` This looks like it might be SAST rather than UTC — did you mean ${suggestion} UTC?`
        : '';
      showAlert(`${qso.time} is outside this contest's usual UTC time window.${suggestionText} Double-check your entry — this is just a heads-up, the QSO will still log.`);
      hasWarnedAboutTimeWindow = true;
    }
  }

  if (isInContestFreeZone(contestBand, qso.frequency)) {
    showAlert(`${qso.frequency} kHz is inside the ${contestBand} contest-free segment — no QSOs may be logged there.`);
    return;
  }

  if (isOutsideBand(contestBand, qso.frequency)) {
    showAlert(`${qso.frequency} kHz is outside the ${contestBand} band — check your frequency entry.`);
    return;
  }

  const issues = [];
  if (!qso.frequency) issues.push('Frequency is blank');
  if (!qso.nameReceived) issues.push('Name Received is blank');

  if (!qso.gridReceived) {
    issues.push('Grid Received is blank');
  } else if (!VALID_GRID_SQUARES.has(qso.gridReceived)) {
    issues.push(`Grid "${qso.gridReceived}" is not a recognized grid square`);
  }

  if (!qso.clubReceived) {
    issues.push('Club Received is blank');
  } else if (qso.clubReceived !== 'NONE' && !VALID_CLUB_CODES.has(qso.clubReceived)) {
    issues.push(`Club "${qso.clubReceived}" is not on the official club list`);
  }

  if (issues.length > 0) {
    document.querySelector('#warningMsg').textContent =
      `Check this QSO: ${issues.join('; ')}. Log anyway, or go back and edit?`;
    document.querySelector('#warningDialog').showModal();
    return;
  }

  commitQso(qso);
});

document.querySelector('#logAnywayBtn').addEventListener('click', () => {
  document.querySelector('#warningDialog').close();
  commitQso(getQsoFromForm());
});

document.querySelector('#editQsoBtn').addEventListener('click', () => {
  document.querySelector('#warningDialog').close();
});

document.querySelector('#clearBtn').addEventListener('click', () => {
  clearEntryFields();
  document.querySelector('#callsign').focus();
});

// Enter key anywhere in the entry row triggers Add QSO, same as clicking it.
document.querySelector('.entryRow').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.querySelector('#addBtn').click();
  }
});

// ---------- Row actions: edit / delete ----------

document.querySelector('#rowCancelBtn').addEventListener('click', () => {
  document.querySelector('#rowActionDialog').close();
  pendingRowIndex = null;
});

document.querySelector('#rowEditBtn').addEventListener('click', () => {
  document.querySelector('#rowActionDialog').close();
  const qso = log.getQsos()[pendingRowIndex];

  document.querySelector('#editCallsign').value = qso.callsign;
  document.querySelector('#editFrequency').value = qso.frequency;
  document.querySelector('#editMode').value = qso.mode;
  document.querySelector('#editNameReceived').value = qso.nameReceived;
  document.querySelector('#editGridReceived').value = qso.gridReceived;
  document.querySelector('#editClubReceived').value = qso.clubReceived;
  document.querySelector('#editErrorMsg').textContent = '';

  document.querySelector('#editQsoDialog').showModal();
});

document.querySelector('#editCancelBtn').addEventListener('click', () => {
  document.querySelector('#editQsoDialog').close();
  pendingRowIndex = null;
});

document.querySelector('#editSaveBtn').addEventListener('click', () => {
  const original = log.getQsos()[pendingRowIndex];
  const updatedQso = {
    ...original,
    callsign: document.querySelector('#editCallsign').value.trim().toUpperCase(),
    frequency: document.querySelector('#editFrequency').value.trim(),
    mode: document.querySelector('#editMode').value,
    nameReceived: document.querySelector('#editNameReceived').value.trim(),
    gridReceived: document.querySelector('#editGridReceived').value.trim().toUpperCase(),
    clubReceived: document.querySelector('#editClubReceived').value.trim().toUpperCase(),
    date: document.querySelector('#editDate').value.trim(),
    time: document.querySelector('#editTime').value.trim(),
  };

  if (!isValidCallsignFormat(updatedQso.callsign)) {
    document.querySelector('#editErrorMsg').textContent =
      `"${updatedQso.callsign}" doesn't look like a valid callsign — it needs to contain a number.`;
    return;
  }

  const result = log.updateQso(pendingRowIndex, updatedQso);

  if (!result.success) {
    document.querySelector('#editErrorMsg').textContent =
      result.reason === 'duplicate'
        ? `That would duplicate another QSO with ${updatedQso.callsign} on ${updatedQso.mode}.`
        : 'Could not save this edit.';
    return;
  }

  document.querySelector('#editQsoDialog').close();
  pendingRowIndex = null;
  renderFullLog();
  persistCurrentSession();

  if (!isWithinContestWindow(contestBand, updatedQso.time) && !hasWarnedAboutTimeWindow) {
    const suggestion = suggestUtcCorrection(contestBand, updatedQso.time);
    const suggestionText = suggestion
      ? ` This looks like it might be SAST rather than UTC — did you mean ${suggestion} UTC?`
      : '';
    showAlert(`${updatedQso.time} is outside this contest's usual UTC time window.${suggestionText} Double-check your entry.`);
    hasWarnedAboutTimeWindow = true;
  }
});

// ---------- Finish contest ----------

document.querySelector('#finishBtn').addEventListener('click', () => {
  document.querySelector('#finishDialog').showModal();
});

document.querySelector('#finishCancelBtn').addEventListener('click', () => {
  document.querySelector('#finishDialog').close();
});

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function buildExportFilename(extension, formatTag) {
  const now = new Date();
  const datePart = formatUtcDate(now);
  const timePart = formatUtcTime(now);
  return `SARL_ClubContest_${contestBand}_${datePart}_${timePart}_${formatTag}.${extension}`;
}

function finishAndReset() {
  clearSession();
  window.location.reload();
}

document.querySelector('#exportCsvBtn').addEventListener('click', () => {
  const csv = generateCsv(log.operatorProfile, log.getQsos());
  downloadFile(csv, buildExportFilename('csv', 'CSV'), 'text/csv');
});

document.querySelector('#exportAdifBtn').addEventListener('click', () => {
  const adif = generateAdif(log.operatorProfile, contestBand, log.getQsos());
  downloadFile(adif, buildExportFilename('adi', 'ADI'), 'text/plain');
});

document.querySelector('#exportCabrilloBtn').addEventListener('click', () => {
  document.querySelector('#cabCallsign').value = log.operatorProfile.callsign;
  document.querySelector('#cabrilloDetailsDialog').showModal();
});

document.querySelector('#cabCancelBtn').addEventListener('click', () => {
  document.querySelector('#cabrilloDetailsDialog').close();
});

document.querySelector('#cabConfirmBtn').addEventListener('click', () => {
  const header = {
    callsign: document.querySelector('#cabCallsign').value.trim().toUpperCase(),
    name: document.querySelector('#cabName').value.trim(),
    email: document.querySelector('#cabEmail').value.trim(),
    categoryOperator: document.querySelector('#cabCategoryOperator').value,
    categoryPower: document.querySelector('#cabCategoryPower').value,
  };

  const cabrillo = generateCabrillo(header, log.operatorProfile, contestBand, log.getQsos());
  downloadFile(cabrillo, buildExportFilename('log', 'CAB'), 'text/plain');

  document.querySelector('#cabrilloDetailsDialog').close();
});

document.querySelector('#finishDoneBtn').addEventListener('click', () => {
  document.querySelector('#finishDialog').close();
  finishAndReset();
});