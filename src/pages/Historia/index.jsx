import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Paperclip, FileText, Trash2, X, Image as ImageIcon, Edit3, DollarSign } from 'lucide-react'
import { api } from '../../utils/api.js'
import Odontograma, { COLORES } from '../../components/Odontograma.jsx'
import Toast from '../../components/Toast.jsx'

const PROCEDIMIENTOS = ['Consulta', 'Limpieza / Profilaxis', 'Obturación', 'Extracción', 'Blanqueamiento', 'Ortodoncia', 'Radiografía']
const TIPOS_APARATO = { 'Fijos': ['Brackets metálicos', 'Brackets cerámicos o zafiro', 'Brackets linguales', 'Brackets autoligables'], 'Removibles': ['Alineadores invisibles', 'Ortodoncia interceptiva', 'Retenedores'] }

const parsePagos = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

function formatearPiezas(piezasStr) {
  if (!piezasStr) return '—';
  const cleanStr = piezasStr.replace(/[\[\]"\\]/g, ''); 
  const partes = cleanStr.split(',').filter(Boolean);
  if (partes.length === 0) return '—';

  const agrupadas = {};
  partes.forEach(p => {
    const [idParte, estadoStr] = p.includes(':') ? p.split(':') : [p, 'Tratado'];
    let fdi, seccion;
    if (!idParte.includes('-')) { fdi = idParte; seccion = 'Completo'; } else { [fdi, seccion] = idParte.split('-'); }
    if (!agrupadas[fdi]) agrupadas[fdi] = {}; if (!agrupadas[fdi][estadoStr]) agrupadas[fdi][estadoStr] = [];
    const nombreSec = seccion === 'C' ? 'Centro' : seccion === 'T' ? 'Arriba' : seccion === 'B' ? 'Abajo' : seccion === 'L' ? 'Izq' : seccion === 'R' ? 'Der' : seccion;
    if (nombreSec !== 'Completo') agrupadas[fdi][estadoStr].push(nombreSec);
  });

  return Object.entries(agrupadas).map(([fdi, estadosObj]) => {
    const estadosStrs = Object.entries(estadosObj).map(([est, secs]) => { 
      const nombreEst = est === 'Tratado' ? '' : ` (${COLORES[est]?.label || est})`; 
      return secs.length === 5 ? `Completo${nombreEst}` : `${secs.join(', ')}${nombreEst}`; 
    });
    return `${fdi} [${estadosStrs.join(' | ')}]`;
  }).join(' + ');
}

const FORM_VACIO = { procedimiento: '', descripcion: '', orto_mordida: '', orto_tipo_aparato: '', orto_subtipo_aparato: '', orto_plan: '', orto_tiempo: '', monto: '', pagos_detalle: [], tiene_financiacion: 'No', cuotas: '', pagado: 'No' }

function PanelAdjuntos({ dni, idAdjunto, onClose, titulo = "Archivos adjuntos" }) {
  const [archivos, setArchivos] = useState([]); const [subiendo, setSubiendo] = useState(false); const [archivoViendo, setArchivoViendo] = useState(null); const inputRef = useRef();
  useEffect(() => { cargar() }, [idAdjunto]);
  async function cargar() { try { const res = await fetch(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}`); const data = await res.json(); setArchivos(data) } catch { setArchivos([]) } }
  async function subir(e) { const archivo = e.target.files[0]; if (!archivo) return; setSubiendo(true); const fd = new FormData(); fd.append('archivo', archivo); try { await fetch(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}`, { method: 'POST', body: fd }); cargar() } finally { setSubiendo(false) } }
  async function eliminar(nombre) { if (!confirm(`¿Eliminar ${nombre}?`)) return; await fetch(`http://localhost:5050/adjuntos/${dni}/${idAdjunto}/${nombre}`, { method: 'DELETE' }); cargar() }
  function abrirVisor(nombre) { const url = `http://localhost:5050/adjuntos/${dni}/${idAdjunto}/${nombre}`; const ext = nombre.split('.').pop().toLowerCase(); const esImagen = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext); setArchivoViendo({ url, esImagen, nombre }) }
  function formatSize(bytes) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`; return `${(bytes/1024/1024).toFixed(1)} MB` }

  if (archivoViendo) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>{archivoViendo.nombre}</div><button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => setArchivoViendo(null)}>✕ Cerrar Visor</button></div>
        <div style={{ flex: 1, width: '100%', maxWidth: 1000, background: '#111', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{archivoViendo.esImagen ? <img src={archivoViendo.url} alt="Visor" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <iframe src={archivoViendo.url} width="100%" height="100%" style={{ border: 'none', background: 'white' }} title="Visor PDF" />}</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 24, width: 480, maxHeight: '80vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{titulo}</div><button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button></div>
        {archivos.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px 0', fontSize: 13 }}>No hay archivos adjuntos</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {archivos.map(a => { const ext = a.nombre.split('.').pop().toLowerCase(); const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext); return (
            <div key={a.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              {isImg ? <ImageIcon size={16} color="var(--primary)" style={{ flexShrink: 0 }} /> : <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatSize(a.tamanio)}</div></div>
              <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 8px' }} onClick={() => abrirVisor(a.nombre)}>Ver</button>
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)', padding: '4px 8px' }} onClick={() => eliminar(a.nombre)}><Trash2 size={12} /></button>
            </div>
          )})}
        </div>
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={subir} />
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => inputRef.current.click()} disabled={subiendo}><Paperclip size={14} /> {subiendo ? 'Subiendo...' : 'Adjuntar archivo'}</button>
      </div>
    </div>
  )
}

export default function Historia() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const dni = params.get('dni'); const nombrePaciente = params.get('nombre');
  const [historia, setHistoria] = useState([]); const [estadosPiezas, setEstadosPiezas] = useState({}); const [seleccionadas, setSeleccionadas] = useState({}); 
  const [form, setForm] = useState(FORM_VACIO); const [archivosNuevos, setArchivosNuevos] = useState([]); const [archivosPagoNuevos, setArchivosPagoNuevos] = useState([]);
  const [toast, setToast] = useState(null); const [guardando, setGuardando] = useState(false); 
  const [adjuntosEvento, setAdjuntosEvento] = useState(null); const [adjuntosPago, setAdjuntosPago] = useState(null); const [eventoViendo, setEventoViendo] = useState(null);
  
  const [editandoCaja, setEditandoCaja] = useState(false);
  const [formCaja, setFormCaja] = useState(FORM_VACIO);
  const [guardandoCaja, setGuardandoCaja] = useState(false);
  const [nuevoPago, setNuevoPago] = useState({ monto: '', metodo: 'Transferencia' });
  const [modoOdontograma, setModoOdontograma] = useState('ADULTO'); 
  const fileInputRef = useRef(); const fileInputPagoRef = useRef();

  useEffect(() => {
    async function fetchPacienteInfo() { 
      try { 
        const data = await api.get('/pacientes'); const pac = data.find(p => String(p.dni) === String(dni)); 
        if (pac && pac.fecha_nacimiento) { 
          const hoy = new Date(); const nacimiento = new Date(pac.fecha_nacimiento); 
          let edad = hoy.getFullYear() - nacimiento.getFullYear(); 
          if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) edad--; 
          if (edad < 12) setModoOdontograma('NINO'); 
        } 
      } catch (e) { console.error("Error al buscar edad", e) } 
    }
    if (dni) fetchPacienteInfo();
  }, [dni]);

  const cargarHistoria = useCallback(async () => {
    if (!dni) return;
    try {
      const data = await api.get(`/historia/${dni}`);
      setHistoria(data); 
      const estados = {};
      for (const evento of [...data].reverse()) {
        if (!evento.piezas) continue;
        const cleanStr = evento.piezas.replace(/[\[\]"\\]/g, '');
        const partes = cleanStr.split(',').filter(Boolean);
        for (const parte of partes) {
          const [idParte, estadoGuardado] = parte.includes(':') ? parte.split(':') : [parte, evento.estado_pieza || 'sano'];
          if (!idParte.includes('-')) ['C','T','B','L','R'].forEach(s => estados[`${idParte}-${s}`] = estadoGuardado);
          else estados[idParte] = estadoGuardado;
        }
      }
      setEstadosPiezas(estados);
    } catch { setToast({ msg: 'Error al cargar historia clínica', type: 'error' }); }
  }, [dni]);

  useEffect(() => { cargarHistoria(); }, [cargarHistoria]);

  useEffect(() => { 
    if (eventoViendo) { 
      setFormCaja({ 
        monto: eventoViendo.monto || '', 
        pagos_detalle: parsePagos(eventoViendo.pagos_detalle), 
        tiene_financiacion: eventoViendo.tiene_financiacion || 'No', 
        cuotas: eventoViendo.cuotas || '', 
        pagado: eventoViendo.pagado || 'No' 
      }); 
      setEditandoCaja(false); 
      setNuevoPago({ monto: '', metodo: 'Transferencia' });
    } 
  }, [eventoViendo]);

  // LOGICA MATEMÁTICA CORREGIDA: No anula el switch manual
  useEffect(() => {
    const recalcular = (estadoActual) => {
      const montoTotal = Number(estadoActual.monto) || 0;
      const pagosArray = parsePagos(estadoActual.pagos_detalle);
      const totalPagado = pagosArray.reduce((acc, p) => acc + Number(p.monto), 0);
      const debe = montoTotal - totalPagado;
      
      let nuevoPagado = estadoActual.pagado;
      // Solo cambia automáticamente a "Si" si pagó todo. 
      // PERO NUNCA lo vuelve a "No" automáticamente, así respeta si el usuario hace clic manual.
      if (montoTotal > 0 && debe <= 0) nuevoPagado = 'Si';
      
      if (nuevoPagado !== estadoActual.pagado) {
        return { ...estadoActual, pagado: nuevoPagado };
      }
      return estadoActual;
    };

    if(!editandoCaja) setForm(prev => recalcular(prev));
    else setFormCaja(prev => recalcular(prev));
  }, [form.pagos_detalle, form.monto, formCaja.pagos_detalle, formCaja.monto, editandoCaja]);

  function agregarPago(esEdicion = false) {
    if (!nuevoPago.monto) return;
    const pago = { id: Date.now(), monto: nuevoPago.monto, metodo: nuevoPago.metodo, fecha: new Date().toLocaleDateString('es-AR') };
    if (esEdicion) setFormCaja(f => ({ ...f, pagos_detalle: [...parsePagos(f.pagos_detalle), pago] }));
    else setForm(f => ({ ...f, pagos_detalle: [...parsePagos(f.pagos_detalle), pago] }));
    setNuevoPago({ monto: '', metodo: 'Transferencia' });
  }

  function eliminarPago(idPago, esEdicion = false) {
    if (esEdicion) setFormCaja(f => ({ ...f, pagos_detalle: parsePagos(f.pagos_detalle).filter(p => p.id !== idPago) }));
    else setForm(f => ({ ...f, pagos_detalle: parsePagos(f.pagos_detalle).filter(p => p.id !== idPago) }));
  }

  function toggleSeccion(idSeccion, pincel) { 
    setSeleccionadas(prev => { const next = { ...prev }; if (next[idSeccion] === pincel) delete next[idSeccion]; else next[idSeccion] = pincel; return next; }) 
  }
  
  const campo = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleFileChange = (e, esPago = false) => { const files = Array.from(e.target.files); if (files.length > 0) esPago ? setArchivosPagoNuevos(p => [...p, ...files]) : setArchivosNuevos(p => [...p, ...files]); e.target.value = null; }
  const removerArchivoNuevo = (index, esPago = false) => { esPago ? setArchivosPagoNuevos(p => p.filter((_, i) => i !== index)) : setArchivosNuevos(p => p.filter((_, i) => i !== index)); }

  async function guardar() {
    if (!form.procedimiento) { setToast({ msg: 'Seleccioná un procedimiento', type: 'error' }); return }
    setGuardando(true)
    try {
      const formData = new FormData(); formData.append('procedimiento', form.procedimiento);
      const estadoFinal = { ...estadosPiezas, ...seleccionadas };
      const arrayParaBackend = Object.entries(estadoFinal).filter(([id, est]) => est && est !== 'sano').map(([id, est]) => `${id}:${est}`);
      formData.append('piezas', arrayParaBackend.join(',')); 
      
      let descripcionFinal = form.descripcion;
      if (form.procedimiento === 'Ortodoncia') { 
        const detallesOrto = []; 
        if (form.orto_mordida) detallesOrto.push(`Mordida: Clase ${form.orto_mordida}`); 
        if (form.orto_tipo_aparato) detallesOrto.push(`Aparato: ${form.orto_tipo_aparato} ${form.orto_subtipo_aparato ? `(${form.orto_subtipo_aparato})` : ''}`); 
        if (form.orto_plan) detallesOrto.push(`Plan: ${form.orto_plan}`); 
        if (form.orto_tiempo) detallesOrto.push(`Tiempo est.: ${form.orto_tiempo}`); 
        if (detallesOrto.length > 0) descripcionFinal = `[DETALLE ORTODONCIA]\n${detallesOrto.join('\n')}\n\n[NOTAS ADICIONALES]\n${form.descripcion}`; 
      }
      
      formData.append('descripcion', descripcionFinal); formData.append('monto', form.monto); formData.append('pagado', form.pagado);
      formData.append('pagos_detalle', JSON.stringify(form.pagos_detalle));
      formData.append('tiene_financiacion', form.tiene_financiacion); formData.append('cuotas', form.cuotas);

      archivosNuevos.forEach(file => { formData.append('archivos', file); });
      archivosPagoNuevos.forEach(file => { formData.append('archivos_pago', file); });

      const res = await fetch(`http://localhost:5050/historia/${dni}`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');

      setToast({ msg: 'Evento registrado correctamente', type: 'success' })
      setForm(FORM_VACIO); setSeleccionadas({}); setArchivosNuevos([]); setArchivosPagoNuevos([]); cargarHistoria();
    } catch (e) { setToast({ msg: e.message, type: 'error' }) } finally { setGuardando(false) }
  }

  async function guardarEdicionCaja() {
    setGuardandoCaja(true);
    try {
      const formData = new FormData();
      formData.append('dni', dni); 
      formData.append('monto', formCaja.monto); formData.append('pagado', formCaja.pagado);
      formData.append('pagos_detalle', JSON.stringify(formCaja.pagos_detalle));
      formData.append('tiene_financiacion', formCaja.tiene_financiacion); formData.append('cuotas', formCaja.cuotas);
      archivosPagoNuevos.forEach(file => { formData.append('archivos_pago', file); });

      const res = await fetch(`http://localhost:5050/historia/editar_caja/${eventoViendo.id}`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error al actualizar facturación');

      setToast({ msg: 'Facturación actualizada', type: 'success' });
      setEditandoCaja(false); setArchivosPagoNuevos([]); 
      setEventoViendo(prev => ({ ...prev, ...formCaja })); 
      cargarHistoria();
    } catch (e) { setToast({ msg: e.message, type: 'error' }); } finally { setGuardandoCaja(false); }
  }

  const getEstadosLectura = (ev) => { 
    const estados = {}; if (!ev.piezas) return estados; 
    const cleanStr = ev.piezas.replace(/[\[\]"\\]/g, '');
    const partes = cleanStr.split(',').filter(Boolean); 
    for (const parte of partes) { 
      const [idParte, estadoGuardado] = parte.includes(':') ? parte.split(':') : [parte, ev.estado_pieza || 'sano']; 
      if (!idParte.includes('-')) ['C','T','B','L','R'].forEach(s => estados[`${idParte}-${s}`] = estadoGuardado); 
      else estados[idParte] = estadoGuardado; 
    } 
    return estados; 
  };

  if (!dni) return (<div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Seleccioná un paciente.<br /><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/pacientes')}>Ir a Pacientes</button></div>)

  // ============================================================================
  // COMPONENTE: PANEL DE PAGOS (Se usa al crear y al editar)
  // ============================================================================
  const renderPanelPagos = (estadoForm, setEstadoForm, esEdicion = false) => {
    const montoTotal = Number(estadoForm.monto) || 0;
    const arrayPagos = parsePagos(estadoForm.pagos_detalle);
    const totalPagado = arrayPagos.reduce((acc, p) => acc + Number(p.monto), 0);
    
    // Acá es donde la visualización de la deuda respeta el Switch "SÍ"
    const debe = estadoForm.pagado === 'Si' ? 0 : (montoTotal - totalPagado);
    
    return (
      <div style={{ background: estadoForm.pagado === 'Si' ? '#f0fdf4' : '#fffbeb', padding: '16px', borderRadius: '8px', border: `1px solid ${estadoForm.pagado === 'Si' ? '#bbf7d0' : '#fde68a'}`, display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all .3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: estadoForm.pagado === 'Si' ? '#047857' : '#b45309', textTransform: 'uppercase' }}>Facturación y Cobros</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>¿PAGÓ TODO?</span>
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button type="button" onClick={() => setEstadoForm(f => ({...f, pagado: 'Si'}))} style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, border: 'none', background: estadoForm.pagado === 'Si' ? '#10b981' : 'transparent', color: estadoForm.pagado === 'Si' ? '#fff' : 'var(--text3)', cursor: 'pointer', transition: 'all .2s' }}>SÍ</button>
              <button type="button" onClick={() => setEstadoForm(f => ({...f, pagado: 'No'}))} style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, border: 'none', background: estadoForm.pagado === 'No' ? '#ef4444' : 'transparent', color: estadoForm.pagado === 'No' ? '#fff' : 'var(--text3)', cursor: 'pointer', transition: 'all .2s' }}>NO</button>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label>Monto Total ($)</label>
          <input type="number" placeholder="Ej: 15000" value={estadoForm.monto} onChange={(e) => setEstadoForm(f => ({...f, monto: e.target.value}))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: 16, fontWeight: 600 }}/>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>¿FINANCIACIÓN?</span>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button type="button" onClick={() => setEstadoForm(f => ({...f, tiene_financiacion: 'Si'}))} style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, border: 'none', background: estadoForm.tiene_financiacion === 'Si' ? '#3b82f6' : 'transparent', color: estadoForm.tiene_financiacion === 'Si' ? '#fff' : 'var(--text3)', cursor: 'pointer', transition: 'all .2s' }}>SÍ</button>
              <button type="button" onClick={() => setEstadoForm(f => ({...f, tiene_financiacion: 'No'}))} style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, border: 'none', background: estadoForm.tiene_financiacion === 'No' ? '#94a3b8' : 'transparent', color: estadoForm.tiene_financiacion === 'No' ? '#fff' : 'var(--text3)', cursor: 'pointer', transition: 'all .2s' }}>NO</button>
          </div>
          {estadoForm.tiene_financiacion === 'Si' && (
            <select value={estadoForm.cuotas} onChange={(e) => setEstadoForm(f => ({...f, cuotas: e.target.value}))} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', flex: 1 }}>
              <option value="">Seleccionar plan...</option><option value="3 Cuotas">3 Cuotas</option><option value="6 Cuotas">6 Cuotas</option><option value="12 Cuotas">12 Cuotas</option><option value="Plan Personalizado">Plan Personalizado</option>
            </select>
          )}
        </div>

        <div style={{ marginTop: 8, background: '#fff', borderRadius: 6, border: '1px solid var(--border)', padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
             <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Pagos Parciales</span>
             <span style={{ fontSize: 11, fontWeight: 700, color: debe > 0 ? '#dc2626' : '#047857' }}>{debe > 0 ? `DEUDA: $${debe}` : 'SALDADO'}</span>
          </div>
          
          {arrayPagos.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>No se registraron pagos todavía.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {arrayPagos.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}>
                <div><strong>${p.monto}</strong> — {p.metodo} <span style={{ color: 'var(--text3)', fontSize: 11, marginLeft: 6 }}>({p.fecha})</span></div>
                <button type="button" onClick={() => eliminarPago(p.id, esEdicion)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={14}/></button>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Monto ($)</label><input type="number" value={nuevoPago.monto} onChange={e => setNuevoPago({...nuevoPago, monto: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid var(--border)' }}/></div>
            <div style={{ flex: 1 }}><label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Método</label>
              <select value={nuevoPago.metodo} onChange={e => setNuevoPago({...nuevoPago, metodo: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                <option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta Débito/Crédito</option><option value="Obra Social">Obra Social</option>
              </select>
            </div>
            <button type="button" onClick={() => agregarPago(esEdicion)} className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', height: 32, padding: '0 12px' }}>Añadir</button>
          </div>
        </div>

        <div style={{ marginTop: '4px' }}>
          <input type="file" multiple ref={esEdicion ? fileInputPagoRef : fileInputPagoRef} onChange={(e) => handleFileChange(e, true)} style={{ display: 'none' }} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => esEdicion ? fileInputPagoRef.current.click() : fileInputPagoRef.current.click()} style={{ padding: '6px 12px', marginBottom: '8px', width: '100%', justifyContent: 'center' }}>
            <DollarSign size={14} style={{ color: '#047857' }} /> Subir comprobantes de pago
          </button>
          {archivosPagoNuevos.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {archivosPagoNuevos.map((file, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button type="button" onClick={() => removerArchivoNuevo(i, true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: VISTA DE DETALLE DEL EVENTO
  // ============================================================================
  if (eventoViendo) {
    const pagosLeidos = parsePagos(eventoViendo.pagos_detalle);
    const totalPagado = pagosLeidos.reduce((acc, p) => acc + Number(p.monto), 0);
    // Acá también respeta el Switch
    const debe = eventoViendo.pagado === 'Si' ? 0 : (Number(eventoViendo.monto || 0) - totalPagado);

    return (
      <div>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {adjuntosEvento && <PanelAdjuntos dni={dni} idAdjunto={adjuntosEvento} onClose={() => setAdjuntosEvento(null)} titulo="Archivos de la Intervención" />}
        {adjuntosPago && <PanelAdjuntos dni={dni} idAdjunto={adjuntosPago} onClose={() => setAdjuntosPago(null)} titulo="Comprobantes de Pago" />}

        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><button className="btn btn-secondary btn-sm" onClick={() => setEventoViendo(null)}><ArrowLeft size={14} /> Volver a Historia Clínica</button><div><div className="page-title">{eventoViendo.procedimiento}</div><div className="page-subtitle">Fecha: {new Date(eventoViendo.fecha).toLocaleDateString('es-AR')} · Paciente: {nombrePaciente}</div></div></div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Odontograma de la intervención</div>
          <div style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}><Odontograma modoInicial={modoOdontograma} estados={getEstadosLectura(eventoViendo)} seleccionadas={{}} onToggleSeccion={() => {}} onSetSeleccionadas={() => {}} soloLectura={true}/></div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 16, background: 'var(--surface2)', padding: 12, borderRadius: 8 }}><strong>Piezas tratadas: </strong> {formatearPiezas(eventoViendo.piezas)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Descripción / Notas</div>
            <div style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{eventoViendo.descripcion || 'Sin notas adicionales.'}</div>
            {eventoViendo.id_adjunto && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--surface2)' }}>
                <button className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => setAdjuntosEvento(eventoViendo.id_adjunto)}><Paperclip size={14} /> Ver archivos adjuntos</button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24, background: eventoViendo.pagado === 'Si' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${eventoViendo.pagado === 'Si' ? '#bbf7d0' : '#fde68a'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${eventoViendo.pagado === 'Si' ? '#bbf7d0' : '#fde68a'}`, paddingBottom: '8px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: eventoViendo.pagado === 'Si' ? '#047857' : '#b45309' }}>Facturación</div>
              {!editandoCaja && <button className="btn btn-sm" style={{ background: 'transparent', border: 'none', color: '#64748b', padding: 0 }} onClick={() => setEditandoCaja(true)} title="Editar cobro"><Edit3 size={16} /></button>}
            </div>

            {editandoCaja ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {renderPanelPagos(formCaja, setFormCaja, true)}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditandoCaja(false)}>Cancelar</button>
                  <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={guardarEdicionCaja} disabled={guardandoCaja}>Guardar Cambios</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: eventoViendo.pagado === 'Si' ? '#10b981' : '#f59e0b' }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: eventoViendo.pagado === 'Si' ? '#047857' : '#b45309' }}>{eventoViendo.pagado === 'Si' ? 'PAGO COMPLETADO' : 'PAGO PENDIENTE'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 8 }}>
                  <div><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Monto Total</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{eventoViendo.monto ? `$${eventoViendo.monto}` : 'No especificado'}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Deuda</div><div style={{ fontSize: 16, fontWeight: 700, color: debe > 0 ? '#dc2626' : '#047857' }}>${debe}</div></div>
                </div>
                
                {eventoViendo.tiene_financiacion === 'Si' && <div><div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Financiación</div><div style={{ fontSize: 14, color: 'var(--text)' }}>{eventoViendo.cuotas || 'Sí'}</div></div>}
                
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Pagos Registrados</div>
                  {pagosLeidos.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text2)' }}>Sin pagos registrados.</div> : 
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {pagosLeidos.map(p => ( <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13 }}><span>{p.metodo} <span style={{fontSize: 10, color: 'var(--text3)'}}>({p.fecha})</span></span><strong>${p.monto}</strong></div> ))}
                    </div>
                  }
                </div>

                {eventoViendo.id_adjunto_pago && (
                   <button className="btn btn-sm" style={{ background: '#fff', color: '#047857', border: '1px solid #047857', marginTop: 8, justifyContent: 'center' }} onClick={() => setAdjuntosPago(eventoViendo.id_adjunto_pago)}><DollarSign size={14} /> Ver Comprobantes de Pago</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: VISTA PRINCIPAL (Creación)
  // ============================================================================
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header"><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><button className="btn btn-secondary btn-sm" onClick={() => navigate('/pacientes')}><ArrowLeft size={14} /> Volver</button><div><div className="page-title">{nombrePaciente}</div><div className="page-subtitle">DNI: {dni} · Historia Clínica</div></div></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Odontograma — Seleccioná un color y pintá las caras tratadas</div>
            <Odontograma key={modoOdontograma} modoInicial={modoOdontograma} estados={estadosPiezas} seleccionadas={seleccionadas} onToggleSeccion={toggleSeccion} onSetSeleccionadas={setSeleccionadas}/>
            {Object.keys(seleccionadas).length > 0 && (
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, background: 'var(--surface2)', padding: '10px', borderRadius: '6px' }}>
                <strong>Estado modificado en esta sesión: </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {(() => {
                    const porDiente = {};
                    Object.entries(seleccionadas).forEach(([id, est]) => { const [fdi, seccion] = id.split('-'); if (!porDiente[fdi]) porDiente[fdi] = {}; if (!porDiente[fdi][est]) porDiente[fdi][est] = []; porDiente[fdi][est].push(seccion); });
                    const marcasAgrupadas = [];
                    Object.entries(porDiente).forEach(([fdi, estados]) => { Object.entries(estados).forEach(([est, secciones]) => { const colorObj = COLORES[est] || COLORES.sano; if (secciones.length === 5) marcasAgrupadas.push(<span key={`${fdi}-completo`} style={{ background: colorObj.fill, border: `1px solid ${colorObj.stroke}`, color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{fdi} Completo ({colorObj.label})</span>); else secciones.forEach(sec => { const labelSec = sec === 'C' ? 'Centro' : sec === 'T' ? 'Arriba' : sec === 'B' ? 'Abajo' : sec === 'L' ? 'Izq' : 'Der'; marcasAgrupadas.push(<span key={`${fdi}-${sec}`} style={{ background: colorObj.fill, border: `1px solid ${colorObj.stroke}`, color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{fdi} {labelSec} ({colorObj.label})</span>);}); }); });
                    return marcasAgrupadas;
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Registrar intervención</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group"><label>Procedimiento *</label><select value={form.procedimiento} onChange={(e) => { setForm(f => ({ ...f, procedimiento: e.target.value, orto_mordida: '', orto_tipo_aparato: '', orto_subtipo_aparato: '', orto_plan: '', orto_tiempo: '' })) }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="">Seleccioná...</option>{PROCEDIMIENTOS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>

              {form.procedimiento === 'Ortodoncia' && (
                <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>Especificaciones de Ortodoncia</div>
                  <div className="form-group"><label>Tipo de Mordida</label><select value={form.orto_mordida} onChange={campo('orto_mordida')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="">Seleccioná...</option><option value="1">Clase 1</option><option value="2">Clase 2</option><option value="3">Clase 3</option></select></div>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group"><label>Tipo de aparato</label><select value={form.orto_tipo_aparato} onChange={(e) => setForm(f => ({ ...f, orto_tipo_aparato: e.target.value, orto_subtipo_aparato: '' }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="">Seleccioná...</option>{Object.keys(TIPOS_APARATO).map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select></div>
                    {form.orto_tipo_aparato && <div className="form-group"><label>Subtipo</label><select value={form.orto_subtipo_aparato} onChange={campo('orto_subtipo_aparato')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="">Seleccioná...</option>{TIPOS_APARATO[form.orto_tipo_aparato].map(sub => <option key={sub} value={sub}>{sub}</option>)}</select></div>}
                  </div>
                  <div className="form-group"><label>Plan de tratamiento</label><input type="text" placeholder="Ej: Expansión maxilar..." value={form.orto_plan} onChange={campo('orto_plan')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}/></div>
                  <div className="form-group"><label>Tiempo estimado</label><input type="text" placeholder="Ej: 18 meses" value={form.orto_tiempo} onChange={campo('orto_tiempo')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}/></div>
                </div>
              )}

              <div className="form-group"><label>{form.procedimiento === 'Ortodoncia' ? 'Notas adicionales' : 'Descripción / Notas'}</label><textarea rows={3} placeholder="Detalles del procedimiento..." value={form.descripcion} onChange={campo('descripcion')} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit' }} /></div>

              {renderPanelPagos(form, setForm, false)}

              <div style={{ marginTop: '4px' }}>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current.click()} style={{ padding: '6px 12px', marginBottom: '8px', width: '100%', justifyContent: 'center' }}><Paperclip size={14} style={{ color: 'var(--primary)' }} /> Adjuntar fotos/radiografías clínicas</button>
                {archivosNuevos.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{archivosNuevos.map((file, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)' }}><span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span><button type="button" onClick={() => removerArchivoNuevo(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}><X size={14} /></button></div>))}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}><button className="btn btn-primary" onClick={guardar} disabled={guardando}><Save size={14} /> {guardando ? 'Guardando...' : 'Guardar intervención'}</button></div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Historial ({historia.length} eventos)</div>
          {historia.length === 0 && <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>Sin eventos registrados</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historia.map((ev, i) => (
              <div key={i} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid var(--surface2)', paddingBottom: '8px' }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary-dark)' }}>{ev.procedimiento || 'Sin procedimiento'}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR') : ''}</div></div>
                  <button className="btn btn-sm" onClick={() => setEventoViendo(ev)} style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }}>Ver detalle</button>
                </div>
                
                {ev.monto && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: ev.pagado === 'Si' ? '#047857' : '#b45309', fontWeight: 600, marginTop: 6, padding: '4px 8px', background: ev.pagado === 'Si' ? '#f0fdf4' : '#fffbeb', borderRadius: '4px', border: `1px solid ${ev.pagado === 'Si' ? '#bbf7d0' : '#fde68a'}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.pagado === 'Si' ? '#10b981' : '#f59e0b' }} />
                    Monto: ${ev.monto}
                  </div>
                )}

                <div style={{ marginTop: '8px', display: 'flex', gap: 6 }}>
                  {ev.id_adjunto && <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', fontSize: 11.5 }} onClick={() => setAdjuntosEvento(ev.id_adjunto)}><Paperclip size={11} /> Clínico</button>}
                  {ev.id_adjunto_pago && <button className="btn btn-sm" style={{ background: '#fff', color: '#047857', border: '1px solid #047857', padding: '4px 10px', fontSize: 11.5 }} onClick={() => setAdjuntosPago(ev.id_adjunto_pago)}><DollarSign size={11} /> Pagos</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}