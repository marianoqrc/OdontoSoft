// storage.js — todas las operaciones de lectura y escritura de archivos Excel
// window.electronAPI viene del preload.js que creamos antes
import * as XLSX from 'xlsx'

// ── Obtener la carpeta de datos ───────────────────────────────────────────────
async function getDataDir() {
  // En desarrollo usamos una carpeta local, en Electron usamos AppData
  if (window.electronAPI) {
    return await window.electronAPI.getDataDir()
  }
  return null
}

// ── Construir la ruta del archivo de un paciente ──────────────────────────────
function pacientePath(dataDir, dni) {
  return `${dataDir}/${dni}/paciente.xlsx`
}

// ── Leer todos los pacientes ──────────────────────────────────────────────────
export async function leerPacientes() {
  if (!window.electronAPI) return obtenerPacientesMock()

  const dataDir = await getDataDir()
  const lista = await window.electronAPI.listarCarpetas(dataDir)
  const pacientes = []

  for (const dni of lista) {
    try {
      const ruta = pacientePath(dataDir, dni)
      const datos = await window.electronAPI.leerArchivo(ruta)
      if (!datos) continue

      const wb = XLSX.read(datos, { type: 'array' })
      const ws = wb.Sheets['Paciente']
      if (!ws) continue

      const rows = XLSX.utils.sheet_to_json(ws)
      if (rows.length > 0) pacientes.push(rows[0])
    } catch (e) {
      console.error(`Error leyendo paciente ${dni}:`, e)
    }
  }

  return pacientes.sort((a, b) => a.apellido?.localeCompare(b.apellido))
}

// ── Guardar un paciente (crea o actualiza) ────────────────────────────────────
export async function guardarPaciente(paciente) {
  if (!window.electronAPI) {
    console.log('Mock: guardarPaciente', paciente)
    return true
  }

  const dataDir = await getDataDir()
  const carpeta = `${dataDir}/${paciente.dni}`
  await window.electronAPI.crearCarpeta(carpeta)

  const ruta = pacientePath(dataDir, paciente.dni)

  // Si el archivo ya existe, conservamos las hojas que ya tiene (historia clínica)
  let wb
  const existente = await window.electronAPI.leerArchivo(ruta)
  if (existente) {
    wb = XLSX.read(existente, { type: 'array' })
  } else {
    wb = XLSX.utils.book_new()
    // Crear hoja de historia clínica vacía si es paciente nuevo
    const wsHistoria = XLSX.utils.aoa_to_sheet([
      ['fecha', 'piezas', 'procedimiento', 'descripcion', 'profesional']
    ])
    XLSX.utils.book_append_sheet(wb, wsHistoria, 'Historia')
  }

  // Actualizar hoja Paciente con los datos actuales
  const wsPaciente = XLSX.utils.json_to_sheet([{
    ...paciente,
    actualizado_en: new Date().toISOString()
  }])
  
  // Si ya existe la hoja la reemplazamos, sino la creamos
  if (wb.SheetNames.includes('Paciente')) {
    wb.Sheets['Paciente'] = wsPaciente
  } else {
    XLSX.utils.book_append_sheet(wb, wsPaciente, 'Paciente')
  }

  // Escribir el archivo
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  await window.electronAPI.escribirArchivo(ruta, buffer)
  return true
}

// ── Eliminar un paciente (baja lógica — marca como inactivo) ──────────────────
export async function darDeBajaPaciente(dni) {
  const pacientes = await leerPacientes()
  const p = pacientes.find(x => x.dni === dni)
  if (!p) return false
  return guardarPaciente({ ...p, activo: false })
}

// ── Leer historia clínica de un paciente ─────────────────────────────────────
export async function leerHistoria(dni) {
  if (!window.electronAPI) return []

  const dataDir = await getDataDir()
  const ruta = pacientePath(dataDir, dni)
  const datos = await window.electronAPI.leerArchivo(ruta)
  if (!datos) return []

  const wb = XLSX.read(datos, { type: 'array' })
  const ws = wb.Sheets['Historia']
  if (!ws) return []

  return XLSX.utils.sheet_to_json(ws)
}

// ── Agregar evento a la historia clínica (inmutable — solo append) ────────────
export async function agregarEvento(dni, evento) {
  if (!window.electronAPI) {
    console.log('Mock: agregarEvento', evento)
    return true
  }

  const dataDir = await getDataDir()
  const ruta = pacientePath(dataDir, dni)
  const datos = await window.electronAPI.leerArchivo(ruta)
  if (!datos) throw new Error('Paciente no encontrado')

  const wb = XLSX.read(datos, { type: 'array' })
  const ws = wb.Sheets['Historia']
  const historial = ws ? XLSX.utils.sheet_to_json(ws) : []

  // Agregar el nuevo evento con timestamp automático (RF06)
  const nuevoEvento = {
    ...evento,
    fecha: new Date().toISOString(),  // RF06 — timestamp automático
  }
  historial.push(nuevoEvento)

  // Reescribir la hoja completa con el nuevo evento al final
  const wsNueva = XLSX.utils.json_to_sheet(historial)
  wb.Sheets['Historia'] = wsNueva

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  await window.electronAPI.escribirArchivo(ruta, buffer)
  return true
}

// ── Datos mock para desarrollo en navegador (sin Electron) ───────────────────
function obtenerPacientesMock() {
  return [
    { id: '1', nombre: 'María', apellido: 'González', dni: '30111222', telefono: '351-111-2222', obra_social: 'OSDE', activo: true },
    { id: '2', nombre: 'Carlos', apellido: 'Rodríguez', dni: '25333444', telefono: '351-333-4444', obra_social: 'Swiss Medical', activo: true },
  ]
}