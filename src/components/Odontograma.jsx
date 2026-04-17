import React, { useState, useRef } from 'react';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const COLORES = {
  // --- BASE / BORRADOR ---
  sano:                { fill: '#ffffff', stroke: '#cbd5e1', label: 'Sano / Borrar', abbr: '', colorBase: 'neutral', isSymbol: false },

  // --- ROJOS (Patologías / Pendientes) ---
  caries:              { fill: 'transparent', stroke: '#dc2626', label: 'Caries', abbr: 'C', colorBase: 'red', isSymbol: true },
  caries_penetrante:   { fill: 'transparent', stroke: '#dc2626', label: 'Caries Penetrante', abbr: 'CP', colorBase: 'red', isSymbol: true },
  extraccion_indicada: { fill: 'transparent', stroke: '#dc2626', label: 'Exodoncia Ind.', abbr: 'X', colorBase: 'red', isSymbol: true },
  retenido:            { fill: 'transparent', stroke: '#dc2626', label: 'Retenido', abbr: 'Ret', colorBase: 'red', isSymbol: true },
  enfermedad_period:   { fill: 'transparent', stroke: '#dc2626', label: 'Enf. Periodontal', abbr: 'EP', colorBase: 'red', isSymbol: true },
  fractura:            { fill: 'transparent', stroke: '#dc2626', label: 'Fractura Dentaria', abbr: 'FD', colorBase: 'red', isSymbol: true },
  mal_posicion:        { fill: 'transparent', stroke: '#dc2626', label: 'Mal Posición', abbr: 'MPD', colorBase: 'red', isSymbol: true },
  fluorosis:           { fill: 'transparent', stroke: '#dc2626', label: 'Fluorosis', abbr: 'F', colorBase: 'red', isSymbol: true },
  mancha_blanca:       { fill: 'transparent', stroke: '#dc2626', label: 'Mancha Blanca', abbr: 'MB', colorBase: 'red', isSymbol: true },

  // --- AZULES (Tratamientos Realizados / Existentes) ---
  obturacion:          { fill: 'transparent', stroke: '#2563eb', label: 'Obturado', abbr: 'Do', colorBase: 'blue', isSymbol: true },
  ausente:             { fill: 'transparent', stroke: '#2563eb', label: 'Ausente', abbr: '=', colorBase: 'blue', isSymbol: true },
  corona:              { fill: 'transparent', stroke: '#2563eb', label: 'Corona', abbr: 'Co', colorBase: 'blue', isSymbol: true },
  pieza_puente:        { fill: 'transparent', stroke: '#2563eb', label: 'Pieza de Puente', abbr: 'PP', colorBase: 'blue', isSymbol: true },
  protesis_removible:  { fill: 'transparent', stroke: '#2563eb', label: 'Prót. Removible', abbr: 'Pr', colorBase: 'blue', isSymbol: true },
  incrustacion:        { fill: 'transparent', stroke: '#2563eb', label: 'Incrustación', abbr: 'Inc', colorBase: 'blue', isSymbol: true },
  perno_munon:         { fill: 'transparent', stroke: '#2563eb', label: 'Perno Muñón', abbr: 'PM', colorBase: 'blue', isSymbol: true },
  endodoncia:          { fill: 'transparent', stroke: '#2563eb', label: 'Trat. Conducto', abbr: 'TC', colorBase: 'blue', isSymbol: true },
  implante:            { fill: 'transparent', stroke: '#2563eb', label: 'Implante', abbr: 'Imp', colorBase: 'blue', isSymbol: true },
  sellador:            { fill: 'transparent', stroke: '#2563eb', label: 'Sellador', abbr: 'Se', colorBase: 'blue', isSymbol: true },
  surco_profundo:      { fill: 'transparent', stroke: '#2563eb', label: 'Surco Profundo', abbr: 'SP', colorBase: 'blue', isSymbol: true },
  hipoplasia:          { fill: 'transparent', stroke: '#2563eb', label: 'Hipoplasia', abbr: 'Hp', colorBase: 'blue', isSymbol: true },
  ortodoncia:          { fill: 'transparent', stroke: '#2563eb', label: 'Ortodoncia', abbr: 'Br', colorBase: 'blue', isSymbol: true },
}

