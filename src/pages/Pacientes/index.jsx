import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Trash2, Pencil, ArrowLeft, AlertTriangle, Eye } from 'lucide-react'
import { api } from '../../utils/api.js'
import Toast from '../../components/Toast.jsx'

const FORM_VACIO = {
  nombre: '', apellido: '', dni: '', fecha_nacimiento: '', edad: '',
  telefono: '', email: '', obra_social: '', nro_afiliado: '', alergias: '',
  hipertenso: 'NO', diabetico: 'NO', alteracion_coagulacion: 'NO',
  fuma: 'NO', tiempo_fumador: '', asma: 'NO', 
  consume_drogas: 'NO', detalle_drogas: '',
  insuficiencia_renal: 'NO', insuficiencia_hepatica: 'NO',
  embarazada: 'NO', tiempo_embarazo: '', valor_presion: '',
  
  domicilio: '', localidad: '', plan: '', contacto_emergencia: '', medicamentos: '',
  alergia: 'NO', ulsera_gast: 'NO', enf_respiratoria: 'NO', p_a: 'NO', 
  epilepsia: 'NO', trast_cardiacos: 'NO', antecedentes_hemor: 'NO', 
  enfermedades_venereas: 'NO', hepatitis: 'NO', diabetes: 'NO'
}

const dbToForm = (data) => {
  const parsed = { ...FORM_VACIO, ...data };
  ['alergia', 'ulsera_gast', 'enf_respiratoria', 'epilepsia', 'trast_cardiacos', 'antecedentes_hemor', 'enfermedades_venereas', 'hepatitis', 'hipertenso', 'diabetico', 'fuma', 'asma', 'consume_drogas', 'insuficiencia_renal', 'insuficiencia_hepatica', 'embarazada', 'alteracion_coagulacion'].forEach(key => {
    if (data[key] === 1 || data[key] === true || data[key] === 'SI') parsed[key] = 'SI';
    else parsed[key] = 'NO';
  });
  return parsed;
}

const BotonSiNo = ({ valor, onChange, alerta = false }) => {
  const isSi = valor === 'SI';
  const colorActivo = alerta ? 'var(--danger)' : 'var(--primary)';
  const bgActivo = alerta ? '#fef2f2' : 'var(--primary-light)';

  return (
    <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', width: 'fit-content' }}>
      <button type="button" onClick={() => onChange('SI')} style={{ padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: isSi ? bgActivo : 'var(--surface)', color: isSi ? colorActivo : 'var(--text2)', borderRight: '1px solid var(--border)', transition: 'all 0.2s' }}>SÍ</button>
      <button type="button" onClick={() => onChange('NO')} style={{ padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: !isSi ? 'var(--surface2)' : 'var(--surface)', color: !isSi ? 'var(--text)' : 'var(--text2)', transition: 'all 0.2s' }}>NO</button>
    </div>
  )
}

const DataField = ({ label, value, alert = false }) => (
  <div style={{ marginBottom: '14px' }}>
    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: alert ? 700 : 500, color: alert ? 'var(--danger)' : 'var(--text)' }}>{value || '—'}</div>
  </div>
);

