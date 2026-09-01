const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const db = require('./database');

let mainWindow;

// Global SSH Session & Stateful PTY Shell Stream State
let activeSshClient = null;
let activeShellStream = null;
let activeSshProfile = null;
let connectionStatus = 'disconnected';

function sendSshStatusUpdate(statusInfo) {
  connectionStatus = statusInfo.status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('ssh-status-change', statusInfo);
  }
}

function sendStreamOutput(type, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('ssh-command-output', {
      type,
      data
    });
  }
}

async function createWindow() {
  const dbPath = path.join(app.getPath('userData'), 'app_data.sqlite');
  await db.initDatabase(dbPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 680,
    title: 'SSH Remote Control & Command Studio',
    backgroundColor: '#090d16',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  cleanupSshSession();
  if (process.platform !== 'darwin') app.quit();
});

function cleanupSshSession() {
  if (activeShellStream) {
    try { activeShellStream.end(); } catch (e) {}
    activeShellStream = null;
  }
  if (activeSshClient) {
    try { activeSshClient.end(); } catch (e) {}
    activeSshClient = null;
  }
  activeSshProfile = null;
}

// --- IPC Handlers ---

// Buttons CRUD
ipcMain.handle('get-buttons', () => {
  return db.getButtons();
});

ipcMain.handle('save-button', (event, buttonData) => {
  return db.saveButton(buttonData);
});

ipcMain.handle('delete-button', (event, buttonId) => {
  return db.deleteButton(buttonId);
});

// Single Target Profile Management
ipcMain.handle('get-target-profile', () => {
  return db.getTargetProfile();
});

ipcMain.handle('save-target-profile', (event, profileData) => {
  const updated = db.saveTargetProfile(profileData);
  activeSshProfile = updated;
  return updated;
});

// Get Connection Status
ipcMain.handle('get-connection-status', () => {
  return {
    status: connectionStatus,
    profile: activeSshProfile || db.getTargetProfile()
  };
});

// Connect Stateful SSH PTY Shell
ipcMain.handle('connect-ssh', async () => {
  const profile = db.getTargetProfile();

  if (!profile || !profile.host || !profile.username) {
    throw new Error('Target SSH Server belum dikonfigurasi. Silakan atur Pengaturan SSH Server terlebih dahulu.');
  }

  cleanupSshSession();

  sendSshStatusUpdate({
    status: 'connecting',
    profile,
    message: `Menghubungkan ke PTY Shell ${profile.username}@${profile.host}:${profile.port || 22}...`
  });

  return new Promise((resolve, reject) => {
    const conn = new Client();

    const connectConfig = {
      host: profile.host,
      port: parseInt(profile.port || 22, 10),
      username: profile.username,
      password: profile.password || '',
      readyTimeout: 12000
    };

    conn.on('ready', () => {
      activeSshClient = conn;
      activeSshProfile = profile;

      // Request Interactive Stateful PTY Shell Session
      conn.shell({
        term: 'xterm-256color',
        rows: 35,
        cols: 120
      }, (err, stream) => {
        if (err) {
          cleanupSshSession();
          sendSshStatusUpdate({
            status: 'error',
            profile,
            error: `Gagal membuka PTY Shell: ${err.message}`
          });
          return reject(err);
        }

        activeShellStream = stream;

        // PTY Shell Output Data Listener (Stateful Realtime Output)
        stream.on('data', (data) => {
          sendStreamOutput('stdout', data.toString());
        });

        stream.on('close', () => {
          activeShellStream = null;
          activeSshClient = null;
          sendSshStatusUpdate({
            status: 'disconnected',
            profile: null,
            message: 'Sesi Stateful PTY SSH Shell ditutup.'
          });
        });

        sendSshStatusUpdate({
          status: 'connected',
          profile,
          message: `Terhubung ke Stateful SSH Shell: ${profile.username}@${profile.host}:${profile.port}`
        });

        resolve({ status: 'connected', profile });
      });
    });

    conn.on('error', (err) => {
      cleanupSshSession();
      sendSshStatusUpdate({
        status: 'error',
        profile,
        error: `Koneksi SSH Gagal: ${err.message}`
      });
      reject(err);
    });

    conn.on('end', () => {
      cleanupSshSession();
      sendSshStatusUpdate({
        status: 'disconnected',
        profile: null,
        message: 'Koneksi SSH terputus.'
      });
    });

    try {
      conn.connect(connectConfig);
    } catch (err) {
      sendSshStatusUpdate({
        status: 'error',
        profile,
        error: `Error inisialisasi SSH: ${err.message}`
      });
      reject(err);
    }
  });
});

// Disconnect SSH
ipcMain.handle('disconnect-ssh', async () => {
  cleanupSshSession();

  sendSshStatusUpdate({
    status: 'disconnected',
    profile: null,
    message: 'Koneksi SSH diputuskan.'
  });

  return { status: 'disconnected' };
});

// Write Command directly into Stateful PTY Shell Stream
ipcMain.on('execute-ssh-command', (event, { command }) => {
  if (!activeShellStream || connectionStatus !== 'connected') {
    sendStreamOutput('error', '⚠️ SSH Shell tidak terhubung! Silakan klik "Connect" terlebih dahulu.\n');
    return;
  }

  try {
    // Send command + Enter to the active stateful PTY shell stream
    activeShellStream.write(command + '\r\n');
  } catch (err) {
    sendStreamOutput('error', `Gagal mengirim perintah ke PTY Shell: ${err.message}\n`);
  }
});
