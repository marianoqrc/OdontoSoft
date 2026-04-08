import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Paperclip, FileText, Trash2, X } from 'lucide-react'
import { api } from '../../utils/api.js'
import Odontograma, { COLORES } from '../../components/Odontograma.jsx'
import Toast from '../../components/Toast.jsx'

const PROCEDIMIENTOS = [
  'Consulta', 'Limpieza / Profilaxis', 'Obturación',
  'Extracción', 'Blanqueamiento', 'Ortodoncia', 'Radiografía',
]

// Opciones específicas para Ortodoncia
const TIPOS_APARATO = {
  'Fijos': ['Brackets metálicos', 'Brackets cerámicos o zafiro', 'Brackets linguales', 'Brackets autoligables'],
  'Removibles': ['Alineadores invisibles', 'Ortodoncia interceptiva', 'Retenedores']
}

function formatearPiezas(piezasStr) {
  if (!piezasStr) return '—'
  const partes = piezasStr.split(',').filter(Boolean);
  if (partes.length === 0) return '—';
  
  if (!partes[0].includes('-')) {
    return partes.join(', ');
  }

  const agrupadas = {};
  partes.forEach(p => {
    const [fdi, seccion] = p.split('-');
    if (!agrupadas[fdi]) agrupadas[fdi] = [];
    const nombreSec = seccion === 'C' ? 'Centro' : 
                      seccion === 'T' ? 'Arriba' : 
                      seccion === 'B' ? 'Abajo' : 
                      seccion === 'L' ? 'Izq' : 
                      seccion === 'R' ? 'Der' : seccion;
    agrupadas[fdi].push(nombreSec);
  });

  return Object.entries(agrupadas).map(([fdi, secs]) => `${fdi} (${secs.join(', ')})`).join(' + ');
}

