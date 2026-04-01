import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Pacientes from './pages/Pacientes/index.jsx'
import Historia from './pages/Historia/index.jsx'
import Exportacion from './pages/Exportacion/index.jsx'
import Turnos from './pages/Turnos/index.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/pacientes" replace />} />
          <Route path="pacientes"   element={<Pacientes />} />
          <Route path="turnos"      element={<Turnos />} />
          <Route path="historia"    element={<Historia />} />
          <Route path="exportacion" element={<Exportacion />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}