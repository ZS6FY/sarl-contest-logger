import './style.css';
import { createContestLog } from './contestLog.js';
import { VALID_CLUB_CODES } from './data/clubs.js';
import { VALID_GRID_SQUARES } from './data/grids.js';
import { formatUtcDate, formatUtcTime } from './timestamp.js';
import { generateCsv } from './csvExport.js';
import { generateCabrillo } from './cabrilloExport.js';
import { saveSession, loadSession, clearSession } from './persistence.js';
import { isInContestFreeZone, isOutsideBand } from './bandPlan.js';

const contestDef = {
  newGridBonus: 2,
  newClubBonus: 1,
  validClubs: VALID_CLUB_CODES,
};

let log = null;
let runFreqMode = true;
let contestBand = '40m';
let pendingExportMode = null; // 'cabrillo' or 'both'

document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1>SARL Club Contest Logger</h1>

    <section id="sessionCheck" style="display:none; border:1px solid orange; padding:10px; max-width:500px;">
      <p id="sessionCheckMsg"></p>
      <button id="resumeBtn" type="button">Resume</button>
      <button id="startFreshBtn" type="button">Start Fresh</button>
    </section>

    <section id="setup">
      <h2>Operator Setup</h2>
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

      <div class="freqToggleRow" style="margin-bottom:10px;">
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
      </div>

      <div class="actionRow" style="margin-top:10px;">
        <button id="addBtn" tabindex="7">Add QSO</button>
        <span style="display:inline-block; width:60px;"></span>
        <button id="clearBtn" type="button" tabindex="-1">Clear</button>
      </div>

      <p id="errorMsg" style="color:red"></p>

      <div id="warningBox" style="display:none; border:1px solid orange; padding:8px; margin:8px 0; max-width:400px;">
        <p id="warningMsg"></p>
        <button id="logAnywayBtn" type="button">Log Anyway</button>
        <button id="editQsoBtn" type="button">Edit QSO</button>
      </div>

      <h3>Log</h3>
      <div class="tableWrapper">
      <table id="logTable">
        <thead><tr><th>Date</th><th>Time</th><th>Callsign</th><th>Freq</th><th>Mode</th><th>Grid</th><th>Grid Multi</th><th>Club</th><th>Club Multi</th><th>Running Score</th></tr></thead>
        <tbody></tbody>
      </table>
      </div>

      <button id="finishBtn" type="button" style="margin-top:20px;">Finish Contest</button>

      <div id="finishBox" style="display:none; border:1px solid green; padding:10px; margin:8px 0; max-width:400px;">
        <p>Export your log:</p>
        <button id="exportCsvOnlyBtn" type="button">Export CSV</button>
        <button id="exportCabrilloOnlyBtn" type="button">Export Cabrillo</button>
        <button id="exportBothBtn" type="button">Export CSV + Cabrillo</button>
      </div>

      <div id="cabrilloDetailsBox" style="display:none; border:1px solid green; padding:10px; margin:8px 0; max-width:400px;">
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
      </div>
    </section>
  </div>
