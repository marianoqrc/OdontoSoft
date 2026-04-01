import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

function duracionTexto(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function Agenda({ onVolver }) {
  const [dia, setDia]       = useState(new Date())
  const [turno, setTurno]   = useState('manana') // 'manana' | 'tarde'
  const [bloques, setBloques] = useState([])
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const fecha = format(dia, 'yyyy-MM-dd')
      const res = await fetch(`http://localhost:5050/turnos/timeline/${fecha}?turno=${turno}`)
      const data = await res.json()
      setBloques(data)
    } catch {
      setBloques([])
    } finally {
      setCargando(false)
    }
  }, [dia, turno])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={onVolver}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div>
            <div className="page-title">Agenda</div>
            <div className="page-subtitle">
              {format(dia, "EEEE d 'de' MMMM yyyy", { locale: es })}
              {isToday(dia) && <span className="badge badge-blue" style={{ marginLeft: 8 }}>Hoy</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>

        {/* Navegación de día */}
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

        {/* Switch mañana/tarde */}
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

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Línea vertical */}
        <div style={{
          position: 'absolute', left: 8, top: 8, bottom: 8,
          width: 2, background: 'var(--border)', borderRadius: 2
        }} />

        {cargando && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            Cargando...
          </div>
        )}

        {!cargando && bloques.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            No hay datos para este período
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bloques.map((bloque, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

              {/* Punto en la línea */}
              <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                marginTop: 14, marginLeft: -5,
                background: bloque.tipo === 'ocupado' ? 'var(--primary)' : 'var(--accent)',
                border: '2px solid var(--surface)',
                boxShadow: '0 0 0 2px ' + (bloque.tipo === 'ocupado' ? 'var(--primary)' : 'var(--accent)'),
              }} />

              {/* Tarjeta del bloque */}
              <div style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                border: `1.5px solid ${bloque.tipo === 'ocupado' ? 'var(--border)' : '#bbf7d0'}`,
                background: bloque.tipo === 'ocupado' ? 'var(--surface)' : '#f0fdf4',
              }}>
                {/* Horario y duración */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {bloque.hora_inicio} — {bloque.hora_fin}
                  </span>
                  <span className={`badge ${bloque.tipo === 'ocupado' ? 'badge-blue' : 'badge-green'}`}>
                    {duracionTexto(bloque.duracion_min)}
                  </span>
                </div>

                {bloque.tipo === 'ocupado' && bloque.turno ? (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {bloque.turno.nombre_paciente}
                    </div>
                    {bloque.turno.motivo && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {bloque.turno.motivo}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>
                    Disponible
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}