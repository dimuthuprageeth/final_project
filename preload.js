const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Login-related functions
  loginSuccess: (userDetails) => ipcRenderer.send('login-success', userDetails),
  getUsername: () => ipcRenderer.invoke('get-username'),
  getUserDetails: () => ipcRenderer.invoke('get-user-details'),
  updateLastAudited: (username) => ipcRenderer.invoke('update-last-audited', username),

  // Dashboard-related functions
  runScript1: (which, args) => ipcRenderer.send('run-script1', which, args),
  onScriptOutput: (callback) => ipcRenderer.on('script-output', (event, data) => callback(data)),
  onScriptComplete: (callback) => ipcRenderer.on('script-complete', callback),
  saveToFile: () => ipcRenderer.invoke('save-to-file'),
  controlWindow: (action) => ipcRenderer.send('window-control', action),

  // Navigation functions
  navigateTo: (page) => ipcRenderer.send('navigate-to', page),

  // General utility functions
  closeApp: () => ipcRenderer.send('close-app'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),

  // Event listeners cleanup (important for preventing memory leaks)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // User session management
  logout: () => ipcRenderer.send('logout'),
  checkSession: () => ipcRenderer.invoke('check-session'),

  // Optional: Add error handling
  onError: (callback) => ipcRenderer.on('app-error', (event, error) => callback(error))
});