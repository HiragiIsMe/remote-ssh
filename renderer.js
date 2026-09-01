// --- SSH Command Studio (Stateful SSH Session & Single Dedicated Target) ---

let buttonsList = [];
let targetProfile = null;

let searchQuery = '';
let executionCount = 0;
let currentSshStatus = 'disconnected';
let terminalBuffer = '';

// DOM Elements
const connectionStatusPill = document.getElementById('connection-status-pill');
const connectionStatusText = document.getElementById('connection-status-text');
const targetHostDisplay = document.getElementById('target-host-display');
const btnHeaderConnect = document.getElementById('btn-header-connect');
const btnHeaderDisconnect = document.getElementById('btn-header-disconnect');

const buttonsGrid = document.getElementById('buttons-grid');
const emptyState = document.getElementById('empty-state');
const visibleCountBadge = document.getElementById('visible-buttons-count');
const searchInput = document.getElementById('search-input');

// Terminal Elements
const terminalPanel = document.getElementById('terminal-panel');
const terminalBody = document.getElementById('terminal-body');
const terminalStatusDot = document.getElementById('terminal-status-dot');
const terminalTitleText = document.getElementById('terminal-title-text');
const termCopyBtn = document.getElementById('term-copy-btn');
const termClearBtn = document.getElementById('term-clear-btn');
const termToggleSizeBtn = document.getElementById('term-toggle-size');

// CLI Elements
const cliBar = document.getElementById('cli-bar');
const cliInput = document.getElementById('cli-input');
const cliActiveHost = document.getElementById('cli-active-host');
const btnToggleCli = document.getElementById('btn-toggle-cli');

// Modals & Forms
const modalButtonForm = document.getElementById('modal-button-form');
const modalButtonTitle = document.getElementById('modal-button-title');
const formButton = document.getElementById('form-button');

const modalProfiles = document.getElementById('modal-profiles');
const btnOpenProfiles = document.getElementById('btn-open-profiles');
const btnNewButton = document.getElementById('btn-create-button');
const formTargetProfile = document.getElementById('form-target-profile');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupSshStatusListeners();
  setupEventListeners();
  setupTerminalListener();
  feather.replace();
});

// Load Buttons & Target SSH Profile
async function loadData() {
  try {
    buttonsList = await window.api.getButtons();
    targetProfile = await window.api.getTargetProfile();

    renderTargetProfileUI();
    renderButtonsGrid();
    updateStats();

    const initStatus = await window.api.getConnectionStatus();
    updateSshStatusUI(initStatus);
  } catch (err) {
    appendLine('error', `Gagal memuat data: ${err.message}`);
  }
}

function renderTargetProfileUI() {
  if (targetProfile && targetProfile.host) {
    targetHostDisplay.textContent = `${targetProfile.username}@${targetProfile.host}:${targetProfile.port || 22}`;
    cliActiveHost.textContent = targetProfile.host;
    populateProfileForm(targetProfile);
  } else {
    targetHostDisplay.textContent = 'Belum Dikonfigurasi';
    cliActiveHost.textContent = 'remote';
  }
}

// SSH Connection Status UI Update
function updateSshStatusUI(statusInfo) {
  currentSshStatus = statusInfo.status;
  if (statusInfo.profile) targetProfile = statusInfo.profile;

  connectionStatusPill.className = `connection-status-pill ${currentSshStatus}`;

  if (currentSshStatus === 'connected') {
    const hostLabel = targetProfile ? `${targetProfile.username}@${targetProfile.host}` : 'Connected';
    connectionStatusText.textContent = `Connected (${hostLabel})`;
    btnHeaderConnect.classList.add('hidden');
    btnHeaderDisconnect.classList.remove('hidden');
    terminalStatusDot.className = 'status-indicator success';
    terminalTitleText.textContent = `SSH Console: ${hostLabel}`;
  } else if (currentSshStatus === 'connecting') {
    connectionStatusText.textContent = 'Connecting...';
    btnHeaderConnect.classList.add('hidden');
    btnHeaderDisconnect.classList.remove('hidden');
    terminalStatusDot.className = 'status-indicator running';
    terminalTitleText.textContent = 'Connecting to SSH Host...';
  } else if (currentSshStatus === 'error') {
    connectionStatusText.textContent = 'Connection Failed';
    btnHeaderConnect.classList.remove('hidden');
    btnHeaderDisconnect.classList.add('hidden');
    terminalStatusDot.className = 'status-indicator error';
    if (statusInfo.error) {
      appendLine('error', `[SSH ERROR] ${statusInfo.error}`);
    }
  } else {
    connectionStatusText.textContent = 'Disconnected';
    btnHeaderConnect.classList.remove('hidden');
    btnHeaderDisconnect.classList.add('hidden');
    terminalStatusDot.className = 'status-indicator idle';
    terminalTitleText.textContent = 'SSH Console Output (Offline)';
  }
}

