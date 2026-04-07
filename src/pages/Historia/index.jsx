import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Paperclip, FileText, Trash2, Eye, X } from 'lucide-react'
import { api } from '../../utils/api.js'
import Odontograma, { COLORES } from '../../components/Odontograma.jsx'
import Toast from '../../components/Toast.jsx'

const PROCEDIMIENTOS = [
  'Consulta', 'Limpieza / Profilaxis', 'Obturación',
  'Extracción', 'Blanqueamiento', 'Ortodoncia', 'Radiografía',
]

const TODAS_LAS_PIEZAS = [11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,
                          31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48]

const CUADRANTES_MAP = {
  'Q1': [11,12,13,14,15,16,17,18],
  'Q2': [21,22,23,24,25,26,27,28],
  'Q3': [31,32,33,34,35,36,37,38],
  'Q4': [41,42,43,44,45,46,47,48],
}

function formatearPiezas(piezasStr) {
  if (!piezasStr) return '—'
  const piezas = piezasStr.split(',').map(Number).filter(Boolean).sort((a,b) => a-b)
  if (piezas.length === 32) return 'Boca entera'
  for (const [nombre, lista] of Object.entries(CUADRANTES_MAP)) {
    if (piezas.length === lista.length && lista.every(p => piezas.includes(p)))
      return `Cuadrante ${nombre}`
  }
  const cuadrantesCompletos = []
  const yaContadas = new Set()
  for (const [nombre, lista] of Object.entries(CUADRANTES_MAP)) {
    if (lista.every(p => piezas.includes(p))) {
      cuadrantesCompletos.push(nombre)
      lista.forEach(p => yaContadas.add(p))
    }
  }
  const sueltas = piezas.filter(p => !yaContadas.has(p))
  const partes = []
  if (cuadrantesCompletos.length) partes.push(cuadrantesCompletos.join(' + '))
  if (sueltas.length) partes.push(sueltas.join(', '))
  return partes.join(' + ')
}

const FORM_VACIO = { procedimiento: '', descripcion: '' }

