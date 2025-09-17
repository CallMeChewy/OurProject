
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  dbInitialize: () => ipcRenderer.invoke('db:initialize'),
  dbConnect: () => ipcRenderer.invoke('db:connect'),
  dbGetStatus: () => ipcRenderer.invoke('db:getStatus'),
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  fileOpenExternal: (filePath) => ipcRenderer.invoke('file:openExternal', filePath),
  downloadFile: (options) => ipcRenderer.invoke('download-file', options),
});
