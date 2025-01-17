const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  processInvoices: (textJsContent, jsonData) => 
    ipcRenderer.invoke('process-invoices', { textJsContent, jsonData }),
  
  onProcessingProgress: (callback) => 
    ipcRenderer.on('processing-progress', callback)
});