const CUADRANTES = {
  Q1: [18,17,16,15,14,13,12,11], Q2: [21,22,23,24,25,26,27,28],
  Q3: [31,32,33,34,35,36,37,38], Q4: [48,47,46,45,44,43,42,41],
  Q5: [55,54,53,52,51], Q6: [61,62,63,64,65],
  Q7: [71,72,73,74,75], Q8: [85,84,83,82,81]
};

const SECCIONES = ['C', 'T', 'B', 'L', 'R'];

function BtnAtajo({ label, onClick, activo }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '6px 12px', borderRadius: 5, border: `1px solid ${activo ? '#94a3b8' : 'var(--border)'}`, background: activo ? '#f1f5f9' : 'var(--surface)', color: activo ? '#0f172a' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: 4 }}>
      {label}
    </button>
  )
}

function Pieza({ fdi, estados = {}, seleccionadas = {}, onClickPieza, onTogglePiezaEntera, soloLectura }) {
  const isSelected = (seccion) => !!seleccionadas[`${fdi}-${seccion}`];
  const isPiezaEnteraSelected = SECCIONES.every(sec => isSelected(sec));

  const getColor = (seccion) => {
    const id = `${fdi}-${seccion}`;
    if (seleccionadas[id]) {
      const colorObj = COLORES[seleccionadas[id]] || COLORES.sano;
      return { fill: colorObj.isSymbol ? '#f8fafc' : colorObj.fill, stroke: '#f59e0b', strokeWidth: 1.5 };
    } 
    const nombreEstado = estados[id] || 'sano';
    const colorGuardado = COLORES[nombreEstado] || COLORES.sano;
    return { fill: colorGuardado.isSymbol ? '#ffffff' : colorGuardado.fill, stroke: colorGuardado.isSymbol ? '#cbd5e1' : colorGuardado.stroke, strokeWidth: 1 };
  };

  const allStates = Array.from(new Set(SECCIONES.map(sec => seleccionadas[`${fdi}-${sec}`] || estados[`${fdi}-${sec}`]).filter(Boolean)));
  const symbols = allStates.filter(st => COLORES[st]?.isSymbol);

  const renderSymbols = () => {
    return symbols.map((sym, idx) => {
      const color = COLORES[sym].stroke;
      const abbr = COLORES[sym].abbr;
      const yPos = idx % 2 === 0 ? -38 - (idx*5) : 34 + (idx*5);
      
      if (sym === 'ausente') return (
        <g key={sym}>
          <line x1="-14" y1="-3" x2="14" y2="-3" stroke={color} strokeWidth="2.5" />
          <line x1="-14" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2.5" />
        </g>
      );
      if (sym === 'extraccion_indicada') return <path key={sym} d="M-14,-14 L14,14 M-14,14 L14,-14" stroke={color} strokeWidth="3" />;
      if (sym === 'corona') return <circle key={sym} cx="0" cy="0" r="16" stroke={color} strokeWidth="2.5" fill="none" />;
      if (sym === 'endodoncia') return <line key={sym} x1="0" y1="-18" x2="0" y2="18" stroke={color} strokeWidth="3" />;
      if (sym === 'ortodoncia') return <path key={sym} d="M-16,0 L16,0 M-10,-4 L-10,4 M0,-4 L0,4 M10,-4 L10,4" stroke={color} strokeWidth="2" fill="none" />;
      
      return <text key={sym} x="0" y={yPos} textAnchor="middle" fontSize={10} fontWeight="bold" fill={color}>{abbr}</text>;
    });
  };

  return (
    <g transform="translate(0,0)">
      {!soloLectura && (
        <g onClick={() => onTogglePiezaEntera(fdi)} style={{ cursor: 'pointer' }} transform="translate(0, -22)" className="no-print">
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill={isPiezaEnteraSelected ? '#f59e0b' : '#f1f5f9'} stroke={isPiezaEnteraSelected ? '#d97706' : '#cbd5e1'} strokeWidth="1"/>
          {isPiezaEnteraSelected && <path d="M-3,0 L-1,2 L4,-3" fill="none" stroke="white" strokeWidth="1.5" />}
        </g>
      )}
      <path d="M -10,-14 L 10,-14 A 14,14 0 0,1 14,-10 L 7,-7 L -7,-7 L -14,-10 A 14,14 0 0,1 -10,-14 Z" fill={getColor('T').fill} stroke={getColor('T').stroke} strokeWidth={getColor('T').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'T')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
      <path d="M -10,14 L 10,14 A 14,14 0 0,0 14,10 L 7,7 L -7,7 L -14,10 A 14,14 0 0,0 -10,14 Z" fill={getColor('B').fill} stroke={getColor('B').stroke} strokeWidth={getColor('B').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'B')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
      <path d="M -14,-10 A 14,14 0 0,0 -14,10 L -7,7 L -7,-7 Z" fill={getColor('L').fill} stroke={getColor('L').stroke} strokeWidth={getColor('L').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'L')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
      <path d="M 14,-10 A 14,14 0 0,1 14,10 L 7,7 L 7,-7 Z" fill={getColor('R').fill} stroke={getColor('R').stroke} strokeWidth={getColor('R').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'R')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
      <rect x="-7" y="-7" width="14" height="14" fill={getColor('C').fill} stroke={getColor('C').stroke} strokeWidth={getColor('C').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'C')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
      <g style={{ pointerEvents: 'none' }}>{renderSymbols()}</g>
      <text textAnchor="middle" y={30} fontSize={11} fill="#475569" fontWeight="600" fontFamily="system-ui">{fdi}</text>
    </g>
  )
}

