const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
})