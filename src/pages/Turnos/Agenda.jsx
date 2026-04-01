import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import Modal from '../../components/Modal.jsx' 

function duracionTexto(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function Agenda({ onVolver }) {
  const [dia, setDia] = useState(new Date())
  const [turno, setTurno] = useState('manana') 
  const [bloques, setBloques] = useState([])
  const [cargando, setCargando] = useState(false)
  
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)

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

  async function eliminarTurno() {
    if (!turnoSeleccionado || !turnoSeleccionado.id) {
        alert("Error: No se encontró el ID de este turno.");
        return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro que querés cancelar el turno de ${turnoSeleccionado.nombre_paciente} de las ${turnoSeleccionado.hora_inicio}?`
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:5050/turnos/${turnoSeleccionado.id}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();

      if (!res.ok) {
          throw new Error(data.error || 'Error al eliminar el turno');
      }
      
      setTurnoSeleccionado(null); 
      cargar(); 
      
    } catch (error) {
      alert("Hubo un problema al eliminar el turno: " + error.message);
    }
  }

  async function guardarCambios() {
    if (!turnoSeleccionado || !turnoSeleccionado.id) return;
    
    try {
      const res = await fetch(`http://localhost:5050/turnos/${turnoSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_paciente: turnoSeleccionado.nombre_paciente,
          motivo: turnoSeleccionado.motivo
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar el turno');
      
      setTurnoSeleccionado(null); 
      cargar(); 
      
    } catch (error) {
      alert("Hubo un problema al guardar: " + error.message);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={onVolver}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div className="page-title" style={{ fontWeight: 600 }}>
            Agenda - {' '}
            {format(dia, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </div>
        </div>
      </div>

      {/* Controles */}
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
              {t === 'manana' ? '☀️ Mañana' : '🌙 Tarde'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 24 }}>
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
              <div 
                onClick={() => {
                  if (bloque.tipo === 'ocupado') {
                    setTurnoSeleccionado({
                      ...bloque.turno,
                      hora_inicio: bloque.hora_inicio,
                      hora_fin: bloque.hora_fin
                    });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: `1.5px solid ${bloque.tipo === 'ocupado' ? 'var(--border)' : '#bbf7d0'}`,
                  background: bloque.tipo === 'ocupado' ? 'var(--surface)' : '#f0fdf4',
                  cursor: bloque.tipo === 'ocupado' ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                   if(bloque.tipo === 'ocupado') e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseOut={(e) => {
                   if(bloque.tipo === 'ocupado') e.currentTarget.style.backgroundColor = 'var(--surface)'
                }}
              >
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

      {/* MODAL DE GESTIÓN DE TURNO */}
      {turnoSeleccionado && (
        <Modal
          title={`Gestión de Turno`}
          onClose={() => setTurnoSeleccionado(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Información estática del turno */}
            <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Horario:</div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--primary)' }}>
                {turnoSeleccionado.hora_inicio} — {turnoSeleccionado.hora_fin}
              </div>
            </div>

            {/* Formulario Editable */}
            <div className="form-group">
              <label>Paciente</label>
              <input 
                type="text" 
                value={turnoSeleccionado.nombre_paciente || ''} 
                onChange={(e) => setTurnoSeleccionado({...turnoSeleccionado, nombre_paciente: e.target.value})}
                style={{ background: '#fff', border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', width: '100%' }}
              />
            </div>
            
            <div className="form-group">
              <label>Motivo</label>
              <input 
                type="text" 
                value={turnoSeleccionado.motivo || ''} 
                onChange={(e) => setTurnoSeleccionado({...turnoSeleccionado, motivo: e.target.value})}
                style={{ background: '#fff', border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', width: '100%' }}
              />
            </div>

            {/* Zona de Peligro / Acciones */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 16,
              borderTop: '1px solid var(--border)'
            }}>
              
              <button 
                className="btn" 
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 600 }}
                onClick={eliminarTurno}
              >
                Eliminar Turno
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setTurnoSeleccionado(null)}
                >
                  Cerrar
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={guardarCambios}
                >
                  Guardar Cambios
                </button>
              </div>

            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}