export default function Pacientes() {
  const [pacientes, setPacientes]   = useState([])
  const [busqueda, setBusqueda]     = useState('')
  const [vista, setVista]           = useState('lista')
  const [editando, setEditando]     = useState(null)
  const [form, setForm]             = useState(FORM_VACIO)
  const [toast, setToast]           = useState(null)
  const [cargando, setCargando]     = useState(false)
  const navigate = useNavigate()

  const cargarPacientes = useCallback(async () => {
    try {
      const url = busqueda ? `/pacientes?q=${encodeURIComponent(busqueda)}` : '/pacientes'
      const data = await api.get(url)
      setPacientes(data)
    } catch (e) { setToast({ msg: 'Error al cargar pacientes', type: 'error' }) }
  }, [busqueda])

  useEffect(() => { cargarPacientes() }, [cargarPacientes])

  useEffect(() => {
    if (form.fecha_nacimiento) {
      const hoy = new Date(); const fechaNac = new Date(form.fecha_nacimiento);
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      if (hoy.getMonth() < fechaNac.getMonth() || (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() < fechaNac.getDate())) { edad--; }
      setForm(prev => ({ ...prev, edad: edad.toString() }));
    } else { setForm(prev => ({ ...prev, edad: '' })); }
  }, [form.fecha_nacimiento]);

  const handleCuilChange = (e) => {
    const valor = e.target.value; const soloNumeros = valor.replace(/\D/g, ''); 
    if (soloNumeros.length === 11) { setForm(prev => ({ ...prev, cuil_raw: valor, dni: soloNumeros.substring(2, 10) })); } 
    else { setForm(prev => ({ ...prev, cuil_raw: valor })); }
  };

  function abrirNuevo() { setForm(FORM_VACIO); setEditando(null); setVista('formulario') }
  function abrirEditar(p) { setForm(dbToForm(p)); setEditando(p.dni); setVista('formulario') }
  function abrirVer(p) { setForm(dbToForm(p)); setEditando(p.dni); setVista('ver') }
  function volverLista() { setVista('lista'); cargarPacientes() }

  async function guardar() {
    if (!form.nombre || !form.apellido || !form.dni || !form.telefono) {
      setToast({ msg: 'Los campos con (*) son obligatorios', type: 'error' }); return;
    }
    setCargando(true)
    
    // Preparamos los datos limpios para la Base de Datos
    const payload = { ...form };
    const boolFields = ['alergia', 'ulsera_gast', 'enf_respiratoria', 'epilepsia', 'trast_cardiacos', 'antecedentes_hemor', 'enfermedades_venereas', 'hepatitis', 'hipertenso', 'diabetico', 'fuma', 'asma', 'consume_drogas', 'insuficiencia_renal', 'insuficiencia_hepatica', 'embarazada', 'alteracion_coagulacion'];
    boolFields.forEach(f => { payload[f] = form[f] === 'SI' ? 1 : 0; });
    
    // MAGIA: Sincronizamos silenciosamente la P.A y la Diabetes para el Backend
    payload.p_a = payload.hipertenso;
    payload.diabetes = payload.diabetico;

    try {
      if (editando) { await api.put(`/pacientes/${editando}`, payload); setToast({ msg: 'Paciente actualizado', type: 'success' }) } 
      else { await api.post('/pacientes', payload); setToast({ msg: 'Paciente registrado', type: 'success' }) }
      volverLista()
    } catch (e) { setToast({ msg: e.message, type: 'error' }) } finally { setCargando(false) }
  }

  async function darDeBaja(dni, nombre) {
    if (!confirm(`¿Dar de baja a ${nombre}?`)) return
    try { await api.delete(`/pacientes/${dni}`); setToast({ msg: 'Paciente dado de baja', type: 'success' }); cargarPacientes() } 
    catch (e) { setToast({ msg: e.message, type: 'error' }) }
  }

  const campo = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  if (vista === 'lista') {
    return (
      <div>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="page-header">
          <div><div className="page-title">Pacientes</div><div className="page-subtitle">{pacientes.length} pacientes registrados</div></div>
          <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={15} /> Nuevo paciente</button>
        </div>
        <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input style={{ paddingLeft: 32 }} placeholder="Buscar por nombre, apellido o DNI..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Apellido y Nombre</th><th>DNI</th><th>Teléfono</th><th>Riesgos</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
            <tbody>
              {pacientes.length === 0 && (<tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No hay pacientes registrados</td></tr>)}
              {pacientes.map(p => (
                <tr key={p.dni}>
                  <td style={{ fontWeight: 500 }}>{p.apellido}, {p.nombre}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text2)' }}>{p.dni}</td>
                  <td style={{ color: 'var(--text2)' }}>{p.telefono || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {p.hipertenso === 'SI' && <span className="badge badge-red" title="Hipertenso">HTA</span>}
                      {(p.diabetico === 'SI' || p.diabetes === 1) && <span className="badge badge-red" title="Diabético">DBT</span>}
                      {p.hipertenso !== 'SI' && p.diabetico !== 'SI' && p.diabetes !== 1 && <span style={{ color: 'var(--text3)' }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirVer(p)}><Eye size={13} /> Ver paciente</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/historia?dni=${p.dni}&nombre=${p.nombre} ${p.apellido}`)}><FileText size={13} /> Historia</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}><Pencil size={13} /> Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => darDeBaja(p.dni, `${p.nombre} ${p.apellido}`)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (vista === 'ver') {
    return (
      <div>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><button className="btn btn-secondary btn-sm" onClick={volverLista}><ArrowLeft size={14} /> Volver</button><div><div className="page-title">Ficha del Paciente</div><div className="page-subtitle">Información detallada y anamnesis</div></div></div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Datos Personales</h3>
          <div className="grid-3">
            <DataField label="Apellido y Nombre" value={`${form.apellido}, ${form.nombre}`} />
            <DataField label="DNI" value={form.dni} />
            <DataField label="Fecha de Nac. / Edad" value={form.fecha_nacimiento ? `${new Date(form.fecha_nacimiento).toLocaleDateString('es-AR')} (${form.edad} años)` : '—'} />
            <DataField label="Teléfono" value={form.telefono} />
            <DataField label="Email" value={form.email} />
            <DataField label="Obra Social" value={form.obra_social} />
            <DataField label="Nº Afiliado" value={form.nro_afiliado} />
            <DataField label="Plan" value={form.plan} />
            <DataField label="Contacto Emergencia" value={form.contacto_emergencia} />
            <DataField label="Domicilio" value={form.domicilio} />
            <DataField label="Localidad" value={form.localidad} />
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Antecedentes Médicos</h3>
          <div className="grid-3">
            <DataField label="¿Hipertenso? (P.A)" value={form.hipertenso} alert={form.hipertenso === 'SI'} />
            <DataField label="¿Diabético?" value={form.diabetico} alert={form.diabetico === 'SI'} />
            <DataField label="Alt. Coagulación" value={form.alteracion_coagulacion} alert={form.alteracion_coagulacion === 'SI'} />
            <DataField label="¿Asma?" value={form.asma} alert={form.asma === 'SI'} />
            <DataField label="¿Fuma?" value={form.fuma === 'SI' ? `SÍ (${form.tiempo_fumador})` : 'NO'} alert={form.fuma === 'SI'} />
            <DataField label="¿Consume Drogas?" value={form.consume_drogas === 'SI' ? `SÍ (${form.detalle_drogas})` : 'NO'} alert={form.consume_drogas === 'SI'} />
            <DataField label="Insuf. Renal" value={form.insuficiencia_renal} alert={form.insuficiencia_renal === 'SI'} />
            <DataField label="Insuf. Hepática" value={form.insuficiencia_hepatica} alert={form.insuficiencia_hepatica === 'SI'} />
            <DataField label="¿Embarazada?" value={form.embarazada === 'SI' ? `SÍ (${form.tiempo_embarazo})` : 'NO'} alert={form.embarazada === 'SI'} />
            <DataField label="Presión Arterial" value={form.valor_presion} />
            
            <DataField label="¿Alergia?" value={form.alergia === 'SI' ? `SÍ (${form.alergias})` : 'NO'} alert={form.alergia === 'SI'} />
            <DataField label="Úlcera Gast." value={form.ulsera_gast} alert={form.ulsera_gast === 'SI'} />
            <DataField label="Enf. Respiratoria" value={form.enf_respiratoria} alert={form.enf_respiratoria === 'SI'} />
            <DataField label="Epilepsia" value={form.epilepsia} alert={form.epilepsia === 'SI'} />
            <DataField label="Trast. Cardiacos" value={form.trast_cardiacos} alert={form.trast_cardiacos === 'SI'} />
            <DataField label="Antecedentes Hemor." value={form.antecedentes_hemor} alert={form.antecedentes_hemor === 'SI'} />
            <DataField label="Enf. Venéreas" value={form.enfermedades_venereas} alert={form.enfermedades_venereas === 'SI'} />
            <DataField label="Hepatitis" value={form.hepatitis} alert={form.hepatitis === 'SI'} />
          </div>
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--surface2)', paddingTop: '16px' }}>
            <DataField label="Medicamentos Actuales" value={form.medicamentos} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingBottom: 40 }}>
          <button className="btn btn-primary" onClick={() => setVista('formulario')} style={{ padding: '10px 24px', fontSize: '14px' }}><Pencil size={15} /> Editar Datos del Paciente</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><button className="btn btn-secondary btn-sm" onClick={volverLista}><ArrowLeft size={14} /> Volver</button><div><div className="page-title">{editando ? 'Ficha Médica' : 'Nuevo Paciente'}</div><div className="page-subtitle">{editando ? 'Actualizando datos del paciente' : 'Registro de datos y anamnesis'}</div></div></div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Datos Personales</h3>
            <div className="grid-2">
              <div className="form-group"><label>Apellido *</label><input value={form.apellido} onChange={campo('apellido')} autoFocus /></div>
              <div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={campo('nombre')} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>CUIL / DNI * <span style={{fontSize: 10, color: 'var(--text3)', fontWeight: 400}}>(Extrae DNI auto)</span></label>
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="Ej: 20-12345678-9" value={form.cuil_raw || ''} onChange={handleCuilChange} disabled={!!editando} style={{ flex: 1 }}/><input placeholder="DNI" value={form.dni} onChange={campo('dni')} disabled={!!editando} style={{ width: '120px', background: 'var(--surface2)' }} title="DNI extraído"/></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Fecha de nacimiento</label><input type="date" value={form.fecha_nacimiento} onChange={campo('fecha_nacimiento')} /></div>
                <div className="form-group"><label>Edad</label><input value={form.edad} onChange={campo('edad')} placeholder="Calculada auto" style={{ background: form.fecha_nacimiento ? 'var(--surface2)' : 'var(--surface)' }}/></div>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Teléfono *</label><input value={form.telefono} onChange={campo('telefono')} placeholder="Ej: 3814123456" /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={campo('email')} /></div>
            </div>
            <div className="grid-3" style={{ marginTop: '10px' }}>
              <div className="form-group"><label>Contacto Emergencia</label><input value={form.contacto_emergencia} onChange={campo('contacto_emergencia')} placeholder="Nombre y tel" /></div>
              <div className="form-group"><label>Domicilio</label><input value={form.domicilio} onChange={campo('domicilio')} placeholder="Calle y N°" /></div>
              <div className="form-group"><label>Localidad</label><input value={form.localidad} onChange={campo('localidad')} /></div>
            </div>
            <div className="grid-3" style={{ marginTop: '10px' }}>
              <div className="form-group"><label>Obra social</label><input value={form.obra_social} onChange={campo('obra_social')} /></div>
              <div className="form-group"><label>Nº afiliado</label><input value={form.nro_afiliado} onChange={campo('nro_afiliado')} /></div>
              <div className="form-group"><label>Plan</label><input value={form.plan} onChange={campo('plan')} /></div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Antecedentes Médicos</h3>
            
            <div className="grid-2">
              <div className="form-group" style={{ background: form.hipertenso === 'SI' ? '#fef2f2' : 'transparent', padding: '10px', borderRadius: '6px', border: form.hipertenso === 'SI' ? '1px solid #fca5a5' : '1px solid transparent', transition: 'all 0.3s' }}>
                <label style={{ color: form.hipertenso === 'SI' ? 'var(--danger)' : 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>{form.hipertenso === 'SI' && <AlertTriangle size={14} />} ¿Es hipertenso? (P.A)</label>
                <BotonSiNo valor={form.hipertenso} onChange={(val) => setForm(f => ({ ...f, hipertenso: val }))} alerta={true} />
              </div>
              <div className="form-group" style={{ background: form.diabetico === 'SI' ? '#fef2f2' : 'transparent', padding: '10px', borderRadius: '6px', border: form.diabetico === 'SI' ? '1px solid #fca5a5' : '1px solid transparent', transition: 'all 0.3s' }}>
                <label style={{ color: form.diabetico === 'SI' ? 'var(--danger)' : 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>{form.diabetico === 'SI' && <AlertTriangle size={14} />} ¿Es diabético?</label>
                <BotonSiNo valor={form.diabetico} onChange={(val) => setForm(f => ({ ...f, diabetico: val }))} alerta={true} />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: '10px' }}>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Alteración en la coagulación?</label><BotonSiNo valor={form.alteracion_coagulacion} onChange={(val) => setForm(f => ({ ...f, alteracion_coagulacion: val }))} /></div>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Asma?</label><BotonSiNo valor={form.asma} onChange={(val) => setForm(f => ({ ...f, asma: val }))} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px', display: 'flex', gap: '16px' }}>
                <div><label style={{ marginBottom: '8px' }}>¿Fuma?</label><BotonSiNo valor={form.fuma} onChange={(val) => setForm(f => ({ ...f, fuma: val }))} /></div>
                {form.fuma === 'SI' && (<div style={{ flex: 1 }}><label>¿Cuánto tiempo?</label><input value={form.tiempo_fumador} onChange={campo('tiempo_fumador')} placeholder="Ej: 5 años, 10 atados/mes" /></div>)}
              </div>
              <div className="form-group" style={{ padding: '10px', display: 'flex', gap: '16px' }}>
                <div><label style={{ marginBottom: '8px' }}>¿Consume drogas?</label><BotonSiNo valor={form.consume_drogas} onChange={(val) => setForm(f => ({ ...f, consume_drogas: val }))} alerta={true} /></div>
                {form.consume_drogas === 'SI' && (<div style={{ flex: 1 }}><label>¿Cuál y cantidad?</label><input value={form.detalle_drogas} onChange={campo('detalle_drogas')} placeholder="Especificar..." /></div>)}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Insuficiencia Renal?</label><BotonSiNo valor={form.insuficiencia_renal} onChange={(val) => setForm(f => ({ ...f, insuficiencia_renal: val }))} alerta={true} /></div>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Insuficiencia Hepática?</label><BotonSiNo valor={form.insuficiencia_hepatica} onChange={(val) => setForm(f => ({ ...f, insuficiencia_hepatica: val }))} alerta={true} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px', display: 'flex', gap: '16px' }}>
                <div><label style={{ marginBottom: '8px' }}>¿Embarazada?</label><BotonSiNo valor={form.embarazada} onChange={(val) => setForm(f => ({ ...f, embarazada: val }))} /></div>
                {form.embarazada === 'SI' && (<div style={{ flex: 1 }}><label>Tiempo de embarazo</label><input value={form.tiempo_embarazo} onChange={campo('tiempo_embarazo')} placeholder="Ej: 14 semanas" /></div>)}
              </div>
              <div className="form-group" style={{ padding: '10px' }}><label>Valor de la Presión</label><input value={form.valor_presion} onChange={campo('valor_presion')} placeholder="Ej: 120/80" /></div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px', display: 'flex', gap: '16px' }}>
                <div><label style={{ marginBottom: '8px' }}>¿Alergia?</label><BotonSiNo valor={form.alergia} onChange={(val) => setForm(f => ({ ...f, alergia: val }))} alerta={true} /></div>
                {form.alergia === 'SI' && (<div style={{ flex: 1 }}><label>¿A qué es alérgico?</label><input value={form.alergias} onChange={campo('alergias')} placeholder="Ej: Penicilina, látex..." /></div>)}
              </div>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Úlcera Gastrointestinal?</label><BotonSiNo valor={form.ulsera_gast} onChange={(val) => setForm(f => ({ ...f, ulsera_gast: val }))} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Enf. Respiratoria?</label><BotonSiNo valor={form.enf_respiratoria} onChange={(val) => setForm(f => ({ ...f, enf_respiratoria: val }))} alerta={true} /></div>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Epilepsia?</label><BotonSiNo valor={form.epilepsia} onChange={(val) => setForm(f => ({ ...f, epilepsia: val }))} alerta={true} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Trastornos Cardiacos?</label><BotonSiNo valor={form.trast_cardiacos} onChange={(val) => setForm(f => ({ ...f, trast_cardiacos: val }))} alerta={true} /></div>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Antec. Hemorrágicos?</label><BotonSiNo valor={form.antecedentes_hemor} onChange={(val) => setForm(f => ({ ...f, antecedentes_hemor: val }))} alerta={true} /></div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Enfermedades Venéreas?</label><BotonSiNo valor={form.enfermedades_venereas} onChange={(val) => setForm(f => ({ ...f, enfermedades_venereas: val }))} alerta={true} /></div>
              <div className="form-group" style={{ padding: '10px' }}><label style={{ marginBottom: '8px' }}>¿Hepatitis?</label><BotonSiNo valor={form.hepatitis} onChange={(val) => setForm(f => ({ ...f, hepatitis: val }))} alerta={true} /></div>
            </div>

            <div className="form-group" style={{ marginTop: '14px', padding: '0 10px' }}><label>Medicamentos Actuales</label><input value={form.medicamentos} onChange={campo('medicamentos')} placeholder="Escriba los medicamentos que toma el paciente..." /></div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10, paddingBottom: 40 }}><button type="button" className="btn btn-secondary" onClick={volverLista}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={cargando} style={{ padding: '10px 24px', fontSize: '15px' }}>{cargando ? 'Guardando...' : editando ? 'Actualizar Ficha Médica' : 'Registrar Paciente'}</button></div>

        </div>
      </form>
    </div>
  )
}