function setupSshStatusListeners() {
  window.api.onSshStatusChange((statusInfo) => {
    updateSshStatusUI(statusInfo);
    if (statusInfo.message) {
      appendLine('status', statusInfo.message);
    }
  });
}

// Render Buttons Grid Dashboard
function renderButtonsGrid() {
  const filtered = buttonsList.filter(b => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchCmd = b.command.toLowerCase().includes(q);
      const matchDesc = (b.description || '').toLowerCase().includes(q);
      return matchName || matchCmd || matchDesc;
    }
    return true;
  });

  visibleCountBadge.textContent = `${filtered.length} items`;

  if (filtered.length === 0) {
    buttonsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  buttonsGrid.innerHTML = filtered.map(b => {
    const colorClass = `color-${b.color || 'cyan'}`;
    const iconName = b.icon || 'terminal';

    return `
      <div class="cmd-card ${colorClass}" data-id="${b.id}">
        <div class="card-top">
          <div class="card-icon-box">
            <i data-feather="${iconName}"></i>
          </div>
        </div>

        <div class="card-info">
          <h3 class="card-title">${escapeHtml(b.name)}</h3>
          <p class="card-desc">${escapeHtml(b.description || 'Tidak ada deskripsi.')}</p>
        </div>

        <div class="card-command-box" title="${escapeHtml(b.command)}">
          <code>$ ${escapeHtml(b.command)}</code>
        </div>

        <div class="card-actions">
          <button class="btn btn-exec btn-run-cmd" data-id="${b.id}">
            <i data-feather="play"></i> Run
          </button>
          <button class="btn btn-icon-only btn-edit-cmd" data-id="${b.id}" title="Edit Button">
            <i data-feather="edit-2"></i>
          </button>
          <button class="btn btn-icon-only btn-delete-cmd" data-id="${b.id}" title="Delete Button">
            <i data-feather="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  feather.replace();

  buttonsGrid.querySelectorAll('.btn-run-cmd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      runSshButtonCommand(btn.dataset.id);
    });
  });

  buttonsGrid.querySelectorAll('.btn-edit-cmd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditButtonModal(btn.dataset.id);
    });
  });

  buttonsGrid.querySelectorAll('.btn-delete-cmd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteButtonCommand(btn.dataset.id);
    });
  });
}

// Execute Command directly to active SSH Stream
async function runSshButtonCommand(buttonId) {
  const btnObj = buttonsList.find(b => b.id === buttonId);
  if (!btnObj) return;

  if (currentSshStatus !== 'connected') {
    appendLine('error', `⚠️ SSH Belum Terhubung! Menghubungkan ke server target...`);
    if (targetProfile && targetProfile.host) {
      try {
        await window.api.connectSsh();
      } catch (err) {
        return;
      }
    } else {
      alert('Silakan konfigurasi Pengaturan SSH Target Server terlebih dahulu.');
      modalProfiles.classList.remove('hidden');
      return;
    }
  }

  executionCount++;
  updateStats();

  appendLine('status', `--- Executing Button: "${btnObj.name}" ($ ${btnObj.command}) ---`);

  window.api.executeSshCommand({
    command: btnObj.command
  });
}

function executeCustomSshString(cmdString) {
  if (currentSshStatus !== 'connected') {
    appendLine('error', `⚠️ SSH Belum Terhubung! Klik "Connect" terlebih dahulu.`);
    return;
  }

  executionCount++;
  updateStats();

  window.api.executeSshCommand({
    command: cmdString
  });
}

// Line-buffered Stream Data Listener & Cleaner
function setupTerminalListener() {
  window.api.onSshCommandOutput((res) => {
    if (res.type === 'stdout' || res.type === 'stderr') {
      processStreamData(res.type, res.data);
    } else if (res.type === 'status' || res.type === 'error') {
      appendLine(res.type, res.data);
    }
  });
}

function processStreamData(type, rawData) {
  terminalBuffer += rawData;

  const lines = terminalBuffer.split('\n');
  // Keep the last incomplete fragment in terminalBuffer
  terminalBuffer = lines.pop() || '';

  for (let rawLine of lines) {
    const cleanLine = cleanTerminalLine(rawLine);
    if (cleanLine !== null) {
      appendLine(type, cleanLine);
    }
  }
}

function cleanTerminalLine(line) {
  let cleaned = stripAnsiCodes(line);
  
  // Strip trailing ConHost cursor erase artifacts (e.g. 65X, 61X, 58X, X, 56C)
  cleaned = cleaned.replace(/\s*\d*X\b/gi, '');
  cleaned = cleaned.replace(/\s*X$/gi, '');
  cleaned = cleaned.replace(/\d{1,3}[XKC]$/gi, '');
  cleaned = cleaned.trimEnd();

  // Filter redundant empty PTY prompts (e.g. '>>', '>> ')
  if (cleaned === '>>' || cleaned === '>> ') return null;

  return cleaned;
}

function stripAnsiCodes(str) {
  if (!str) return '';
  return str
    .replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, '') // Completely match and strip ANSI ESC [ sequences (e.g. \x1b[65X)
    .replace(/[\u001b\u009b]\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    .replace(/\x1B\][0-9];[^\x07]*\x07/g, '')
    .replace(/\r/g, '');
}

function appendLine(type, text) {
  if (text === null || text === undefined) return;

  const divEl = document.createElement('div');
  divEl.className = `log-line log-${type}`;
  divEl.textContent = text;

  terminalBody.appendChild(divEl);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function setupEventListeners() {
  // Header Connect & Disconnect
  btnHeaderConnect.addEventListener('click', async () => {
    if (!targetProfile || !targetProfile.host) {
      alert('Silakan atur Pengaturan Target SSH Server terlebih dahulu.');
      modalProfiles.classList.remove('hidden');
      return;
    }
    try {
      await window.api.connectSsh();
    } catch (err) {
      console.error(err);
    }
  });

  btnHeaderDisconnect.addEventListener('click', async () => {
    await window.api.disconnectSsh();
  });

  // Search Input Listener
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderButtonsGrid();
  });

  // Toggle CLI Input Bar
  btnToggleCli.addEventListener('click', () => {
    cliBar.classList.toggle('hidden');
    if (!cliBar.classList.contains('hidden')) {
      cliInput.focus();
    }
  });

  // CLI Input Submit
  cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = cliInput.value.trim();
      if (!val) return;

      cliInput.value = '';
      parseCliInput(val);
    } else if (e.key === 'Escape') {
      cliBar.classList.add('hidden');
    }
  });

  // Global Key Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== cliInput && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      cliBar.classList.remove('hidden');
      cliInput.focus();
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      cliBar.classList.add('hidden');
    }
  });

  // Terminal Controls
  termClearBtn.addEventListener('click', () => {
    terminalBuffer = '';
    terminalBody.innerHTML = '<div class="log-line log-system">=== Terminal Output Cleared ===</div>';
  });

  termCopyBtn.addEventListener('click', () => {
    const text = terminalBody.innerText;
    navigator.clipboard.writeText(text);
    appendLine('system', 'Output terminal berhasil di-copy ke clipboard!');
  });

  termToggleSizeBtn.addEventListener('click', () => {
    terminalPanel.classList.toggle('expanded');
    const icon = terminalPanel.classList.contains('expanded') ? 'minimize-2' : 'maximize-2';
    termToggleSizeBtn.innerHTML = `<i data-feather="${icon}"></i>`;
    feather.replace();
  });

  // Modal Open Buttons
  btnNewButton.addEventListener('click', () => {
    openCreateButtonModal();
  });

  btnOpenProfiles.addEventListener('click', () => {
    if (targetProfile) populateProfileForm(targetProfile);
    modalProfiles.classList.remove('hidden');
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.close;
      document.getElementById(targetId).classList.add('hidden');
    });
  });

  // Save Button Form
  formButton.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveButton();
  });

  // Save Single Target SSH Profile Form
  formTargetProfile.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveTargetProfile();
  });
}

function parseCliInput(rawCmd) {
  if (rawCmd.startsWith('/add')) {
    try {
      const nameMatch = rawCmd.match(/"([^"]+)"/);
      const name = nameMatch ? nameMatch[1] : 'CLI SSH Button';
      
      const cmdMatch = rawCmd.match(/--cmd\s+"([^"]+)"/) || rawCmd.match(/--cmd\s+([^\s]+)/);
      const command = cmdMatch ? cmdMatch[1] : 'uptime';

      const newBtn = {
        name,
        command,
        color: 'cyan',
        icon: 'terminal',
        description: `SSH shortcut dibuat via CLI prompt (${new Date().toLocaleTimeString()})`
      };

      window.api.saveButton(newBtn).then(updatedBtns => {
        buttonsList = updatedBtns;
        renderButtonsGrid();
        updateStats();
        appendLine('status', `[CLI SUCCESS] Berhasil membuat SSH Action Button: "${name}"`);
      });
    } catch (err) {
      appendLine('error', `[CLI ERROR] Format /add error. Contoh: /add "Status Nginx" --cmd "systemctl status nginx"`);
    }

  } else if (rawCmd === '/clear') {
    terminalBuffer = '';
    terminalBody.innerHTML = '<div class="log-line log-system">=== Console Cleared ===</div>';

  } else if (rawCmd === '/help') {
    appendLine('system', `=== HELP SSH CLI COMMANDS ===`);
    appendLine('system', `1. /add "Nama Button" --cmd "perintah_ssh"`);
    appendLine('system', `2. /clear (Bersihkan konsol)`);
    appendLine('system', `3. Ketik perintah SSH langsung (misal: cd RB, dir, uptime)`);

  } else {
    executeCustomSshString(rawCmd);
  }
}

function openCreateButtonModal() {
  modalButtonTitle.innerHTML = `<i data-feather="plus-circle"></i> Buat Custom SSH Button`;
  formButton.reset();
  document.getElementById('btn-field-id').value = '';
  modalButtonForm.classList.remove('hidden');
  feather.replace();
}

function openEditButtonModal(buttonId) {
  const btnObj = buttonsList.find(b => b.id === buttonId);
  if (!btnObj) return;

  modalButtonTitle.innerHTML = `<i data-feather="edit"></i> Edit SSH Button`;
  document.getElementById('btn-field-id').value = btnObj.id;
  document.getElementById('btn-field-name').value = btnObj.name;
  document.getElementById('btn-field-command').value = btnObj.command;
  document.getElementById('btn-field-color').value = btnObj.color || 'cyan';
  document.getElementById('btn-field-icon').value = btnObj.icon || 'terminal';
  document.getElementById('btn-field-description').value = btnObj.description || '';

  modalButtonForm.classList.remove('hidden');
  feather.replace();
}

async function handleSaveButton() {
  const buttonData = {
    id: document.getElementById('btn-field-id').value || undefined,
    name: document.getElementById('btn-field-name').value.trim(),
    command: document.getElementById('btn-field-command').value.trim(),
    color: document.getElementById('btn-field-color').value,
    icon: document.getElementById('btn-field-icon').value,
    description: document.getElementById('btn-field-description').value.trim()
  };

  buttonsList = await window.api.saveButton(buttonData);
  modalButtonForm.classList.add('hidden');
  renderButtonsGrid();
  updateStats();
  appendLine('status', `[SUCCESS] SSH Button "${buttonData.name}" tersimpan.`);
}

async function deleteButtonCommand(buttonId) {
  const btnObj = buttonsList.find(b => b.id === buttonId);
  if (confirm(`Apakah Anda yakin ingin menghapus button "${btnObj.name}"?`)) {
    buttonsList = await window.api.deleteButton(buttonId);
    renderButtonsGrid();
    updateStats();
    appendLine('status', `[DELETED] Button "${btnObj.name}" dihapus.`);
  }
}

function populateProfileForm(p) {
  if (!p) return;
  document.getElementById('prof-field-name').value = p.name || 'Target Server';
  document.getElementById('prof-field-host').value = p.host || '';
  document.getElementById('prof-field-port').value = p.port || 22;
  document.getElementById('prof-field-username').value = p.username || '';
  document.getElementById('prof-field-password').value = p.password || '';
}

async function handleSaveTargetProfile() {
  const profData = {
    name: document.getElementById('prof-field-name').value.trim(),
    host: document.getElementById('prof-field-host').value.trim(),
    port: parseInt(document.getElementById('prof-field-port').value, 10) || 22,
    username: document.getElementById('prof-field-username').value.trim(),
    password: document.getElementById('prof-field-password').value
  };

  targetProfile = await window.api.saveTargetProfile(profData);
  renderTargetProfileUI();
  modalProfiles.classList.add('hidden');
  appendLine('status', `[SUCCESS] Konfigurasi SSH Target Server "${targetProfile.name}" disimpan.`);
}

function updateStats() {
  document.getElementById('stat-total-btns').textContent = buttonsList.length;
  document.getElementById('stat-exec-count').textContent = executionCount;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
