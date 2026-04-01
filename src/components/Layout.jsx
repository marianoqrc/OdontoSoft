import { NavLink, Outlet } from 'react-router-dom'
import { Users, FileText, Download, CalendarDays } from 'lucide-react'

const NAV = [
  { to: '/pacientes',   icon: Users,        label: 'Pacientes'        },
  { to: '/turnos',      icon: CalendarDays, label: 'Turnos'           },
  { to: '/historia',    icon: FileText,     label: 'Historia Clínica' },
  { to: '/exportacion', icon: Download,     label: 'Exportación'      },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Odonto<span>Soft</span></h1>
          <p>Gestión odontológica local</p>
        </div>

        <nav style={{ flex: 1 }}>
          <div className="nav-section">Módulos</div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ fontSize: 11, color: '#334155' }}>OdontoSoft v1.0</div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}