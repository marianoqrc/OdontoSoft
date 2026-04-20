import { useState } from 'react'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import Agenda from './Agenda.jsx'
import AgendarTurno from './AgendarTurno.jsx'

export default function Turnos() {
  const [vista, setVista] = useState(null)

  if (vista === 'agenda') return <Agenda onVolver={() => setVista(null)} />
  if (vista === 'agendar') return <AgendarTurno onVolver={() => setVista(null)} />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Turnos</div>
          <div className="page-subtitle">Gestión de agenda del consultorio</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 700, marginTop: 20 }}>
        <div
          className="card"
          onClick={() => setVista('agenda')}
          style={{ padding: 32, cursor: 'pointer', transition: 'all .15s', textAlign: 'center' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
        >
          <CalendarDays size={40} color="var(--primary)" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Agenda</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            Ver los turnos programados del día con timeline de ocupación
          </div>
        </div>

        <div
          className="card"
          onClick={() => setVista('agendar')}
          style={{ padding: 32, cursor: 'pointer', transition: 'all .15s', textAlign: 'center' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
        >
          
          <CalendarPlus size={40} color="var(--primary)" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Agendar turno</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            Seleccioná módulos de disponibilidad para crear un nuevo turno
          </div>
        </div>
      </div>
    </div>
  )
}