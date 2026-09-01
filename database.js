const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db = null;
let DB_PATH = '';

async function initDatabase(dbFilePath) {
  DB_PATH = dbFilePath;
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const filebuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(filebuffer);
    } catch (err) {
      console.error('Error reading existing SQLite db, creating new:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create Single Target Profile Table & Buttons Table
  db.run(`
    CREATE TABLE IF NOT EXISTS target_profile (
      id TEXT PRIMARY KEY DEFAULT 'single_target',
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 22,
      username TEXT NOT NULL,
      password TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS buttons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      icon TEXT DEFAULT 'terminal',
      color TEXT DEFAULT 'cyan',
      description TEXT
    );
  `);

  saveDatabase();
}

function saveDatabase() {
  if (!db || !DB_PATH) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to write database to disk:', err);
  }
}

// --- BUTTONS SQL OPERATIONS ---

function getButtons() {
  if (!db) return [];
  try {
    const res = db.exec("SELECT id, name, command, icon, color, description FROM buttons");
    if (!res || res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    return values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  } catch (err) {
    console.error("Database getButtons error:", err);
    return [];
  }
}

function saveButton(button) {
  if (!db) return [];
  const id = button.id || `ssh-btn-${Date.now()}`;
  const name = button.name || 'Custom Button';
  const command = button.command || '';
  const icon = button.icon || 'terminal';
  const color = button.color || 'cyan';
  const description = button.description || '';

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO buttons (id, name, command, icon, color, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, name, command, icon, color, description]);
  stmt.free();

  saveDatabase();
  return getButtons();
}

function deleteButton(id) {
  if (!db) return [];
  const stmt = db.prepare("DELETE FROM buttons WHERE id = ?");
  stmt.run([id]);
  stmt.free();

  saveDatabase();
  return getButtons();
}

// --- SINGLE TARGET PROFILE SQL OPERATIONS ---

function getTargetProfile() {
  if (!db) return null;
  try {
    const res = db.exec("SELECT id, name, host, port, username, password FROM target_profile WHERE id = 'single_target'");
    if (!res || res.length === 0 || res[0].values.length === 0) return null;
    const columns = res[0].columns;
    const row = res[0].values[0];
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  } catch (err) {
    console.error("Database getTargetProfile error:", err);
    return null;
  }
}

function saveTargetProfile(profile) {
  if (!db) return null;
  const name = profile.name || 'Target SSH Server';
  const host = profile.host || '127.0.0.1';
  const port = parseInt(profile.port || 22, 10);
  const username = profile.username || 'root';
  const password = profile.password || '';

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO target_profile (id, name, host, port, username, password)
    VALUES ('single_target', ?, ?, ?, ?, ?)
  `);
  stmt.run([name, host, port, username, password]);
  stmt.free();

  saveDatabase();
  return getTargetProfile();
}

module.exports = {
  initDatabase,
  getButtons,
  saveButton,
  deleteButton,
  getTargetProfile,
  saveTargetProfile
};
