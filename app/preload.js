
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Database functions
  dbInitialize: () => ipcRenderer.invoke('db:initialize'),
  dbConnect: () => ipcRenderer.invoke('db:connect'),
  dbGetStatus: () => ipcRenderer.invoke('db:getStatus'),
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  searchBooks: (query) => ipcRenderer.invoke('db:searchBooks', query),
  getGoogleConfig: () => ipcRenderer.invoke('getGoogleConfig'),
  updateDatabase: (buffer) => ipcRenderer.invoke('updateDatabase', buffer),
  
  // Local file access functions
  fileOpenDialog: (options) => ipcRenderer.invoke('file:openDialog', options),
  fileReadFile: (filePath) => ipcRenderer.invoke('file:readFile', filePath),
  fileOpenExternal: (filePath) => ipcRenderer.invoke('file:openExternal', filePath),
  fileShowItemInFolder: (filePath) => ipcRenderer.invoke('file:showItemInFolder', filePath),
  fileGetFileInfo: (filePath) => ipcRenderer.invoke('file:getFileInfo', filePath),

  // Downloads directory functions
  downloadsGetPath: () => ipcRenderer.invoke('downloads:getPath'),
  downloadsListFiles: () => ipcRenderer.invoke('downloads:listFiles'),
  downloadAndOpenFile: (options) => ipcRenderer.invoke('download-and-open-file', options)
});
