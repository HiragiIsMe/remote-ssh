const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getButtons: () => ipcRenderer.invoke('get-buttons'),
  saveButton: (buttonData) => ipcRenderer.invoke('save-button', buttonData),
  deleteButton: (buttonId) => ipcRenderer.invoke('delete-button', buttonId),

  // Single Target SSH Server Profile API
  getTargetProfile: () => ipcRenderer.invoke('get-target-profile'),
  saveTargetProfile: (profileData) => ipcRenderer.invoke('save-target-profile', profileData),

  // SSH Connection Management API
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  connectSsh: () => ipcRenderer.invoke('connect-ssh'),
  disconnectSsh: () => ipcRenderer.invoke('disconnect-ssh'),

  onSshStatusChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ssh-status-change', handler);
    return () => ipcRenderer.removeListener('ssh-status-change', handler);
  },

  // Stateful PTY Shell Stream Spawner
  executeSshCommand: (payload) => ipcRenderer.send('execute-ssh-command', payload),

  onSshCommandOutput: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ssh-command-output', handler);
    return () => ipcRenderer.removeListener('ssh-command-output', handler);
  }
});
