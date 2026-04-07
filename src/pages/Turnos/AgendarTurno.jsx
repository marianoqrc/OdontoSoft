import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import Modal from '../../components/Modal.jsx'
import Toast from '../../components/Toast.jsx'

export default function AgendarTurno({ onVolver }) {
  const [dia, setDia] = useState(new Date())
  const [turno, setTurno] = useState('manana')
  const [modulos, setModulos] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [inicioSelec, setInicioSelec] = useState(null)
  const [hoveredHora, setHoveredHora] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ dni_paciente: '', nombre_paciente: '', motivo: '' })
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const cargarModulos = useCallback(async () => {
    const fecha = format(dia, 'yyyy-MM-dd')
    try {
      const res = await fetch(`http://localhost:5050/turnos/disponibilidad/${fecha}?turno=${turno}`)
      const data = await res.json()
      setModulos(data)
      setSeleccionados([])
      setInicioSelec(null)
      setHoveredHora(null)
    } catch(e) {
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

    if (!inicioSelec) {
      setInicioSelec(hora)
      setSeleccionados([hora])
      return
    }

    if (inicioSelec === hora) {
      setInicioSelec(null)
      setSeleccionados([])
      return
    }

    const todasLasHoras = modulos.map(m => m.hora)
    const idxInicio = todasLasHoras.indexOf(inicioSelec)
    const idxFin = todasLasHoras.indexOf(hora)

    if (idxFin < idxInicio) {
      setInicioSelec(hora)
      setSeleccionados([hora])
      return
    }

    const rangoHoras = todasLasHoras.slice(idxInicio, idxFin + 1)
    const hayOcupado = rangoHoras.some(h => modulos.find(m => m.hora === h)?.estado === 'ocupado')

    if (hayOcupado) {
      setInicioSelec(hora)
      setSeleccionados([hora])
      return
    }

    setSeleccionados(rangoHoras)
    setInicioSelec(null)
    setHoveredHora(null)
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
      setInicioSelec(null)
      setHoveredHora(null)
      cargarModulos()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const estaEnRangoVisual = (hora) => {
    if (seleccionados.includes(hora)) return true
    if (inicioSelec && hoveredHora) {
      const todasLasHoras = modulos.map(m => m.hora)
      const idxInicio = todasLasHoras.indexOf(inicioSelec)
      const idxHover = todasLasHoras.indexOf(hoveredHora)
      const idxActual = todasLasHoras.indexOf(hora)
      
      if (idxHover > idxInicio) {
        const rangoH = todasLasHoras.slice(idxInicio, idxHover + 1)
        const hayOcupado = rangoH.some(h => modulos.find(m => m.hora === h)?.estado === 'ocupado')
        if (!hayOcupado) {
          return idxActual >= idxInicio && idxActual <= idxHover
        }
      }
    }
    return false
  }

  const rango = calcularRango()
  const campo = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const textoInstructivo = () => {
    if (!inicioSelec && seleccionados.length === 0)
      return 'Hacé clic en un módulo para marcar el inicio del turno'
    if (inicioSelec)
      return `Inicio: ${inicioSelec} — ahora hacé clic en el módulo final`
    if (seleccionados.length > 0 && rango)
      return `Turno seleccionado: ${rango.inicio} — ${rango.fin} (${seleccionados.length * 15} min)`
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={onVolver}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div className="page-title" style={{ fontWeight: 600 }}>
            Agendar turno - {' '}
            {format(dia, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setDia(d => subDays(d, 1))}>
            <ChevronLeft size={14} />
          </button>
          
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setDia(new Date())}
            disabled={isToday(dia)}
            style={{
              minWidth: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: isToday(dia) ? 'var(--text2)' : 'inherit', 
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              fontWeight: isToday(dia) ? 600 : 400,
              cursor: isToday(dia) ? 'default' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isToday(dia) ? 'Hoy' : 'Volver a hoy'}
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
              {t === 'manana' ? 'Mañana' : 'Tarde'}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{
          fontSize: 12, marginBottom: 14,
          color: inicioSelec ? 'var(--primary)' : 'var(--text2)',
          fontWeight: inicioSelec ? 600 : 400,
        }}>
          {textoInstructivo()}
        </div>

        <div 
          onMouseLeave={() => setHoveredHora(null)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: 8,
          }}
        >
          {modulos.map(({ hora, estado }) => {
            const ocupado = estado === 'ocupado'
            const enRango = estaEnRangoVisual(hora)
            const esInicio = hora === inicioSelec
            
            return (
              <button
                key={hora}
                onClick={() => toggleModulo(hora)}
                onMouseEnter={() => !ocupado && setHoveredHora(hora)}
                disabled={ocupado}
                style={{
                  padding: '10px 8px',
                  borderRadius: 6,
                  border: `2px solid ${
                    esInicio ? 'var(--primary)' :
                    enRango ? 'var(--primary)' : 'var(--border)'
                  }`,
                  background:
                    esInicio ? 'var(--primary-light)' :
                    enRango ? 'var(--primary)' :
                    ocupado ? 'var(--surface2)' : 'var(--surface)',
                  color:
                    esInicio ? 'var(--primary-dark)' :
                    enRango ? '#fff' :
                    ocupado ? 'var(--text3)' : 'var(--text)',
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

      {seleccionados.length > 1 && rango && !inicioSelec && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: 'var(--primary-light)',
          borderRadius: 8, border: '1px solid var(--primary)', marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>
            <strong>{rango.inicio} — {rango.fin}</strong>
            <span style={{ color: 'var(--text2)', marginLeft: 8 }}>
              ({seleccionados.length * 15} minutos)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setSeleccionados([]); setInicioSelec(null); setHoveredHora(null); }}
            >
              Limpiar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { setForm({ dni_paciente: '', nombre_paciente: '', motivo: '' }); setModal(true) }}
            >
              Agendar turno
            </button>
          </div>
        </div>
      )}

      {modal && rango && (
        <Modal
          title={`Nuevo turno — ${format(dia, 'd/MM/yyyy')} de ${rango.inicio} a ${rango.fin}`}
          onClose={() => setModal(false)}
        >
          <form onSubmit={(e) => { e.preventDefault(); confirmarTurno(); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Paciente registrado</label>
                <select onChange={seleccionarPaciente} value={form.dni_paciente} autoFocus>
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
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar turno'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}