const { contextBridge, ipcRenderer } = require('electron');

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('api', {
  // Token management
  token: {
    validate: (token) => ipcRenderer.invoke('token:validate', token),
    load: () => ipcRenderer.invoke('token:load'),
    clear: () => ipcRenderer.invoke('token:clear'),
  },

  // Database operations
  db: {
    initialize: () => ipcRenderer.invoke('db:initialize'),
    searchBooks: (query) => ipcRenderer.invoke('db:searchBooks', query),
    getBooksByCategory: (categoryId) => ipcRenderer.invoke('db:getBooksByCategory', categoryId),
    getVersion: () => ipcRenderer.invoke('bootstrap:getVersion'),
  },

  // Bootstrap operations
  bootstrap: {
    getStatus: () => ipcRenderer.invoke('bootstrap:getStatus'),
    downloadDatabase: () => ipcRenderer.invoke('bootstrap:downloadDatabase'),
    checkForUpdates: () => ipcRenderer.invoke('bootstrap:checkForUpdates'),
    onProgress: (callback) => ipcRenderer.on('bootstrap:progress', callback),
    onLog: (callback) => ipcRenderer.on('bootstrap:log', callback),
    onUpdateAvailable: (callback) => ipcRenderer.on('database:update-available', callback),
  },

  // Download operations
  download: {
    book: (bookData) => ipcRenderer.invoke('download:book', bookData),
  },

  // Utility functions
  app: {
    getVersion: () => process.env.npm_package_version || '2.0.0',
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
  }
});