// Actualizamos el formulario vacío para incluir los nuevos campos de ortodoncia
const FORM_VACIO = { 
  procedimiento: '', 
  descripcion: '',
  // Campos específicos de Ortodoncia
  orto_mordida: '',
  orto_tipo_aparato: '',
  orto_subtipo_aparato: '',
  orto_plan: '',
  orto_tiempo: ''
}

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
              >
                Ver
              </button>
              <button
                className="btn btn-sm"
                style={{ background: '#fef2f2', color: 'var(--danger)', padding: '4px 8px' }}
                onClick={() => eliminar(a.nombre)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

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
  const [archivosNuevos, setArchivosNuevos] = useState([])
  const [toast, setToast]                 = useState(null)
  const [guardando, setGuardando]         = useState(false)
  const [adjuntosEvento, setAdjuntosEvento] = useState(null)
  const [eventoViendo, setEventoViendo] = useState(null) 
  
  const [modoOdontograma, setModoOdontograma] = useState('ADULTO')
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchPacienteInfo() {
      try {
        const data = await api.get('/pacientes');
        const pac = data.find(p => String(p.dni) === String(dni));
        if (pac && pac.fecha_nacimiento) {
          const hoy = new Date();
          const nacimiento = new Date(pac.fecha_nacimiento);
          let edad = hoy.getFullYear() - nacimiento.getFullYear();
          const m = hoy.getMonth() - nacimiento.getMonth();
          if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
          }
          if (edad < 12) {
            setModoOdontograma('NINO');
          }
        }
      } catch (e) { console.error("Error al buscar edad", e) }
    }
    if (dni) fetchPacienteInfo();
  }, [dni]);

  const cargarHistoria = useCallback(async () => {
    if (!dni) return
    try {
      const data = await api.get(`/historia/${dni}`)
      setHistoria(data)
      const estados = {}
      const invertido = [...data].reverse()
      for (const evento of invertido) {
        if (!evento.piezas || !evento.estado_pieza) continue
        const partes = evento.piezas.split(',')
        for (const parte of partes) {
          if (!parte.includes('-')) {
            ['C','T','B','L','R'].forEach(s => estados[`${parte}-${s}`] = evento.estado_pieza);
          } else {
            estados[parte] = evento.estado_pieza
          }
        }
      }
      setEstadosPiezas(estados)
    } catch {
      setToast({ msg: 'Error al cargar historia clínica', type: 'error' })
    }
  }, [dni])

  useEffect(() => { cargarHistoria() }, [cargarHistoria])

  function toggleSeccion(idSeccion) {
    setSeleccionadas(prev =>
      prev.includes(idSeccion) ? prev.filter(p => p !== idSeccion) : [...prev, idSeccion]
    )
  }

  const campo = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setArchivosNuevos(prev => [...prev, ...files]);
    }
    e.target.value = null;
  }

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
      formData.append('piezas', JSON.stringify(seleccionadas)); 
      
      // Armar la descripción final uniendo los campos específicos
      let descripcionFinal = form.descripcion;
      
      if (form.procedimiento === 'Ortodoncia') {
        const detallesOrto = [];
        if (form.orto_mordida) detallesOrto.push(`Mordida: Clase ${form.orto_mordida}`);
        if (form.orto_tipo_aparato) detallesOrto.push(`Aparato: ${form.orto_tipo_aparato} ${form.orto_subtipo_aparato ? `(${form.orto_subtipo_aparato})` : ''}`);
        if (form.orto_plan) detallesOrto.push(`Plan: ${form.orto_plan}`);
        if (form.orto_tiempo) detallesOrto.push(`Tiempo est.: ${form.orto_tiempo}`);
        
        // Juntamos todo. Primero el detalle técnico, luego las notas manuales.
        if (detallesOrto.length > 0) {
          descripcionFinal = `[DETALLE ORTODONCIA]\n${detallesOrto.join('\n')}\n\n[NOTAS ADICIONALES]\n${form.descripcion}`;
        }
      }

      formData.append('descripcion', descripcionFinal);

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

  const getEstadosLectura = (ev) => {
    const estados = {};
    if (!ev.piezas) return estados;
    
    const partes = ev.piezas.split(',');
    for (const parte of partes) {
      if (!parte.includes('-')) {
         ['C','T','B','L','R'].forEach(s => estados[`${parte}-${s}`] = ev.estado_pieza || 'obturacion');
      } else {
         estados[parte] = ev.estado_pieza || 'obturacion'; 
      }
    }
    return estados;
  };

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

  // ============================================================================
  // RENDER: VISTA DE DETALLE DEL EVENTO (Pantalla completa)
  // ============================================================================
  if (eventoViendo) {
    return (
      <div>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {adjuntosEvento && (
          <PanelAdjuntos dni={dni} idAdjunto={adjuntosEvento} onClose={() => setAdjuntosEvento(null)} />
        )}

        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEventoViendo(null)}>
              <ArrowLeft size={14} /> Volver a Historia Clínica
            </button>
            <div>
              <div className="page-title">{eventoViendo.procedimiento}</div>
              <div className="page-subtitle">
                Fecha: {new Date(eventoViendo.fecha).toLocaleDateString('es-AR')} · Paciente: {nombrePaciente}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Odontograma de la intervención
          </div>
          <div style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
            <Odontograma
              modoInicial={modoOdontograma}
              estados={getEstadosLectura(eventoViendo)}
              seleccionadas={[]}
              onToggleSeccion={() => {}}
              onSetSeleccionadas={() => {}}
              soloLectura={true}
            />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 16, background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
            <strong>Piezas tratadas: </strong> {formatearPiezas(eventoViendo.piezas)}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Descripción / Notas
          </div>
          <div style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {eventoViendo.descripcion || 'Sin notas adicionales.'}
          </div>
          
          {eventoViendo.id_adjunto && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--surface2)' }}>
              <button
                className="btn"
                style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                onClick={() => setAdjuntosEvento(eventoViendo.id_adjunto)}
              >
                <Paperclip size={14} /> Ver archivos adjuntos
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: VISTA PRINCIPAL (Odontograma + Historial)
  // ============================================================================
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

          {/* Odontograma Principal */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>
              Odontograma — Seleccioná las caras a tratar
            </div>
            
            <Odontograma
              key={modoOdontograma} 
              modoInicial={modoOdontograma}
              estados={estadosPiezas}
              seleccionadas={seleccionadas}
              onToggleSeccion={toggleSeccion}
              onSetSeleccionadas={setSeleccionadas}
            />
            
            {seleccionadas.length > 0 && (
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                <strong>Caras seleccionadas: </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {seleccionadas.map(sel => (
                    <span key={sel} style={{ background: '#fff', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      {sel.replace('-C', ' Centro').replace('-T', ' Arriba').replace('-B', ' Abajo').replace('-L', ' Izq').replace('-R', ' Der')}
                    </span>
                  ))}
                </div>
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
                <select 
                  value={form.procedimiento} 
                  onChange={(e) => {
                    // Al cambiar de procedimiento, limpiamos los campos extra
                    setForm(f => ({ 
                      ...f, 
                      procedimiento: e.target.value,
                      orto_mordida: '', orto_tipo_aparato: '', orto_subtipo_aparato: '', orto_plan: '', orto_tiempo: ''
                    }))
                  }} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                >
                  <option value="">Seleccioná...</option>
                  {PROCEDIMIENTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* === CAMPOS CONDICIONALES PARA ORTODONCIA === */}
              {form.procedimiento === 'Ortodoncia' && (
                <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Especificaciones de Ortodoncia
                  </div>
                  
                  <div className="form-group">
                    <label>Tipo de Mordida</label>
                    <select value={form.orto_mordida} onChange={campo('orto_mordida')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <option value="">Seleccioná...</option>
                      <option value="1">Clase 1</option>
                      <option value="2">Clase 2</option>
                      <option value="3">Clase 3</option>
                    </select>
                  </div>

                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Tipo de aparato</label>
                      <select 
                        value={form.orto_tipo_aparato} 
                        onChange={(e) => setForm(f => ({ ...f, orto_tipo_aparato: e.target.value, orto_subtipo_aparato: '' }))} 
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      >
                        <option value="">Seleccioná...</option>
                        {Object.keys(TIPOS_APARATO).map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </select>
                    </div>

                    {form.orto_tipo_aparato && (
                      <div className="form-group">
                        <label>Subtipo</label>
                        <select value={form.orto_subtipo_aparato} onChange={campo('orto_subtipo_aparato')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <option value="">Seleccioná...</option>
                          {TIPOS_APARATO[form.orto_tipo_aparato].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Plan de tratamiento (correcciones)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Expansión maxilar, alineación..." 
                      value={form.orto_plan} 
                      onChange={campo('orto_plan')} 
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tiempo estimado</label>
                    <input 
                      type="text" 
                      placeholder="Ej: 18 meses" 
                      value={form.orto_tiempo} 
                      onChange={campo('orto_tiempo')} 
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>
              )}
              {/* ============================================== */}

              <div className="form-group">
                <label>{form.procedimiento === 'Ortodoncia' ? 'Notas adicionales' : 'Descripción / Notas'}</label>
                <textarea
                  rows={4}
                  placeholder="Detalles del procedimiento..."
                  value={form.descripcion}
                  onChange={campo('descripcion')}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />  
              </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid var(--surface2)', paddingBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary-dark)' }}>
                      {ev.procedimiento || 'Sin procedimiento'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR') : ''}
                    </div>
                  </div>
                  
                  <button
                    className="btn btn-sm"
                    onClick={() => setEventoViendo(ev)}
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '11px', 
                      background: 'var(--surface)', 
                      border: '1px solid var(--border)', 
                      color: 'var(--primary)',
                      fontWeight: 600 
                    }}
                  >
                    Ver detalle
                  </button>
                </div>

                {ev.piezas && (
                  <div style={{ fontSize: 11.5, color: 'var(--text2)', marginBottom: 4 }}>
                    <strong>Piezas: </strong>{formatearPiezas(ev.piezas)}
                  </div>
                )}
                
                {ev.descripcion && (
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ev.descripcion}
                  </div>
                )}

                {ev.id_adjunto && (
                  <div style={{ marginTop: '8px' }}>
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
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}