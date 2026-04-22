import React, { useState } from 'react';

const COLORES = {
  sano:                { fill: '#ffffff', stroke: '#cbd5e1', label: 'Sano / Borrar', abbr: '', colorBase: 'neutral', isSymbol: false },
  caries:              { fill: 'transparent', stroke: '#dc2626', label: 'Caries', abbr: 'C', colorBase: 'red', isSymbol: true },
  caries_penetrante:   { fill: 'transparent', stroke: '#dc2626', label: 'Caries Penetrante', abbr: 'CP', colorBase: 'red', isSymbol: true },
  extraccion_indicada: { fill: 'transparent', stroke: '#dc2626', label: 'Exodoncia Ind.', abbr: 'X', colorBase: 'red', isSymbol: true },
  retenido:            { fill: 'transparent', stroke: '#dc2626', label: 'Retenido', abbr: 'Ret', colorBase: 'red', isSymbol: true },
  enfermedad_period:   { fill: 'transparent', stroke: '#dc2626', label: 'Enf. Periodontal', abbr: 'EP', colorBase: 'red', isSymbol: true },
  fractura:            { fill: 'transparent', stroke: '#dc2626', label: 'Fractura Dentaria', abbr: 'FD', colorBase: 'red', isSymbol: true },
  mal_posicion:        { fill: 'transparent', stroke: '#dc2626', label: 'Mal Posición', abbr: 'MPD', colorBase: 'red', isSymbol: true },
  fluorosis:           { fill: 'transparent', stroke: '#dc2626', label: 'Fluorosis', abbr: 'F', colorBase: 'red', isSymbol: true },
  mancha_blanca:       { fill: 'transparent', stroke: '#dc2626', label: 'Mancha Blanca', abbr: 'MB', colorBase: 'red', isSymbol: true },
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
  const carasEstados = SECCIONES.map(sec => seleccionadas[`${fdi}-${sec}`] || estados[`${fdi}-${sec}`] || 'sano');
  const estadoPiezaCompleta = carasEstados.every(v => v === carasEstados[0] && v !== 'sano') ? carasEstados[0] : null;
  const isPiezaEnteraSelected = SECCIONES.every(sec => !!seleccionadas[`${fdi}-${sec}`]);

  const getProps = (seccion) => {
    const id = `${fdi}-${seccion}`;
    if (seleccionadas[id]) {
      const c = COLORES[seleccionadas[id]] || COLORES.sano;
      return { fill: c.isSymbol ? '#f8fafc' : c.fill, stroke: '#f59e0b', strokeWidth: 1.5 };
    } 
    const st = estados[id] || 'sano';
    const c = COLORES[st] || COLORES.sano;
    return { fill: c.isSymbol ? '#ffffff' : c.fill, stroke: c.isSymbol ? '#cbd5e1' : c.stroke, strokeWidth: 1 };
  };

  const allStates = Array.from(new Set(carasEstados.filter(st => st !== 'sano')));
  const symbols = allStates.filter(st => COLORES[st]?.isSymbol);

  const renderSymbols = () => {
    return symbols.map((sym) => {
      if (!COLORES[sym]) return null;
      
      const color = COLORES[sym].stroke;
      if (sym === 'ausente') return (
        <g key={sym}>
          <line x1="-18" y1="-5" x2="18" y2="-5" stroke={color} strokeWidth="3" />
          <line x1="-18" y1="5" x2="18" y2="5" stroke={color} strokeWidth="3" />
        </g>
      );
      if (sym === 'extraccion_indicada') return <path key={sym} d="M-18,-18 L18,18 M-18,18 L18,-18" stroke={color} strokeWidth="2.5" />;
      if (sym === 'corona') return <circle key={sym} cx="0" cy="0" r="19" stroke={color} strokeWidth="2" fill="none" />;
      if (sym === 'endodoncia') return <line key={sym} x1="0" y1="-22" x2="0" y2="22" stroke={color} strokeWidth="2.5" />;
      if (sym === 'ortodoncia') return <path key={sym} d="M-18,0 L18,0 M-10,-5 L-10,5 M0,-5 L0,5 M10,-5 L10,5" stroke={color} strokeWidth="2" fill="none" />;
      
      if (estadoPiezaCompleta === sym) {
        return (
          <text 
            key={sym} x="0" y="-24" 
            textAnchor="middle" dominantBaseline="middle" 
            fontSize="9" fontWeight="900" fill={color}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {COLORES[sym].abbr}
          </text>
        );
      }
      return null;
    });
  };

  const renderInsideText = (sec, cx, cy) => {
    if (estadoPiezaCompleta) return null;
    const id = `${fdi}-${sec}`;
    const st = seleccionadas[id] || estados[id] || 'sano';
    if (st === 'sano') return null;

    const colorObj = COLORES[st];
    if (!colorObj) return null;
    

    if (colorObj.isSymbol) return null;

    return (
      <text 
        x={cx} y={cy} 
        dominantBaseline="middle" textAnchor="middle" 
        fontSize="7.5" fontWeight="900" fill={colorObj.stroke} 
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {colorObj.abbr}
      </text>
    );
  };

  return (
    <g transform="translate(0,0)">
      {!soloLectura && (
        <g onClick={() => onTogglePiezaEntera(fdi)} style={{ cursor: 'pointer' }} transform="translate(0, -38)">
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill={isPiezaEnteraSelected ? '#f59e0b' : '#f1f5f9'} stroke={isPiezaEnteraSelected ? '#d97706' : '#cbd5e1'} strokeWidth="1"/>
          {isPiezaEnteraSelected && <path d="M-3,0 L-1,2 L4,-3" fill="none" stroke="white" strokeWidth="1.5" />}
        </g>
      )}

      {/* PUNTO DE EQUILIBRIO: Escala 1.35 */}
      <g transform="scale(1.35)">
        <path d="M -10,-14 L 10,-14 A 14,14 0 0,1 14,-10 L 7,-7 L -7,-7 L -14,-10 A 14,14 0 0,1 -10,-14 Z" fill={getProps('T').fill} stroke={getProps('T').stroke} strokeWidth={getProps('T').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'T')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
        <path d="M -10,14 L 10,14 A 14,14 0 0,0 14,10 L 7,7 L -7,7 L -14,10 A 14,14 0 0,0 -10,14 Z" fill={getProps('B').fill} stroke={getProps('B').stroke} strokeWidth={getProps('B').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'B')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
        <path d="M -14,-10 A 14,14 0 0,0 -14,10 L -7,7 L -7,-7 Z" fill={getProps('L').fill} stroke={getProps('L').stroke} strokeWidth={getProps('L').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'L')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
        <path d="M 14,-10 A 14,14 0 0,1 14,10 L 7,7 L 7,-7 Z" fill={getProps('R').fill} stroke={getProps('R').stroke} strokeWidth={getProps('R').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'R')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />
        <rect x="-7" y="-7" width="14" height="14" fill={getProps('C').fill} stroke={getProps('C').stroke} strokeWidth={getProps('C').strokeWidth} onClick={() => onClickPieza && onClickPieza(fdi, 'C')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }} />

        {renderInsideText('T', 0, -10.5)}
        {renderInsideText('B', 0, 10.5)}
        {renderInsideText('L', -10.5, 0)}
        {renderInsideText('R', 10.5, 0)}
        {renderInsideText('C', 0, 0)}

        <g style={{ pointerEvents: 'none' }}>{renderSymbols()}</g>
      </g>

      <text textAnchor="middle" y={40} fontSize={13} fill="#475569" fontWeight="700" fontFamily="system-ui">{fdi}</text>
    </g>
  )
}