`;

// ---------- Session resume / start fresh ----------

function rebuildTableRow(qso, result) {
  const gridTick = result.isNewGrid ? '✓' : '';
  const clubTick = result.isNewClub ? '✓' : '';
  const tbody = document.querySelector('#logTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `<td>${qso.date}</td><td>${qso.time}</td><td>${qso.callsign}</td><td>${qso.frequency}</td><td>${qso.mode}</td><td>${qso.gridReceived}</td><td>${gridTick}</td><td>${qso.clubReceived}</td><td>${clubTick}</td><td>${result.runningScore}</td>`;
  tbody.appendChild(row);
}

function enterLoggingScreen() {
  document.querySelector('#sessionCheck').style.display = 'none';
  document.querySelector('#setup').style.display = 'none';
  document.querySelector('#logging').style.display = 'block';
}

const savedSession = loadSession();
if (savedSession && savedSession.qsos && savedSession.qsos.length > 0) {
  document.querySelector('#sessionCheckMsg').textContent =
    `Found an unfinished session: ${savedSession.qsos.length} QSOs, last logged ${savedSession.lastLoggedAt} UTC. Resume this session, or start fresh?`;
  document.querySelector('#sessionCheck').style.display = 'block';
  document.querySelector('#setup').style.display = 'none';
}

document.querySelector('#resumeBtn').addEventListener('click', () => {
  contestBand = savedSession.contestBand;
  log = createContestLog(savedSession.operatorProfile, contestDef);

  for (const qso of savedSession.qsos) {
    const result = log.addQso(qso);
    if (result.success) {
      rebuildTableRow(qso, result);
      document.querySelector('#scoreDisplay').textContent = result.runningScore;
    }
  }

  enterLoggingScreen();
});

document.querySelector('#startFreshBtn').addEventListener('click', () => {
  clearSession();
  document.querySelector('#sessionCheck').style.display = 'none';
  document.querySelector('#setup').style.display = 'block';
});

// ---------- Contest start ----------

document.querySelector('#startBtn').addEventListener('click', () => {
  contestBand = document.querySelector('#opBand').value;
  const operatorProfile = {
    name: document.querySelector('#opName').value.trim(),
    gridSent: document.querySelector('#opGrid').value.trim().toUpperCase(),
    clubSent: document.querySelector('#opClub').value.trim().toUpperCase(),
  };

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
  const now = new Date();
  return {
    date: formatUtcDate(now),
    time: formatUtcTime(now),
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
  const errorMsg = document.querySelector('#errorMsg');
  const result = log.addQso(qso);

  if (!result.success) {
    errorMsg.textContent = `Duplicate: ${qso.callsign} already worked on ${qso.mode}.`;
    return;
  }

  errorMsg.textContent = '';
  document.querySelector('#scoreDisplay').textContent = result.runningScore;
  rebuildTableRow(qso, result);
  persistCurrentSession();

  clearEntryFields();
  document.querySelector('#callsign').focus();
}

document.querySelector('#addBtn').addEventListener('click', () => {
  const qso = getQsoFromForm();
  const errorMsg = document.querySelector('#errorMsg');

  if (!qso.callsign) {
    errorMsg.textContent = 'Callsign is required.';
    return;
  }

  if (isInContestFreeZone(contestBand, qso.frequency)) {
    errorMsg.textContent = `${qso.frequency} kHz is inside the ${contestBand} contest-free segment — no QSOs may be logged there.`;
    return;
  }

  if (isOutsideBand(contestBand, qso.frequency)) {
    errorMsg.textContent = `${qso.frequency} kHz is outside the ${contestBand} band — check your frequency entry.`;
    return;
  }
  errorMsg.textContent = '';

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
    document.querySelector('#warningBox').style.display = 'block';
    return;
  }

  commitQso(qso);
});
  
document.querySelector('#logAnywayBtn').addEventListener('click', () => {
  document.querySelector('#warningBox').style.display = 'none';
  commitQso(getQsoFromForm());
});

document.querySelector('#editQsoBtn').addEventListener('click', () => {
  document.querySelector('#warningBox').style.display = 'none';
});

document.querySelector('#clearBtn').addEventListener('click', () => {
  clearEntryFields();
  document.querySelector('#errorMsg').textContent = '';
  document.querySelector('#warningBox').style.display = 'none';
  document.querySelector('#callsign').focus();
});

// Enter key anywhere in the entry row triggers Add QSO, same as clicking it.
document.querySelector('.entryRow').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.querySelector('#addBtn').click();
  }
});

// ---------- Finish contest ----------

document.querySelector('#finishBtn').addEventListener('click', () => {
  document.querySelector('#finishBox').style.display = 'block';
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

function finishAndReset() {
  clearSession();
  window.location.reload();
}

document.querySelector('#exportCsvOnlyBtn').addEventListener('click', () => {
  const csv = generateCsv(log.operatorProfile, log.getQsos());
  downloadFile(csv, `sarl-club-contest-log-${formatUtcDate(new Date())}.csv`, 'text/csv');
  setTimeout(finishAndReset, 800);
});

document.querySelector('#exportCabrilloOnlyBtn').addEventListener('click', () => {
  pendingExportMode = 'cabrillo';
  document.querySelector('#cabrilloDetailsBox').style.display = 'block';
});

document.querySelector('#exportBothBtn').addEventListener('click', () => {
  pendingExportMode = 'both';
  document.querySelector('#cabrilloDetailsBox').style.display = 'block';
});

document.querySelector('#cabConfirmBtn').addEventListener('click', () => {
  const header = {
    callsign: document.querySelector('#cabCallsign').value.trim().toUpperCase(),
    name: document.querySelector('#cabName').value.trim(),
    email: document.querySelector('#cabEmail').value.trim(),
    categoryOperator: document.querySelector('#cabCategoryOperator').value,
    categoryPower: document.querySelector('#cabCategoryPower').value,
  };

  if (pendingExportMode === 'both') {
    const csv = generateCsv(log.operatorProfile, log.getQsos());
    downloadFile(csv, `sarl-club-contest-log-${formatUtcDate(new Date())}.csv`, 'text/csv');
  }

  const cabrillo = generateCabrillo(header, log.operatorProfile, contestBand, log.getQsos());
  downloadFile(cabrillo, `sarl-club-contest-log-${formatUtcDate(new Date())}.log`, 'text/plain');

  setTimeout(finishAndReset, 800);
});