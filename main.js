const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');


let mainWindow;
let currentUser = '';
let currentBranch = '';
let currentLastAudited = '';
let lastOutput = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 510,
    frame: false,
    transparent: true,
    resizable: false,
    roundedCorners: false,
    hasShadow: false,
    vibrancy: null,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html'); // Login page
}

app.whenReady().then(createWindow);


ipcMain.on('login-success', (event, userDetails) => {
  if (typeof userDetails === 'object') {
    currentUser = userDetails.username;
    currentBranch = userDetails.branch;
    currentLastAudited = userDetails.last_audited;
  } else {
    currentUser = userDetails;
    currentBranch = '';
    currentLastAudited = '';
  }
  mainWindow.setSize(850, 655); // <-- Resize for External UI
  mainWindow.loadFile('external/index.html');
});


// Provide current user info to renderer
ipcMain.handle('get-username', () => {
  return currentUser;
});

// Provide all user details to renderer
ipcMain.handle('get-user-details', () => {
  return {
    username: currentUser,
    branch: currentBranch,
    last_audited: currentLastAudited
  };
});

// Run Python script (script.py, scan.py, or 1.py)
ipcMain.on('run-script1', (event, which) => {
  let scriptFile = 'script.py';
  if (which === 'scan') {
    scriptFile = 'scan.py';
  } else if (which === '1') {
    scriptFile = '1.py';
  }
  // Accept args for script
  let args = [];
  if (arguments.length >= 3 && Array.isArray(arguments[2])) {
    args = arguments[2];
  }
  const python = spawn('python', [path.join(__dirname, 'external', scriptFile), ...args]);

  let result = '';
  python.stdout.on('data', (data) => {
    result += data.toString();
  });

  python.stderr.on('data', (data) => {
    result += `ERROR: ${data}`;
  });

  python.on('close', () => {
    lastOutput = result;
    event.sender.send('script-output', result);
    event.sender.send('script-complete');
  });
});

// Update last_audited in database
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'project'
});

ipcMain.handle('update-last-audited', async (event, username) => {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().slice(0, 10);
    db.query('UPDATE users SET last_audited = ? WHERE name = ?', [today, username], (err, result) => {
      if (err) {
        resolve({ success: false, error: err });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Save output to file
ipcMain.handle('save-to-file', async () => {
  const result = await dialog.showSaveDialog({
    title: "Save Output",
    defaultPath: "system_info.txt"
  });

  if (!result.canceled && result.filePath) {
    const fs = require('fs');
    fs.writeFileSync(result.filePath, lastOutput);
    return result.filePath;
  }
  return null;
});

// Window controls
ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (action === 'minimize') window.minimize();
  if (action === 'close') window.close();
});

// Add these to your main.js IPC handlers
ipcMain.on('minimize-window', (event) => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.minimize();
});

ipcMain.on('close-app', (event) => {
  app.quit();
});
