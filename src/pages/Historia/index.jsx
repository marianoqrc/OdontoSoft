import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { api } from '../../utils/api.js'
import Odontograma, { COLORES } from '../../components/Odontograma.jsx'
import Toast from '../../components/Toast.jsx'

const PROCEDIMIENTOS = [
  'Consulta',
  'Limpieza / Profilaxis',
  'Obturación',
  'Extracción',
  'Blanqueamiento',
  'Ortodoncia',
  'Radiografía',
]

const FORM_VACIO = {
  procedimiento: '',
  descripcion: '',
}

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

  // Verificar si coincide con algún cuadrante completo
  for (const [nombre, lista] of Object.entries(CUADRANTES_MAP)) {
    if (piezas.length === lista.length &&
        lista.every(p => piezas.includes(p))) {
      return `Cuadrante ${nombre}`
    }
  }

  // Verificar combinaciones de cuadrantes
  const cuadrantesCompletos = []
  const piezasSueltas = []
  const yaContadas = new Set()

  for (const [nombre, lista] of Object.entries(CUADRANTES_MAP)) {
    if (lista.every(p => piezas.includes(p))) {
      cuadrantesCompletos.push(nombre)
      lista.forEach(p => yaContadas.add(p))
    }
  }

  piezas.forEach(p => { if (!yaContadas.has(p)) piezasSueltas.push(p) })

  const partes = []
  if (cuadrantesCompletos.length) partes.push(cuadrantesCompletos.join(' + '))
  if (piezasSueltas.length) partes.push(piezasSueltas.join(', '))

  return partes.join(' + ')
}

export default function Historia() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dni = params.get('dni')
  const nombrePaciente = params.get('nombre')

  const [historia, setHistoria]         = useState([])
  const [estadosPiezas, setEstadosPiezas] = useState({})
  const [seleccionadas, setSeleccionadas] = useState([])
  const [form, setForm]                 = useState(FORM_VACIO)
  const [toast, setToast]               = useState(null)
  const [guardando, setGuardando]       = useState(false)

  const cargarHistoria = useCallback(async () => {
    if (!dni) return
    try {
      const data = await api.get(`/historia/${dni}`)
      setHistoria(data)

      // Reconstruir estado actual de cada pieza desde el historial
      // El último evento de cada pieza define su estado actual
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
    } catch (e) {
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

  async function guardar() {
    if (!form.procedimiento) {
      setToast({ msg: 'Seleccioná un procedimiento', type: 'error' })
      return
    }
    setGuardando(true)
    try {
      await api.post(`/historia/${dni}`, {
        ...form,
        piezas: seleccionadas,
      })
      setToast({ msg: 'Evento registrado correctamente', type: 'success' })
      setForm(FORM_VACIO)
      setSeleccionadas([])
      cargarHistoria()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setGuardando(false)
    }
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

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm"
            onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div>
            <div className="page-title">{nombrePaciente}</div>
            <div className="page-subtitle">DNI: {dni} · Historia Clínica</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Columna izquierda — Odontograma + formulario */}
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

          {/* Formulario nuevo evento */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>
              <Plus size={14} style={{ marginRight: 6 }} />
              Registrar intervención
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Procedimiento *</label>
                <select value={form.procedimiento} onChange={campo('procedimiento')}>
                  <option value="">Seleccioná...</option>
                  {PROCEDIMIENTOS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descripción / Notas</label>
                <textarea
                  rows={3}
                  placeholder="Detalles del procedimiento..."
                  value={form.descripcion}
                  onChange={campo('descripcion')}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={guardar}
                disabled={guardando}
                style={{ alignSelf: 'flex-end' }}
              >
                <Save size={14} />
                {guardando ? 'Guardando...' : 'Guardar intervención'}
              </button>
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
                  <strong>Piezas: </strong>
                  {formatearPiezas(ev.piezas)}
                </div>
)}
                {ev.descripcion && (
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 4 }}>
                    {ev.descripcion}
                  </div>
                )}
                {ev.profesional && (
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Prof: {ev.profesional}
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