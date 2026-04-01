import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Trash2, Pencil } from 'lucide-react'
import { api } from '../../utils/api.js'
import Modal from '../../components/Modal.jsx'
import Toast from '../../components/Toast.jsx'

// Formulario vacío por defecto
const FORM_VACIO = {
  nombre: '', apellido: '', dni: '', fecha_nacimiento: '',
  telefono: '', email: '', obra_social: '', nro_afiliado: '', alergias: ''
}

export default function Pacientes() {
  const [pacientes, setPacientes]   = useState([])
  const [busqueda, setBusqueda]     = useState('')
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState(null) // null = nuevo, dni = editando
  const [form, setForm]             = useState(FORM_VACIO)
  const [toast, setToast]           = useState(null)
  const [cargando, setCargando]     = useState(false)
  const navigate = useNavigate()

  // ── Cargar pacientes ──────────────────────────────────────────────────────
  const cargarPacientes = useCallback(async () => {
    try {
      const url = busqueda ? `/pacientes?q=${encodeURIComponent(busqueda)}` : '/pacientes'
      const data = await api.get(url)
      setPacientes(data)
    } catch (e) {
      setToast({ msg: 'Error al cargar pacientes', type: 'error' })
    }
  }, [busqueda])

  useEffect(() => { cargarPacientes() }, [cargarPacientes])

  // ── Abrir modal ───────────────────────────────────────────────────────────
  function abrirNuevo() {
    setForm(FORM_VACIO)
    setEditando(null)
    setModal(true)
  }

  function abrirEditar(p) {
    setForm({ ...p })
    setEditando(p.dni)
    setModal(true)
  }

  // ── Guardar (crear o editar) ───────────────────────────────────────────────
  async function guardar() {
    if (!form.nombre || !form.apellido || !form.dni || !form.telefono) {
      setToast({ msg: 'Nombre, apellido, DNI y Teléfono son obligatorios', type: 'error' })
      return
      return
    }
    setCargando(true)
    try {
      if (editando) {
        await api.put(`/pacientes/${editando}`, form)
        setToast({ msg: 'Paciente actualizado correctamente', type: 'success' })
      } else {
        await api.post('/pacientes', form)
        setToast({ msg: 'Paciente registrado correctamente', type: 'success' })
      }
      setModal(false)
      cargarPacientes()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setCargando(false)
    }
  }

  // ── Dar de baja ───────────────────────────────────────────────────────────
  async function darDeBaja(dni, nombre) {
    if (!confirm(`¿Dar de baja a ${nombre}?`)) return
    try {
      await api.delete(`/pacientes/${dni}`)
      setToast({ msg: 'Paciente dado de baja', type: 'success' })
      cargarPacientes()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  // ── Actualizar campo del formulario ───────────────────────────────────────
  const campo = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Pacientes</div>
          <div className="page-subtitle">{pacientes.length} pacientes registrados</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>
          <Plus size={15} /> Nuevo paciente
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <Search size={14} style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text3)'
        }} />
        <input
          style={{ paddingLeft: 32 }}
          placeholder="Buscar por nombre, apellido o DNI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Apellido y Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Obra Social</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                  No hay pacientes registrados
                </td>
              </tr>
            )}
            {pacientes.map(p => (
              <tr key={p.dni}>
                <td style={{ fontWeight: 500 }}>
                  {p.apellido}, {p.nombre}
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text2)' }}>
                  {p.dni}
                </td>
                <td style={{ color: 'var(--text2)' }}>{p.telefono || '—'}</td>
                <td>
                  {p.obra_social
                    ? <span className="badge badge-blue">{p.obra_social}</span>
                    : <span style={{ color: 'var(--text3)' }}>—</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/historia?dni=${p.dni}&nombre=${p.nombre} ${p.apellido}`)}
                    >
                      <FileText size={13} /> Historia
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => darDeBaja(p.dni, `${p.nombre} ${p.apellido}`)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

{/* Modal formulario */}
      {modal && (
        <Modal
          title={editando ? 'Editar paciente' : 'Nuevo paciente'}
          onClose={() => setModal(false)}
        >
          {/* NUEVO: Envolvemos todo en un form para habilitar el "Enter" */}
          <form onSubmit={(e) => { e.preventDefault(); guardar(); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Apellido *</label>
                  <input value={form.apellido} onChange={campo('apellido')} autoFocus />
                </div>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input value={form.nombre} onChange={campo('nombre')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>DNI *</label>
                  <input value={form.dni} onChange={campo('dni')} disabled={!!editando} />
                </div>
                <div className="form-group">
                  <label>Fecha de nacimiento</label>
                  <input type="date" value={form.fecha_nacimiento} onChange={campo('fecha_nacimiento')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Teléfono (WhatsApp) *</label>
                  <input value={form.telefono} onChange={campo('telefono')} placeholder="Ej: 3814123456" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={campo('email')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Obra social</label>
                  <input value={form.obra_social} onChange={campo('obra_social')} />
                </div>
                <div className="form-group">
                  <label>Nº afiliado</label>
                  <input value={form.nro_afiliado} onChange={campo('nro_afiliado')} />
                </div>
              </div>
              <div className="form-group">
                <label>Alergias / Notas médicas</label>
                <textarea rows={2} value={form.alergias} onChange={campo('alergias')} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              {/* IMPORTANTE: type="button" para que no dispare el form */}
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                Cancelar
              </button>
              {/* IMPORTANTE: type="submit" para que escuche el Enter */}
              <button type="submit" className="btn btn-primary" disabled={cargando}>
                {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}