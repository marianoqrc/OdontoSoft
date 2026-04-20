import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Paperclip, FileText, Trash2, X, Image as ImageIcon, Edit3, DollarSign, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { api } from '../../utils/api.js'
import Odontograma, { COLORES } from '../../components/Odontograma.jsx'
import Toast from '../../components/Toast.jsx'
import LayoutImpresionPdf from '../../components/LayoutImpresionPdf.jsx'

const PROCEDIMIENTOS = ['Consulta', 'Limpieza / Profilaxis', 'Obturación', 'Extracción', 'Blanqueamiento', 'Ortodoncia', 'Radiografía']
const TIPOS_APARATO = { 'Fijos': ['Brackets metálicos', 'Brackets cerámicos o zafiro', 'Brackets linguales', 'Brackets autoligables'], 'Removibles': ['Alineadores invisibles', 'Ortodoncia interceptiva', 'Retenedores'] }

const parsePagos = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return []; } }
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

const FORM_VACIO = { procedimiento: '', descripcion: '', orto_mordida: '', orto_tipo_aparato: '', orto_subtipo_aparato: '', orto_plan: '', orto_tiempo: '', monto: '', pagos_detalle: [], tiene_financiacion: 'No', cuotas: '', pagado: 'No' }

export default function Historia() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const dni = params.get('dni'); const nombrePaciente = params.get('nombre');
  const [historia, setHistoria] = useState([]); const [seleccionadas, setSeleccionadas] = useState({}); 
  const [form, setForm] = useState(FORM_VACIO); const [archivosNuevos, setArchivosNuevos] = useState([]); const [archivosPagoNuevos, setArchivosPagoNuevos] = useState([]);
  const [toast, setToast] = useState(null); const [guardando, setGuardando] = useState(false); 
  const [adjuntosEvento, setAdjuntosEvento] = useState(null); const [adjuntosPago, setAdjuntosPago] = useState(null); const [eventoViendo, setEventoViendo] = useState(null);
  const [editandoCaja, setEditandoCaja] = useState(false); const [formCaja, setFormCaja] = useState(FORM_VACIO); const [guardandoCaja, setGuardandoCaja] = useState(false);
  const [nuevoPago, setNuevoPago] = useState({ monto: '', metodo: 'Transferencia' });
  const [modoOdontograma, setModoOdontograma] = useState('ADULTO'); 
  const fileInputRef = useRef(); const fileInputPagoRef = useRef();
  const [editandoEvento, setEditandoEvento] = useState(false);
  
  const [pacienteInfo, setPacienteInfo] = useState(null);
  const pdfRef = useRef(null); 

  const obtenerNombreArchivo = () => {
    const prefijo = eventoViendo ? "Historia" : "Consentimiento";
    const proc = (eventoViendo?.procedimiento || form.procedimiento || "General").replace(/\s+/g, '_');
    const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    const nombreLimpio = (nombrePaciente || '').replace(/\s+/g, '_');
    return `${prefijo}_${dni || 'SinDNI'}_${nombreLimpio}_${proc}_${fecha}`;
  };

  const generarPDF = useReactToPrint({
    contentRef: pdfRef, 
    documentTitle: obtenerNombreArchivo(),
  });

  const fetchPacienteFull = useCallback(async () => {
    try {
      const data = await api.get('/pacientes');
      const pac = data.find(p => String(p.dni) === String(dni));
      if (pac) {
        if (pac.fecha_nacimiento) {
          const hoy = new Date(); const nac = new Date(pac.fecha_nacimiento);
          let edad = hoy.getFullYear() - nac.getFullYear();
          if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
          pac.edad = edad; 
          if (edad < 12) setModoOdontograma('NINO');
        }
        setPacienteInfo(pac);
      }
    } catch (e) { console.error("Error cargando paciente", e) }
  }, [dni]);

  useEffect(() => { if (dni) fetchPacienteFull(); }, [fetchPacienteFull]);

  const cargarHistoria = useCallback(async () => {
    if (!dni) return;
    try {
      const data = await api.get(`/historia/${dni}`);
      setHistoria(data); 
    } catch { setToast({ msg: 'Error al cargar historia clínica', type: 'error' }); }
  }, [dni]);

  useEffect(() => { cargarHistoria(); }, [cargarHistoria]);

  useEffect(() => { 
    if (eventoViendo) { 
      setFormCaja({ monto: eventoViendo.monto || '', pagos_detalle: parsePagos(eventoViendo.pagos_detalle), tiene_financiacion: eventoViendo.tiene_financiacion || 'No', cuotas: eventoViendo.cuotas || '', pagado: eventoViendo.pagado || 'No' }); 
      setEditandoCaja(false); setNuevoPago({ monto: '', metodo: 'Transferencia' });
      setEditandoEvento(false);
    } 
  }, [eventoViendo]);

  useEffect(() => {
    const recalcular = (estadoActual) => {
      const montoTotal = Number(estadoActual.monto) || 0;
      const pagosArray = parsePagos(estadoActual.pagos_detalle);
      const totalPagado = pagosArray.reduce((acc, p) => acc + Number(p.monto), 0);
      const debe = montoTotal - totalPagado;
      let nuevoPagado = estadoActual.pagado;
      if (montoTotal > 0 && debe <= 0) nuevoPagado = 'Si';
      if (montoTotal > 0 && debe > 0) nuevoPagado = 'No';
      if (nuevoPagado !== estadoActual.pagado) return { ...estadoActual, pagado: nuevoPagado };
      return estadoActual;
    };
    if(!editandoCaja && !editandoEvento) setForm(prev => recalcular(prev)); else setFormCaja(prev => recalcular(prev));
  }, [form.pagos_detalle, form.monto, formCaja.pagos_detalle, formCaja.monto, editandoCaja, editandoEvento]);

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

  function toggleSeccion(idSeccion, pincel) { setSeleccionadas(prev => { const next = { ...prev }; if (next[idSeccion] === pincel) delete next[idSeccion]; else next[idSeccion] = pincel; return next; }) }
  const campo = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const handleFileChange = (e, esPago = false) => { const files = Array.from(e.target.files); if (files.length > 0) esPago ? setArchivosPagoNuevos(p => [...p, ...files]) : setArchivosNuevos(p => [...p, ...files]); e.target.value = null; }
  const removerArchivoNuevo = (index, esPago = false) => { esPago ? setArchivosPagoNuevos(p => p.filter((_, i) => i !== index)) : setArchivosNuevos(p => p.filter((_, i) => i !== index)); }

  const generarTextoLiveParaPdf = () => {
    let desc = form.descripcion;
    if (form.procedimiento === 'Ortodoncia') { 
      const det = []; if (form.orto_mordida) det.push(`Mordida: Clase ${form.orto_mordida}`); if (form.orto_tipo_aparato) det.push(`Aparato: ${form.orto_tipo_aparato} ${form.orto_subtipo_aparato ? `(${form.orto_subtipo_aparato})` : ''}`); if (form.orto_plan) det.push(`Plan: ${form.orto_plan}`); if (form.orto_tiempo) det.push(`Tiempo est.: ${form.orto_tiempo}`); 
      if (det.length > 0) desc = `[DETALLE ORTODONCIA]\n${det.join('\n')}\n\n[NOTAS ADICIONALES]\n${form.descripcion}`; 
    }
    return desc;
  };

  async function guardar() {
    if (!form.procedimiento) { setToast({ msg: 'Seleccioná un procedimiento', type: 'error' }); return }
    setGuardando(true)
    try {
      const formData = new FormData(); formData.append('procedimiento', form.procedimiento);
      const estadoFinal = { ...seleccionadas };
      const arrayParaBackend = Object.entries(estadoFinal).filter(([id, est]) => est && est !== 'sano').map(([id, est]) => `${id}:${est}`);
      formData.append('piezas', arrayParaBackend.join(',')); 
      formData.append('descripcion', generarTextoLiveParaPdf()); formData.append('monto', form.monto); formData.append('pagado', form.pagado);
      formData.append('pagos_detalle', JSON.stringify(form.pagos_detalle)); formData.append('tiene_financiacion', form.tiene_financiacion); formData.append('cuotas', form.cuotas);
      archivosNuevos.forEach(file => { formData.append('archivos', file); }); archivosPagoNuevos.forEach(file => { formData.append('archivos_pago', file); });
      
      let res;
      if (editandoEvento) {
        res = await fetch(`http://localhost:5050/historia/editar_evento/${eventoViendo.id}`, { method: 'POST', body: formData });
      } else {
        res = await fetch(`http://localhost:5050/historia/${dni}`, { method: 'POST', body: formData });
      }

      if (!res.ok) throw new Error('Error al guardar');
      setToast({ msg: editandoEvento ? 'Evento actualizado' : 'Evento registrado', type: 'success' }); 
      
      setForm(FORM_VACIO); 
      setSeleccionadas({}); 
      setArchivosNuevos([]); 
      setArchivosPagoNuevos([]); 
      setEventoViendo(null);
      setEditandoEvento(false);
      cargarHistoria();
    } catch (e) { setToast({ msg: e.message, type: 'error' }) } finally { setGuardando(false) }
  }

  async function guardarEdicionCaja() {
    setGuardandoCaja(true);
    try {
      const formData = new FormData(); formData.append('dni', dni); formData.append('monto', formCaja.monto); formData.append('pagado', formCaja.pagado); formData.append('pagos_detalle', JSON.stringify(formCaja.pagos_detalle)); formData.append('tiene_financiacion', formCaja.tiene_financiacion); formData.append('cuotas', formCaja.cuotas);
      archivosPagoNuevos.forEach(file => { formData.append('archivos_pago', file); });
      const res = await fetch(`http://localhost:5050/historia/editar_caja/${eventoViendo.id}`, { method: 'POST', body: formData });
      setToast({ msg: 'Facturación actualizada', type: 'success' }); setEditandoCaja(false); setArchivosPagoNuevos([]); setEventoViendo(prev => ({ ...prev, ...formCaja })); cargarHistoria();
    } catch (e) { setToast({ msg: e.message, type: 'error' }); } finally { setGuardandoCaja(false); }
  }

  const getEstadosLectura = (ev) => { 
    const est = {}; if (!ev.piezas) return est; 
    const partes = ev.piezas.replace(/[\[\]"\\]/g, '').split(',').filter(Boolean); 
    for (const p of partes) { const [id, guardado] = p.includes(':') ? p.split(':') : [p, ev.estado_pieza || 'sano']; if (!id.includes('-')) ['C','T','B','L','R'].forEach(s => est[`${id}-${s}`] = guardado); else est[id] = guardado; } 
    return est; 
  };

  const abrirEdicionTotal = () => {
    setForm({
      procedimiento: eventoViendo.procedimiento,
      descripcion: eventoViendo.descripcion,
      monto: eventoViendo.monto || '',
      pagos_detalle: parsePagos(eventoViendo.pagos_detalle),
      tiene_financiacion: eventoViendo.tiene_financiacion || 'No',
      cuotas: eventoViendo.cuotas || '',
      pagado: eventoViendo.pagado || 'No',
      orto_mordida: '', orto_tipo_aparato: '', orto_subtipo_aparato: '', orto_plan: '', orto_tiempo: ''
    });
    setSeleccionadas(getEstadosLectura(eventoViendo));
    setEditandoEvento(true);
  };

  if (!dni) return (<div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Seleccioná un paciente.<br /><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/pacientes')}>Ir a Pacientes</button></div>)

  const renderPanelPagos = (estadoForm, setEstadoForm, esEdicion = false) => {
    const montoTotal = Number(estadoForm.monto) || 0; const arrayPagos = parsePagos(estadoForm.pagos_detalle); const totalPagado = arrayPagos.reduce((acc, p) => acc + Number(p.monto), 0); const debe = estadoForm.pagado === 'Si' ? 0 : (montoTotal - totalPagado);
    return (
      <div style={{ background: estadoForm.pagado === 'Si' ? '#f0fdf4' : '#fffbeb', padding: '16px', borderRadius: '8px', border: `1px solid ${estadoForm.pagado === 'Si' ? '#bbf7d0' : '#fde68a'}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: estadoForm.pagado === 'Si' ? '#047857' : '#b45309' }}>Facturación</div><div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}><button type="button" onClick={() => setEstadoForm(f => ({...f, pagado: 'Si'}))} style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, background: estadoForm.pagado === 'Si' ? '#10b981' : 'transparent', color: estadoForm.pagado === 'Si' ? '#fff' : 'var(--text3)', border: 'none', cursor: 'pointer' }}>SÍ</button><button type="button" onClick={() => setEstadoForm(f => ({...f, pagado: 'No'}))} style={{ padding: '2px 10px', fontSize: 11, fontWeight: 700, background: estadoForm.pagado === 'No' ? '#ef4444' : 'transparent', color: estadoForm.pagado === 'No' ? '#fff' : 'var(--text3)', border: 'none', cursor: 'pointer' }}>NO</button></div></div>
        <div className="form-group"><label>Monto Total ($)</label><input type="number" value={estadoForm.monto} onChange={(e) => setEstadoForm(f => ({...f, monto: e.target.value}))} style={{ width: '100%', padding: '8px', fontSize: 16, fontWeight: 600 }}/></div>
        <div style={{ marginTop: 8, background: '#fff', borderRadius: 6, padding: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 11, fontWeight: 700 }}>Pagos</span><span style={{ fontSize: 11, fontWeight: 700, color: debe > 0 ? '#dc2626' : '#047857' }}>{debe > 0 ? `DEUDA: $${debe}` : 'SALDADO'}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{arrayPagos.map(p => (<div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--surface2)', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}><div><strong>${p.monto}</strong> — {p.metodo}</div><button type="button" onClick={() => eliminarPago(p.id, esEdicion)} style={{ border: 'none', color: 'var(--danger)', cursor: 'pointer', background: 'none' }}><X size={14}/></button></div>))}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><input type="number" value={nuevoPago.monto} onChange={e => setNuevoPago({...nuevoPago, monto: e.target.value})} placeholder="$" style={{ flex: 1, padding: '4px' }} /><button type="button" onClick={() => agregarPago(esEdicion)} className="btn btn-sm btn-primary">Añadir</button></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {adjuntosEvento && <PanelAdjuntos dni={dni} idAdjunto={adjuntosEvento} onClose={() => setAdjuntosEvento(null)} titulo="Archivos de la Intervención" />}
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ACÁ ESTÁ EL CAMBIO DEL BOTÓN VOLVER */}
          <button className="btn btn-secondary btn-sm" onClick={() => { 
            if (eventoViendo) {
              setEventoViendo(null);
              setEditandoEvento(false);
              setForm(FORM_VACIO);
              setSeleccionadas({});
            } else {
              setSeleccionadas({}); 
              setForm(FORM_VACIO); 
              navigate('/pacientes'); 
            }
          }}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div><div className="page-title">{nombrePaciente}</div><div className="page-subtitle">DNI: {dni} · Historia Clínica</div></div>
        </div>
        <button className="btn btn-secondary" onClick={() => generarPDF()} style={{ background: '#fff' }}><Printer size={16} /> Generar Consentimiento (PDF)</button>
      </div>

      {!eventoViendo || editandoEvento ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Odontograma — {editandoEvento ? 'Editando Evento Pasado' : 'Registrando Nuevo Evento'}
                <button className="btn btn-sm btn-secondary" onClick={() => setSeleccionadas({})}>Limpiar Odontograma</button>
              </div>
              <Odontograma key={modoOdontograma} modoInicial={modoOdontograma} estados={{}} seleccionadas={seleccionadas} onToggleSeccion={toggleSeccion} onSetSeleccionadas={setSeleccionadas}/>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="form-group"><label>Procedimiento *</label><select value={form.procedimiento} onChange={(e) => setForm(f => ({ ...f, procedimiento: e.target.value, orto_mordida: '', orto_tipo_aparato: '', orto_subtipo_aparato: '', orto_plan: '', orto_tiempo: '' }))} style={{ width: '100%', padding: '10px' }}><option value="">Seleccioná...</option>{PROCEDIMIENTOS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              {form.procedimiento === 'Ortodoncia' && (
                <div style={{ background: 'var(--surface2)', padding: '16px', marginTop: 10, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Ortodoncia</div>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <select value={form.orto_mordida} onChange={campo('orto_mordida')} style={{ padding: '8px' }}><option value="">Mordida...</option><option value="1">Clase 1</option><option value="2">Clase 2</option><option value="3">Clase 3</option></select>
                    <select value={form.orto_tipo_aparato} onChange={(e) => setForm(f => ({ ...f, orto_tipo_aparato: e.target.value, orto_subtipo_aparato: '' }))} style={{ padding: '8px' }}><option value="">Aparato...</option>{Object.keys(TIPOS_APARATO).map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                  <input type="text" placeholder="Plan..." value={form.orto_plan} onChange={campo('orto_plan')} style={{ padding: '8px' }} />
                  <input type="text" placeholder="Tiempo..." value={form.orto_tiempo} onChange={campo('orto_tiempo')} style={{ padding: '8px' }} />
                </div>
              )}
              <div className="form-group" style={{ marginTop: 10 }}><label>Descripción / Notas</label><textarea rows={3} value={form.descripcion} onChange={campo('descripcion')} style={{ width: '100%', padding: '10px' }} /></div>
              {renderPanelPagos(form, setForm, false)}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '10px' }}>
                {editandoEvento && <button className="btn btn-secondary" onClick={() => { setEditandoEvento(false); setEventoViendo(null); setForm(FORM_VACIO); setSeleccionadas({}); }}>Cancelar Edición</button>}
                <button className="btn btn-primary" onClick={guardar} disabled={guardando}><Save size={14} /> {editandoEvento ? 'Guardar Cambios' : 'Guardar nueva intervención'}</button>
              </div>
            </div>
          </div>

          <div><div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Historial ({historia.length})</div><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{historia.map((ev, i) => (<div key={i} className="card" style={{ padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{ev.procedimiento}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(ev.fecha).toLocaleDateString('es-AR')}</div></div><button className="btn btn-sm btn-secondary" onClick={() => { setEventoViendo(ev); setEditandoEvento(false); }}>Detalle</button></div></div>))}</div></div>
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px' }}>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><h3>{eventoViendo.procedimiento}</h3><p>{new Date(eventoViendo.fecha).toLocaleDateString('es-AR')}</p></div>
            <button className="btn btn-secondary" onClick={abrirEdicionTotal}><Edit3 size={16} /> Editar Intervención</button>
          </div>
          
          {/* ACÁ ESTÁ EL CAMBIO DE TAMAÑO (maxWidth: 800px para el punto medio) */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflowX: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '800px' }}>
              <Odontograma modoInicial={modoOdontograma} estados={getEstadosLectura(eventoViendo)} soloLectura={true}/>
            </div>
          </div>
          
          <div style={{ marginTop: 20, padding: 20, border: '1px solid var(--border)', borderRadius: 8 }}><strong>Descripción:</strong><p style={{ whiteSpace: 'pre-wrap' }}>{eventoViendo.descripcion}</p></div>
        </div>
      )}

      {/* MOLDE OCULTO PARA IMPRIMIR */}
      <div style={{ overflow: 'hidden', height: 0, position: 'absolute', top: '-10000px' }}>
        <div ref={pdfRef}>
          <LayoutImpresionPdf 
            paciente={pacienteInfo || { nombre: nombrePaciente, dni: dni }} 
            estadosOdontograma={eventoViendo && !editandoEvento ? getEstadosLectura(eventoViendo) : seleccionadas} 
            observaciones={eventoViendo && !editandoEvento ? eventoViendo.descripcion : generarTextoLiveParaPdf()}
          />
        </div>
      </div>
    </div>
  )
}