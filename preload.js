const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  processInvoices: (textJsContent, jsonData) => 
    ipcRenderer.invoke('process-invoices', { textJsContent, jsonData }),
  
  processSalary: (textJsContent, jsonData) =>
    ipcRenderer.invoke('process-salary', { textJsContent, jsonData }),
  
  onProcessingProgress: (callback) => 
    ipcRenderer.on('processing-progress', callback)
});
