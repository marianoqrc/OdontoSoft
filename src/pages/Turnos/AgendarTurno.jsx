import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import Modal from '../../components/Modal.jsx'
import Toast from '../../components/Toast.jsx'


export default function AgendarTurno({ onVolver }) {
  console.log('AgendarTurno montado')
  const [dia, setDia]             = useState(new Date())
  const [turno, setTurno]         = useState('manana')
  const [modulos, setModulos]     = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState({ dni_paciente: '', nombre_paciente: '', motivo: '' })
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast]         = useState(null)

  const cargarModulos = useCallback(async () => {
    const fecha = format(dia, 'yyyy-MM-dd')
    try {
      const res = await fetch(`http://localhost:5050/turnos/disponibilidad/${fecha}?turno=${turno}`)
      const data = await res.json()
      console.log('datos recibidos:', data)
      setModulos(data)
      setSeleccionados([])
    } catch(e) {
      console.log('error en fetch:', e)
      setModulos([])
    }
  }, [dia, turno])

  useEffect(() => { cargarModulos() }, [cargarModulos])

  useEffect(() => {
    fetch('http://localhost:5050/pacientes')
      .then(r => r.json())
      .then(setPacientes)
      .catch(() => {})
  }, [])

  function toggleModulo(hora) {
    const mod = modulos.find(m => m.hora === hora)
    if (mod?.estado === 'ocupado') return
    setSeleccionados(prev =>
      prev.includes(hora) ? prev.filter(h => h !== hora) : [...prev, hora]
    )
  }

  function calcularRango() {
    if (seleccionados.length === 0) return null
    const sorted = [...seleccionados].sort()
    const inicio = sorted[0]
    const last = sorted[sorted.length - 1]
    const [h, m] = last.split(':').map(Number)
    const finMins = h * 60 + m + 15
    const fin = `${Math.floor(finMins / 60).toString().padStart(2, '0')}:${(finMins % 60).toString().padStart(2, '0')}`
    return { inicio, fin }
  }

  function seleccionarPaciente(e) {
    const dni = e.target.value
    const p = pacientes.find(p => String(p.dni) === dni)
    setForm(f => ({
      ...f,
      dni_paciente: dni,
      nombre_paciente: p ? `${p.nombre} ${p.apellido}` : ''
    }))
  }

  async function confirmarTurno() {
    if (!form.nombre_paciente) {
      setToast({ msg: 'Ingresá el nombre del paciente', type: 'error' })
      return
    }
    const rango = calcularRango()
    console.log('módulos:', modulos.length, modulos)
    console.log('modulos al renderizar:', modulos)
    if (!rango) return
    setGuardando(true)
    try {
      const res = await fetch('http://localhost:5050/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: format(dia, 'yyyy-MM-dd'),
          hora_inicio: rango.inicio,
          hora_fin: rango.fin,
          ...form,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ msg: 'Turno agendado correctamente', type: 'success' })
      setModal(false)
      setSeleccionados([])
      cargarModulos()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const rango = calcularRango()
  console.log('módulos:', modulos.length, modulos)
  const campo = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={onVolver}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div>
            <div className="page-title">Agendar turno</div>
            <div className="page-subtitle">
              {format(dia, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setDia(d => subDays(d, 1))}>
            <ChevronLeft size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setDia(new Date())}>
            Hoy
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setDia(d => addDays(d, 1))}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'flex', borderRadius: 6, overflow: 'hidden',
          border: '1px solid var(--border)', marginLeft: 'auto'
        }}>
          {['manana', 'tarde'].map(t => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              style={{
                padding: '6px 18px', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                background: turno === t ? 'var(--primary)' : 'var(--surface)',
                color: turno === t ? '#fff' : 'var(--text2)',
                transition: 'all .15s',
              }}
            >
              {t === 'manana' ? '☀️ Mañana' : '🌙 Tarde'}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
          Hacé clic en los módulos para seleccionar el horario del turno
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
          gap: 8,
        }}>
          {modulos.map(({ hora, estado }) => {
            const seleccionado = seleccionados.includes(hora)
            const ocupado = estado === 'ocupado'
            return (
              <button
                key={hora}
                onClick={() => toggleModulo(hora)}
                disabled={ocupado}
                style={{
                  padding: '10px 8px',
                  borderRadius: 6,
                  border: `2px solid ${seleccionado ? 'var(--primary)' : '#d1d5db'}`,
                  background: seleccionado ? 'var(--primary)' : ocupado ? '#f3f4f6' : '#fff',
                  color: seleccionado ? '#fff' : ocupado ? '#9ca3af' : '#111',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: ocupado ? 'not-allowed' : 'pointer',
                  transition: 'all .12s',
                  opacity: ocupado ? 0.6 : 1,
                }}
              >
                {hora}
                {ocupado && (
                  <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2 }}>ocupado</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {seleccionados.length > 0 && rango && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: '#eff6ff',
          borderRadius: 8, border: '1px solid #2563eb'
        }}>
          <div style={{ fontSize: 13 }}>
            <strong>{rango.inicio} — {rango.fin}</strong>
            <span style={{ color: '#64748b', marginLeft: 8 }}>
              ({seleccionados.length * 15} minutos)
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setForm({ dni_paciente: '', nombre_paciente: '', motivo: '' }); setModal(true) }}
          >
            Agendar turno
          </button>
        </div>
      )}

      {modal && rango && (
        <Modal
          title={`Nuevo turno — ${format(dia, 'd/MM/yyyy')} de ${rango.inicio} a ${rango.fin}`}
          onClose={() => setModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Paciente registrado</label>
              <select onChange={seleccionarPaciente} value={form.dni_paciente}>
                <option value="">Seleccioná un paciente...</option>
                {pacientes.map(p => (
                  <option key={p.dni} value={p.dni}>
                    {p.apellido}, {p.nombre} — {p.dni}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>O escribí el nombre manualmente</label>
              <input
                placeholder="Nombre completo"
                value={form.nombre_paciente}
                onChange={campo('nombre_paciente')}
              />
            </div>
            <div className="form-group">
              <label>Motivo de la consulta</label>
              <input
                placeholder="Ej: Limpieza, control, dolor..."
                value={form.motivo}
                onChange={campo('motivo')}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={confirmarTurno} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Confirmar turno'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}