// ── Componente de adjuntos por evento ────────────────────────────────────────
function PanelAdjuntos({ dni, idAdjunto, onClose }) {
  const [archivos, setArchivos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef()

  useEffect(() => { cargar() }, [idAdjunto])

  async function cargar() {
    try {
      const res = await fetch(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}`)
      const data = await res.json()
      setArchivos(data)
    } catch { setArchivos([]) }
  }

  async function subir(e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendo(true)
    const fd = new FormData()
    fd.append('archivo', archivo)
    try {
      await fetch(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}`, {
        method: 'POST', body: fd
      })
      cargar()
    } finally { setSubiendo(false) }
  }

  async function eliminar(nombre) {
    if (!confirm(`¿Eliminar ${nombre}?`)) return
    await fetch(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}/${nombre}`, { method: 'DELETE' })
    cargar()
  }

  function abrir(nombre) {
    window.open(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}/${nombre}`, '_blank')
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1024/1024).toFixed(1)} MB`
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: 10,
        padding: 24, width: 480, maxHeight: '80vh',
        overflow: 'auto', boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Archivos adjuntos</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Lista de archivos */}
        {archivos.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px 0', fontSize: 13 }}>
            No hay archivos adjuntos para este evento
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {archivos.map(a => (
            <div key={a.nombre} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 6,
              background: 'var(--surface2)', border: '1px solid var(--border)'
            }}>
              <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.nombre}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatSize(a.tamanio)}</div>
              </div>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 8px' }}
                onClick={() => abrir(a.nombre)}
                title="Ver archivo"
              >
                <Eye size={12} />
              </button>
              <button
                className="btn btn-sm"
                style={{ background: '#fef2f2', color: 'var(--danger)', padding: '4px 8px' }}
                onClick={() => eliminar(a.nombre)}
                title="Eliminar"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Botón adjuntar */}
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={subir} />
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => inputRef.current.click()}
          disabled={subiendo}
        >
          <Paperclip size={14} />
          {subiendo ? 'Subiendo...' : 'Adjuntar archivo'}
        </button>
      </div>
    </div>
  )
}

export default function Historia() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dni = params.get('dni')
  const nombrePaciente = params.get('nombre')

  const [historia, setHistoria]           = useState([])
  const [estadosPiezas, setEstadosPiezas] = useState({})
  const [seleccionadas, setSeleccionadas] = useState([])
  const [form, setForm]                   = useState(FORM_VACIO)
  const [archivosNuevos, setArchivosNuevos] = useState([]) // NUEVO ESTADO PARA ARCHIVOS
  const [toast, setToast]                 = useState(null)
  const [guardando, setGuardando]         = useState(false)
  const [adjuntosEvento, setAdjuntosEvento] = useState(null) // {idAdjunto}

  const fileInputRef = useRef(); // Para el botón de adjuntar nuevo

  const cargarHistoria = useCallback(async () => {
    if (!dni) return
    try {
      const data = await api.get(`/historia/${dni}`)
      setHistoria(data)
      const estados = {}
      const invertido = [...data].reverse()
      for (const evento of invertido) {
        if (!evento.piezas || !evento.estado_pieza) continue
        const piezas = evento.piezas.split(',').map(Number)
        for (const pieza of piezas) {
          if (!estados[pieza]) estados[pieza] = evento.estado_pieza
        }
      }
      setEstadosPiezas(estados)
    } catch {
      setToast({ msg: 'Error al cargar historia clínica', type: 'error' })
    }
  }, [dni])

  useEffect(() => { cargarHistoria() }, [cargarHistoria])

  function togglePieza(fdi) {
    setSeleccionadas(prev =>
      prev.includes(fdi) ? prev.filter(p => p !== fdi) : [...prev, fdi]
    )
  }

  const campo = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  // Función para capturar los archivos seleccionados
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setArchivosNuevos(prev => [...prev, ...files]);
    }
    /*console.log('Archivos seleccionados:', e.target.files)
    if (e.target.files.length > 0) {
      setArchivosNuevos(prev => [...prev, ...Array.from(e.target.files)]);
    }
    // Reseteamos el input para permitir subir el mismo archivo si fue borrado
    e.target.value = null; */
  }

  // Función para remover un archivo de la lista antes de enviar
  const removerArchivoNuevo = (index) => {
    setArchivosNuevos(prev => prev.filter((_, i) => i !== index));
  }

  async function guardar() {
    if (!form.procedimiento) {
      setToast({ msg: 'Seleccioná un procedimiento', type: 'error' })
      return
    }
    setGuardando(true)
    try {
      const formData = new FormData();
      formData.append('procedimiento', form.procedimiento);
      formData.append('descripcion', form.descripcion);
      formData.append('piezas', JSON.stringify(seleccionadas));
      
      // Dejamos UN SOLO bucle para adjuntar los archivos
      archivosNuevos.forEach(file => {
        formData.append('archivos', file);
      });

      const res = await fetch(`http://localhost:5050/historia/${dni}`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      setToast({ msg: 'Evento registrado correctamente', type: 'success' })
      setForm(FORM_VACIO)
      setSeleccionadas([])
      setArchivosNuevos([])
      cargarHistoria()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    } finally { setGuardando(false) }
  }

  if (!dni) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
        Seleccioná un paciente desde la lista.
        <br />
        <button className="btn btn-primary" style={{ marginTop: 16 }}
          onClick={() => navigate('/pacientes')}>
          Ir a Pacientes
        </button>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {adjuntosEvento && (
        <PanelAdjuntos
          dni={dni}
          idAdjunto={adjuntosEvento}
          onClose={() => setAdjuntosEvento(null)}
        />
      )}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div>
            <div className="page-title">{nombrePaciente}</div>
            <div className="page-subtitle">DNI: {dni} · Historia Clínica</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Odontograma */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>
              Odontograma — hacé clic en las piezas a tratar
            </div>
            <Odontograma
              estados={estadosPiezas}
              seleccionadas={seleccionadas}
              onToggle={togglePieza}
              onSetSeleccionadas={setSeleccionadas}
            />
            {seleccionadas.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
                <strong>Seleccionadas: </strong>
                {formatearPiezas(seleccionadas.join(','))}
                <span style={{ color: 'var(--text3)', marginLeft: 6 }}>
                  ({seleccionadas.length} piezas)
                </span>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Registrar intervención
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Procedimiento *</label>
                <select value={form.procedimiento} onChange={campo('procedimiento')} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
>
                  <option value="">Seleccioná...</option>
                  {PROCEDIMIENTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Descripción / Notas</label>
                <textarea
                  rows={4}
                  placeholder="Detalles del procedimiento..."
                  value={form.descripcion}
                  onChange={campo('descripcion')}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />  
              </div>

              {/* SECCIÓN DE ADJUNTOS NUEVOS */}
              <div style={{ marginTop: '4px' }}>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm" 
                  onClick={() => fileInputRef.current.click()}
                  style={{ padding: '6px 12px', marginBottom: '8px' }}
                >
                  <Paperclip size={14} style={{ color: 'var(--primary)' }} /> 
                  Adjuntar archivos a este registro
                </button>
                
                {/* Previsualización de los archivos seleccionados */}
                {archivosNuevos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {archivosNuevos.map((file, i) => (
                      <div key={i} style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', 
                        background: 'var(--surface2)', padding: '4px 10px', 
                        borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)',
                        color: 'var(--text)'
                      }}>
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => removerArchivoNuevo(i)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', padding: 0 }}
                          title="Quitar archivo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={guardar}
                  disabled={guardando}
                >
                  <Save size={14} />
                  {guardando ? 'Guardando...' : 'Guardar intervención'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha — Historial */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>
            Historial ({historia.length} eventos)
          </div>

          {historia.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>
              Sin eventos registrados
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historia.map((ev, i) => (
              <div key={i} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {ev.procedimiento || 'Sin procedimiento'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR') : ''}
                  </span>
                </div>
                {ev.piezas && (
                  <div style={{ fontSize: 11.5, color: 'var(--text2)', marginBottom: 4 }}>
                    <strong>Piezas: </strong>{formatearPiezas(ev.piezas)}
                  </div>
                )}
                {ev.descripcion && (
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 8 }}>
                    {ev.descripcion}
                  </div>
                )}

                {/* Botón adjuntos */}
                {ev.id_adjunto && (
                  <button
                    className="btn btn-sm"
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '4px 10px',
                      fontSize: 11.5
                    }}
                    onClick={() => setAdjuntosEvento(ev.id_adjunto)}
                  >
                    <Paperclip size={11} /> Adjuntos
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}