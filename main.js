const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { processInvoices } = require('./backend.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle invoice processing requests
ipcMain.handle('process-invoices', async (event, { textJsContent, jsonData }) => {
  try {
    const progressCallback = (message) => {
      mainWindow.webContents.send('processing-progress', message);
    };
    console.log(jsonData);
    
    
    const results = await processInvoices(textJsContent, jsonData, progressCallback);
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
