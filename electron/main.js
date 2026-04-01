const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const isDev = process.env.NODE_ENV !== 'production'
let flaskProcess = null
let mainWindow = null

function getDataDir() {
  const dataPath = path.join(app.getPath('userData'), 'datos')
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true })
  return dataPath
}

function startFlask() {
  if (isDev) {
    console.log('Modo desarrollo — Flask debe estar corriendo en puerto 5050')
    return
  }

  const posiblesPython = [
    path.join(process.resourcesPath, 'backend', '.venv', 'Scripts', 'python.exe'),
    path.join(path.dirname(app.getPath('exe')), 'backend', '.venv', 'Scripts', 'python.exe'),
  ]

  const posiblesApp = [
    path.join(process.resourcesPath, 'backend', 'app.py'),
    path.join(path.dirname(app.getPath('exe')), 'backend', 'app.py'),
  ]

  let pythonPath = posiblesPython.find(p => fs.existsSync(p))
  let appPath    = posiblesApp.find(p => fs.existsSync(p))

  if (!pythonPath || !appPath) {
    console.error('No se encontró Python o app.py')
    return
  }

  flaskProcess = spawn(pythonPath, [appPath], {
    env: { ...process.env, ODONTOSOFT_DATA_DIR: getDataDir() },
    windowsHide: true,
    cwd: path.dirname(appPath),
  })

  flaskProcess.stdout.on('data', d => console.log('[Flask]', d.toString()))
  flaskProcess.stderr.on('data', d => console.error('[Flask]', d.toString()))
}

async function waitForFlask(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('http://localhost:5050/health')
      if (res.ok) return true
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'OdontoSoft',
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // DevTools solo en desarrollo
    mainWindow.webContents.openDevTools()
    mainWindow.show()
  } else {
    startFlask()
    await waitForFlask()
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Cargando:', indexPath)
    console.log('Existe:', fs.existsSync(indexPath))
    mainWindow.loadFile(indexPath)
    // Sin DevTools en producción
    mainWindow.show()
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (flaskProcess) {
    flaskProcess.kill()
    flaskProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('get-data-dir', () => getDataDir())