export default function Odontograma({ modoInicial = 'ADULTO', estados = {}, seleccionadas = {}, onToggleSeccion, onSetSeleccionadas, soloLectura = false }) {
  const [modo, setModo] = useState(modoInicial);
  const [pincel, setPincel] = useState('caries');

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
  
  // MARGEN MATEMÁTICO EXACTO para escala 1.35
  const gap = 50; 

  return (
    <div style={{ background: '#fff', padding: soloLectura ? '0' : '20px', borderRadius: '8px' }}>
      {!soloLectura && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: 20, justifyContent: 'center' }}>
          {['ADULTO', 'NINO', 'MIXTO'].map(m => (
            <button key={m} type="button" onClick={() => { setModo(m); onSetSeleccionadas({}); }} style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${modo === m ? '#94a3b8' : 'var(--border)'}`, background: modo === m ? '#f1f5f9' : 'var(--surface)', color: '#0f172a', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{m === 'ADULTO' ? 'Adulto' : m === 'NINO' ? 'Niño' : 'Mixto'}</button>
          ))}
        </div>
      )}

      {/* SVG CON LIENZO RE-CALCULADO A 860px (Equilibrio) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', overflowX: 'auto' }}>
        <svg viewBox="0 0 860 400" style={{ width: '100%', maxWidth: soloLectura ? '100%' : 900 }}>
          {/* Líneas divisorias exactas en el centro */}
          <line x1="430" y1="10" x2="430" y2="390" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,4"/>
          <line x1="20" y1="200" x2="840" y2="200" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,4"/>
          
          {(modo === 'ADULTO' || modo === 'MIXTO') && (<>
            {dibujarFila(CUADRANTES.Q1, 55, modo === 'MIXTO' ? 70 : 100, gap)}  
            {dibujarFila(CUADRANTES.Q2, 455, modo === 'MIXTO' ? 70 : 100, gap)} 
            {dibujarFila(CUADRANTES.Q4, 55, modo === 'MIXTO' ? 330 : 300, gap)} 
            {dibujarFila(CUADRANTES.Q3, 455, modo === 'MIXTO' ? 330 : 300, gap)}
          </>)}
          
          {(modo === 'NINO' || modo === 'MIXTO') && (<>
            {dibujarFila(CUADRANTES.Q5, 205, modo === 'MIXTO' ? 140 : 100, gap)} 
            {dibujarFila(CUADRANTES.Q6, 455, modo === 'MIXTO' ? 140 : 100, gap)} 
            {dibujarFila(CUADRANTES.Q8, 205, modo === 'MIXTO' ? 260 : 300, gap)} 
            {dibujarFila(CUADRANTES.Q7, 455, modo === 'MIXTO' ? 260 : 300, gap)}
          </>)}
        </svg>

        {!soloLectura && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', width: 130 }}>
            <BtnAtajo label="Boca entera" onClick={() => { const t = obtenerTodasLasCaras([...CUADRANTES.Q1, ...CUADRANTES.Q2, ...CUADRANTES.Q3, ...CUADRANTES.Q4, ...CUADRANTES.Q5, ...CUADRANTES.Q6, ...CUADRANTES.Q7, ...CUADRANTES.Q8]); if (t.every(c => seleccionadas[c] === pincel)) onSetSeleccionadas({}); else { const n = {...seleccionadas}; t.forEach(c => n[c] = pincel); onSetSeleccionadas(n); } }} />
            {['Q1','Q2','Q4','Q3'].map(q => <BtnAtajo key={q} label={`Cuadrante ${q}`} onClick={() => toggleCuadrante(q)} />)}
            <button type="button" onClick={() => setPincel('sano')} style={{ marginTop: 10, padding: '6px', borderRadius: 4, border: '1px solid #cbd5e1', background: pincel === 'sano' ? '#e2e8f0' : '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>BORRAR PIEZA</button>
          </div>
        )}
      </div>

      {!soloLectura && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: 12, background: '#f8fafc', borderLeft: '4px solid #3b82f6', borderRadius: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Resumen de selección: </div>
            <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: 12, minHeight: '60px' }}>{resumenTextos?.map((txt, i) => <li key={i}>{txt}</li>)}</ul>
          </div>
          
          <div style={{ padding: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Paleta de Referencias</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Pendiente (Rojo)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(COLORES).filter(([_, v]) => v.colorBase === 'red').map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setPincel(k)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 3, background: pincel === k ? '#dc2626' : '#fef2f2', color: pincel === k ? '#fff' : '#1e293b', border: `1px solid ${pincel === k ? '#b91c1c' : '#fca5a5'}`, fontSize: 10, cursor: 'pointer', transition: 'all 0.2s' }}><strong>[{v.abbr}]</strong> {v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>Realizado (Azul)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(COLORES).filter(([_, v]) => v.colorBase === 'blue').map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setPincel(k)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 3, background: pincel === k ? '#2563eb' : '#eff6ff', color: pincel === k ? '#fff' : '#1e293b', border: `1px solid ${pincel === k ? '#1d4ed8' : '#93c5fd'}`, fontSize: 10, cursor: 'pointer', transition: 'all 0.2s' }}><strong>[{v.abbr}]</strong> {v.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { COLORES };