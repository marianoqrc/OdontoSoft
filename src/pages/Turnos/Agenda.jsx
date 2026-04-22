import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import Modal from '../../components/Modal.jsx' 

function duracionTexto(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// NOTA: Se asume que tienes una función global para mostrar notificaciones (Toast).
// Podrías implementarla con un Context de React o una librería como 'react-toastify'.
const mostrarToast = (mensaje, tipo = 'info') => alert(`[${tipo.toUpperCase()}] ${mensaje}`);

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

  // --- FUNCIONES DE WHATSAPP ---
  const abrirWhatsApp = (e, telefono) => {
    e.stopPropagation() 
    if (!telefono) {
      alert("Este paciente no tiene un teléfono registrado.")
      return
    }
    const numLimpio = String(telefono).replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${numLimpio}`, '_blank')
  }

  const abrirRecordatorioTurno = (e, turnoData) => {
    e.stopPropagation() 
    if (!turnoData.telefono_paciente) {
      alert("Este paciente no tiene un teléfono registrado.")
      return
    }
    
    const numLimpio = String(turnoData.telefono_paciente).replace(/[^0-9]/g, '')
    const fechaStr = format(dia, "EEEE d 'de' MMMM", { locale: es })
    
    const mensajeBase = `Hola *${turnoData.nombre_paciente}*, te recordamos tu turno de Odontología el día *${fechaStr}* a las *${turnoData.hora_inicio} hs*. Por favor confirmar asistencia.`
    const mensajeEncoded = encodeURIComponent(mensajeBase)
    
    window.open(`https://wa.me/${numLimpio}?text=${mensajeEncoded}`, '_blank')
  }
  // -----------------------------

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
          throw new Error(data.error || 'Error desconocido al eliminar el turno');
      }
      
      setTurnoSeleccionado(null); 
      cargar(); 
      mostrarToast('Turno cancelado correctamente.', 'success');
    } catch (error) {
      mostrarToast(error.message, 'error');
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
      mostrarToast('Turno actualizado.', 'success');
    } catch (error) {
      mostrarToast(error.message, 'error');
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
              {t === 'manana' ? 'Mañana' : 'Tarde'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline con el nuevo centrado CSS */}
      <div className="timeline-centered-container">

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

        <div className="timeline-list">
          {bloques.map((bloque, i) => (
            <div key={i} className="timeline-item">

              {/* CONTENEDOR MÁGICO DEL PUNTO Y LA LÍNEA (CSS Flexbox) */}
              <div className="timeline-dot-container">
                <div className={`timeline-dot ${bloque.tipo === 'ocupado' ? 'timeline-dot-ocupado' : 'timeline-dot-libre'}`} />
                <div className="timeline-line" />
              </div>

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
                className={`timeline-card ${bloque.tipo === 'ocupado' ? 'timeline-card-ocupado' : 'timeline-card-libre'}`}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    {/* INFO PACIENTE */}
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
                    
                    {/* BOTONES WHATSAPP */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        title="Abrir chat en WhatsApp"
                        onClick={(e) => abrirWhatsApp(e, bloque.turno.telefono_paciente)}
                        style={{ 
                          padding: '4px 8px', 
                          color: 'var(--primary)', 
                          borderColor: 'var(--border)', 
                          background: 'var(--surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MessageCircle size={15} />
                      </button>

                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => abrirRecordatorioTurno(e, bloque.turno)}
                        style={{ 
                          fontSize: 12, 
                          fontWeight: 600,
                          color: 'var(--primary)', 
                          borderColor: 'var(--border)', 
                          background: 'var(--surface)' 
                        }}
                      >
                        Recordar turno
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--text3)', fontWeight: 500 }}>
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
          {/* Formulario para el Enter */}
          <form onSubmit={(e) => { e.preventDefault(); guardarCambios(); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Horario:</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--primary)' }}>
                  {turnoSeleccionado.hora_inicio} — {turnoSeleccionado.hora_fin}
                </div>
              </div>

              <div className="form-group">
                <label>Paciente</label>
                <input 
                  type="text" 
                  value={turnoSeleccionado.nombre_paciente || ''} 
                  onChange={(e) => setTurnoSeleccionado({...turnoSeleccionado, nombre_paciente: e.target.value})}
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Motivo</label>
                <input 
                  type="text" 
                  value={turnoSeleccionado.motivo || ''} 
                  onChange={(e) => setTurnoSeleccionado({...turnoSeleccionado, motivo: e.target.value})}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 16,
                borderTop: '1px solid var(--border)'
              }}>
                
                {/* Ojo acá: type="button" para que Eliminar no dispare el Enter por accidente */}
                <button 
                  type="button"
                  className="btn btn-danger" 
                  onClick={eliminarTurno}
                >
                  Eliminar Turno
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  {/* type="button" para Cerrar */}
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setTurnoSeleccionado(null)}
                  >
                    Cerrar
                  </button>
                  {/* type="submit" para Guardar Cambios */}
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    Guardar Cambios
                  </button>
                </div>

              </div>

            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}