export default function Odontograma({ modoInicial = 'ADULTO', estados = {}, seleccionadas = {}, onToggleSeccion, onSetSeleccionadas, soloLectura = false, pacienteNombre = "", pacienteDni = "" }) {
  const [modo, setModo] = useState(modoInicial);
  const [pincel, setPincel] = useState('caries');
  
  const printRef = useRef();
  const generarPDFodontograma = useReactToPrint({ content: () => printRef.current, documentTitle: `Odontograma_${pacienteNombre}` });

  const obtenerTodasLasCaras = (arrayPiezas) => arrayPiezas.flatMap(fdi => SECCIONES.map(sec => `${fdi}-${sec}`));

  const handleClickPieza = (fdi, seccion) => { 
    if (!soloLectura && onToggleSeccion) onToggleSeccion(`${fdi}-${seccion}`, pincel); 
  };
  
  const handleTogglePiezaEntera = (fdi) => {
    if (soloLectura) return;
    const carasDelDiente = SECCIONES.map(sec => `${fdi}-${sec}`);
    const todasMismoPincel = carasDelDiente.every(c => seleccionadas[c] === pincel);
    const nuevas = { ...seleccionadas };
    if (todasMismoPincel) carasDelDiente.forEach(c => delete nuevas[c]); 
    else carasDelDiente.forEach(c => nuevas[c] = pincel); 
    onSetSeleccionadas(nuevas);
  };

  const toggleCuadrante = (q) => {
    if (soloLectura) return;
    const carasCuadrante = obtenerTodasLasCaras(CUADRANTES[q]);
    const nuevas = { ...seleccionadas };
    if (carasCuadrante.every(cara => seleccionadas[cara] === pincel)) carasCuadrante.forEach(c => delete nuevas[c]);
    else carasCuadrante.forEach(c => nuevas[c] = pincel);
    onSetSeleccionadas(nuevas);
  };

  const dibujarFila = (piezas, startX, y, gap) => (
    piezas.map((fdi, i) => (
      <g key={fdi} transform={`translate(${startX + (i * gap)}, ${y})`}>
        <Pieza fdi={fdi} estados={estados} seleccionadas={seleccionadas} onClickPieza={soloLectura ? undefined : handleClickPieza} onTogglePiezaEntera={handleTogglePiezaEntera} soloLectura={soloLectura} />
      </g>
    ))
  );

  const generarResumenInteligente = () => {
    if (Object.keys(seleccionadas).length === 0) return null;
    const porEstado = {};
    Object.entries(seleccionadas).forEach(([idCara, estado]) => { if (!porEstado[estado]) porEstado[estado] = []; porEstado[estado].push(idCara); });
    const resumenes = [];
    const carasActivasTotal = obtenerTodasLasCaras([...CUADRANTES.Q1, ...CUADRANTES.Q2, ...CUADRANTES.Q3, ...CUADRANTES.Q4, ...CUADRANTES.Q5, ...CUADRANTES.Q6, ...CUADRANTES.Q7, ...CUADRANTES.Q8]);
    
    Object.entries(porEstado).forEach(([estado, caras]) => {
      const labelEstado = COLORES[estado]?.label || estado;
      if (carasActivasTotal.every(c => caras.includes(c))) { resumenes.push(`Boca entera: ${labelEstado}`); return; }
      
      let cuadrantesMarcados = [];
      ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'].forEach(q => {
          const carasQ = obtenerTodasLasCaras(CUADRANTES[q]);
          if (carasQ.length > 0 && carasQ.every(c => caras.includes(c))) { cuadrantesMarcados.push(q); caras = caras.filter(c => !carasQ.includes(c)); }
      });
      if (cuadrantesMarcados.length > 0) resumenes.push(`Cuadrante ${cuadrantesMarcados.join(', ')}: ${labelEstado}`);
      
      if (caras.length > 0) {
          const porDiente = {};
          caras.forEach(c => { const [fdi, sec] = c.split('-'); if (!porDiente[fdi]) porDiente[fdi] = []; porDiente[fdi].push(sec); });
          Object.entries(porDiente).forEach(([fdi, secciones]) => {
              if (secciones.length === 5) resumenes.push(`Pieza ${fdi} Completo: ${labelEstado}`);
              else resumenes.push(`Pieza ${fdi} (${secciones.join(', ')}): ${labelEstado}`);
          });
      }
    });
    return resumenes;
  };

  const resumenTextos = generarResumenInteligente();

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
      <style>{`@media print {.no-print { display: none !important; } .print-only { display: block !important; } .print-content { padding: 40px !important; }} .print-only { display: none; }`}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ADULTO', 'NINO', 'MIXTO'].map(m => (
            <button key={m} type="button" onClick={() => { setModo(m); onSetSeleccionadas({}); }} style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${modo === m ? '#94a3b8' : 'var(--border)'}`, background: modo === m ? '#f1f5f9' : 'var(--surface)', color: '#0f172a', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{m === 'ADULTO' ? 'Adulto' : m === 'NINO' ? 'Niño' : 'Mixto'}</button>
          ))}
        </div>
        {soloLectura && <button className="btn btn-secondary btn-sm" onClick={generarPDFodontograma} style={{ padding: '6px 12px' }}><Printer size={14} /> Generar Odontograma</button>}
      </div>

      <div ref={printRef} className="print-content">
        <div className="print-only" style={{ marginBottom: '30px', borderBottom: '2px solid #cbd5e1', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '22px', margin: 0 }}>Consentimiento y Plan de Tratamiento</h1>
          <p style={{ fontSize: '13px', color: '#475569' }}><strong>Paciente:</strong> {pacienteNombre} | <strong>DNI:</strong> {pacienteDni} | <strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', overflowX: 'auto' }}>
          <svg viewBox="0 0 700 320" style={{ width: '100%', maxWidth: 800 }}>
            <line x1="350" y1="10" x2="350" y2="310" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,4"/><line x1="10" y1="160" x2="690" y2="160" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,4"/>
            {(modo === 'ADULTO' || modo === 'MIXTO') && (<>{dibujarFila(CUADRANTES.Q1, 30, 50, 42)} {dibujarFila(CUADRANTES.Q2, 376, 50, 42)} {dibujarFila(CUADRANTES.Q4, 30, 260, 42)} {dibujarFila(CUADRANTES.Q3, 376, 260, 42)}</>)}
            {(modo === 'NINO' || modo === 'MIXTO') && (<>{dibujarFila(CUADRANTES.Q5, 156, modo === 'MIXTO' ? 115 : 50, 42)} {dibujarFila(CUADRANTES.Q6, 376, modo === 'MIXTO' ? 115 : 50, 42)} {dibujarFila(CUADRANTES.Q8, 156, modo === 'MIXTO' ? 195 : 260, 42)} {dibujarFila(CUADRANTES.Q7, 376, modo === 'MIXTO' ? 195 : 260, 42)}</>)}
          </svg>
          {!soloLectura && (
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', width: 130 }}>
              <BtnAtajo label="Boca entera" onClick={() => { const t = obtenerTodasLasCaras([...CUADRANTES.Q1, ...CUADRANTES.Q2, ...CUADRANTES.Q3, ...CUADRANTES.Q4, ...CUADRANTES.Q5, ...CUADRANTES.Q6, ...CUADRANTES.Q7, ...CUADRANTES.Q8]); if (t.every(c => seleccionadas[c] === pincel)) onSetSeleccionadas({}); else { const n = {...seleccionadas}; t.forEach(c => n[c] = pincel); onSetSeleccionadas(n); } }} />
              {['Q1','Q2','Q4','Q3'].map(q => <BtnAtajo key={q} label={`Cuadrante ${q}`} onClick={() => toggleCuadrante(q)} />)}
              <button type="button" onClick={() => setPincel('sano')} style={{ marginTop: 10, padding: '6px', borderRadius: 4, border: '1px solid #cbd5e1', background: pincel === 'sano' ? '#e2e8f0' : '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>BORRAR PIEZA</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: 12, background: '#f8fafc', borderLeft: '4px solid #3b82f6', borderRadius: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Resumen de selección: </div>
            <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: 12 }}>{resumenTextos?.map((txt, i) => <li key={i}>{txt}</li>)}</ul>
          </div>
          
          <div style={{ padding: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Paleta de Referencias {soloLectura ? '' : '(Seleccionar Pincel)'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Pendiente (Rojo)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(COLORES).filter(([_, v]) => v.colorBase === 'red').map(([k, v]) => (
                    <button key={k} type="button" disabled={soloLectura} onClick={() => setPincel(k)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 3, background: pincel === k ? '#dc2626' : '#fef2f2', color: pincel === k ? '#fff' : '#1e293b', border: `1px solid ${pincel === k ? '#b91c1c' : '#fca5a5'}`, fontSize: 10, cursor: soloLectura ? 'default' : 'pointer' }}><strong>[{v.abbr}]</strong> {v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>Realizado (Azul)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(COLORES).filter(([_, v]) => v.colorBase === 'blue').map(([k, v]) => (
                    <button key={k} type="button" disabled={soloLectura} onClick={() => setPincel(k)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 3, background: pincel === k ? '#2563eb' : '#eff6ff', color: pincel === k ? '#fff' : '#1e293b', border: `1px solid ${pincel === k ? '#1d4ed8' : '#93c5fd'}`, fontSize: 10, cursor: soloLectura ? 'default' : 'pointer' }}><strong>[{v.abbr}]</strong> {v.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-only" style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: '12px' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>Firma del Paciente</div>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>Firma del Profesional</div>
        </div>
      </div>
    </div>
  )
}

export { COLORES };