const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const fs = require('fs')

//URL Frontend
const dev_URL = 'http://localhost:5173'
const PROD_URL = `file://${path.join(__dirname, '../dist/index.html')}`
const is_dev = process.env.NODE_ENV !== 'production'

//Carpeta donde se guardarán los archivos
function getDataDir() {
    const base = app.getPath('userData')
    const dataPath = path.join(base, 'data')
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true })
    }
    return dataPath
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        titleBarStyle: 'default',
        title: 'OdontoSoft' 
        })

    win.loadURL(is_dev ? dev_URL : PROD_URL)

    if (is_dev) {
        win.webContents.openDevTools()  
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle('get-data-dir', () => {
    return getDataDir()
})