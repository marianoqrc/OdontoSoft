import React, { useState } from 'react';

const COLORES = {
  sano:                { fill: '#ffffff', stroke: '#94a3b8', label: 'Sano' },
  caries:              { fill: '#fecaca', stroke: '#dc2626', label: 'Caries' },
  obturacion:          { fill: '#bfdbfe', stroke: '#2563eb', label: 'Obturación' },
  corona:              { fill: '#bbf7d0', stroke: '#15803d', label: 'Corona' },
  ausente:             { fill: '#e2e8f0', stroke: '#64748b', label: 'Ausente' },
  endodoncia:          { fill: '#e9d5ff', stroke: '#7c3aed', label: 'Endodoncia' },
  protesis:            { fill: '#fed7aa', stroke: '#c2410c', label: 'Prótesis' },
  implante:            { fill: '#a7f3d0', stroke: '#047857', label: 'Implante' },
  extraccion_indicada: { fill: '#fef08a', stroke: '#ca8a04', label: 'Extracción ind.' },
}

const CUADRANTES_ADULTO = {
  Q1: [18,17,16,15,14,13,12,11],
  Q2: [21,22,23,24,25,26,27,28],
  Q3: [31,32,33,34,35,36,37,38],
  Q4: [41,42,43,44,45,46,47,48],
}

const CUADRANTES_NINO = {
  Q5: [55,54,53,52,51],
  Q6: [61,62,63,64,65],
  Q7: [71,72,73,74,75],
  Q8: [85,84,83,82,81],
}

const SECCIONES = ['C', 'T', 'B', 'L', 'R'];

function BtnAtajo({ label, onClick, activo }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 5,
        border: `1.5px solid ${activo ? '#d4a5a5' : 'var(--border)'}`,
        background: activo ? '#fcf6f6' : 'var(--surface)',
        color: activo ? '#c49090' : 'var(--text2)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function Pieza({ fdi, estados = {}, seleccionadas = [], onClickPieza }) {
  const isSelected = (seccion) => seleccionadas.includes(`${fdi}-${seccion}`);
  
  const getColor = (seccion) => {
    if (isSelected(seccion)) return { fill: '#fef3c7', stroke: '#f59e0b' }; 
    const nombreEstado = estados[`${fdi}-${seccion}`] || 'sano';
    return COLORES[nombreEstado] || COLORES.sano;
  };

  return (
    <g transform="translate(0,0)">
      {/* Top */}
      <path 
        d="M -10,-14 L 10,-14 A 14,14 0 0,1 14,-10 L 7,-7 L -7,-7 L -14,-10 A 14,14 0 0,1 -10,-14 Z" 
        fill={getColor('T').fill} stroke={getColor('T').stroke} strokeWidth="1.5"
        onClick={() => onClickPieza && onClickPieza(fdi, 'T')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      {/* Bottom */}
      <path 
        d="M -10,14 L 10,14 A 14,14 0 0,0 14,10 L 7,7 L -7,7 L -14,10 A 14,14 0 0,0 -10,14 Z" 
        fill={getColor('B').fill} stroke={getColor('B').stroke} strokeWidth="1.5"
        onClick={() => onClickPieza && onClickPieza(fdi, 'B')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      {/* Left */}
      <path 
        d="M -14,-10 A 14,14 0 0,0 -14,10 L -7,7 L -7,-7 Z" 
        fill={getColor('L').fill} stroke={getColor('L').stroke} strokeWidth="1.5"
        onClick={() => onClickPieza && onClickPieza(fdi, 'L')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      {/* Right */}
      <path 
        d="M 14,-10 A 14,14 0 0,1 14,10 L 7,7 L 7,-7 Z" 
        fill={getColor('R').fill} stroke={getColor('R').stroke} strokeWidth="1.5"
        onClick={() => onClickPieza && onClickPieza(fdi, 'R')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      {/* Center */}
      <rect 
        x="-7" y="-7" width="14" height="14" 
        fill={getColor('C').fill} stroke={getColor('C').stroke} strokeWidth="1.5"
        onClick={() => onClickPieza && onClickPieza(fdi, 'C')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      
      <text textAnchor="middle" y={30} fontSize={11} fill="#475569" fontWeight="600" fontFamily="system-ui">
        {fdi}
      </text>
    </g>
  )
}

export default function Odontograma({ modoInicial = 'ADULTO', estados = {}, seleccionadas = [], onToggleSeccion, onSetSeleccionadas, soloLectura = false }) {
  const [modo, setModo] = useState(modoInicial);

  const handleClickPieza = (fdi, seccion) => {
    if (!soloLectura && onToggleSeccion) {
      onToggleSeccion(`${fdi}-${seccion}`);
    }
  };

  const obtenerTodasLasCaras = (arrayPiezas) => {
    let caras = [];
    arrayPiezas.forEach(fdi => {
      SECCIONES.forEach(sec => caras.push(`${fdi}-${sec}`));
    });
    return caras;
  };

  const getPiezasActivas = () => {
    let activas = [];
    if (modo === 'ADULTO' || modo === 'MIXTO') {
      activas = [...activas, ...CUADRANTES_ADULTO.Q1, ...CUADRANTES_ADULTO.Q2, ...CUADRANTES_ADULTO.Q3, ...CUADRANTES_ADULTO.Q4];
    }
    if (modo === 'NINO' || modo === 'MIXTO') {
      activas = [...activas, ...CUADRANTES_NINO.Q5, ...CUADRANTES_NINO.Q6, ...CUADRANTES_NINO.Q7, ...CUADRANTES_NINO.Q8];
    }
    return activas;
  };

  const cuadranteActivo = (q) => {
    const map = { ...CUADRANTES_ADULTO, ...CUADRANTES_NINO };
    const carasCuadrante = obtenerTodasLasCaras(map[q]);
    return carasCuadrante.every(cara => seleccionadas.includes(cara));
  };

  const toggleCuadrante = (q) => {
    if (soloLectura) return;
    const map = { ...CUADRANTES_ADULTO, ...CUADRANTES_NINO };
    const carasCuadrante = obtenerTodasLasCaras(map[q]);
    
    if (cuadranteActivo(q)) {
      onSetSeleccionadas(seleccionadas.filter(p => !carasCuadrante.includes(p)));
    } else {
      const nuevas = carasCuadrante.filter(p => !seleccionadas.includes(p));
      onSetSeleccionadas([...seleccionadas, ...nuevas]);
    }
  };

  const seleccionarTodo = () => {
    if (soloLectura) return;
    const todasLasCaras = obtenerTodasLasCaras(getPiezasActivas());
    if (seleccionadas.length === todasLasCaras.length) {
      onSetSeleccionadas([]);
    } else {
      onSetSeleccionadas(todasLasCaras);
    }
  };

  const renderSelectorModo = () => {
    if (soloLectura) return null; 
    
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
        {['ADULTO', 'NINO', 'MIXTO'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setModo(m); onSetSeleccionadas([]); }} 
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: `1px solid ${modo === m ? '#d4a5a5' : 'var(--border)'}`,
              background: modo === m ? '#fcf6f6' : 'var(--surface)',
              color: modo === m ? '#c49090' : 'var(--text2)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {m === 'ADULTO' ? 'Adulto' : m === 'NINO' ? 'Niño (Temporal)' : 'Mixto'}
          </button>
        ))}
      </div>
    )
  };

  const dibujarFila = (piezas, startX, y, gap) => (
    piezas.map((fdi, i) => (
      <g key={fdi} transform={`translate(${startX + (i * gap)}, ${y})`}>
        <Pieza 
          fdi={fdi} 
          estados={estados}
          seleccionadas={seleccionadas}
          onClickPieza={soloLectura ? undefined : handleClickPieza}
        />
      </g>
    ))
  );

  const cuadrantesVisibles = [];
  if (modo === 'ADULTO' || modo === 'MIXTO') cuadrantesVisibles.push('Q1', 'Q2', 'Q4', 'Q3');
  if (modo === 'NINO' || modo === 'MIXTO') cuadrantesVisibles.push('Q5', 'Q6', 'Q8', 'Q7');

  return (
    <div>
      {renderSelectorModo()}
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', overflowX: 'auto', paddingBottom: '10px' }}>
        
        <svg viewBox="0 0 700 320" style={{ width: '100%', maxWidth: 800 }}>
          <line x1="350" y1="10" x2="350" y2="310" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,4"/>
          <line x1="10" y1="160" x2="690" y2="160" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,4"/>

          {(modo === 'ADULTO' || modo === 'MIXTO') && (
            <>
              {dibujarFila(CUADRANTES_ADULTO.Q1, 30, 50, 42)}
              {dibujarFila(CUADRANTES_ADULTO.Q2, 376, 50, 42)}
              {dibujarFila(CUADRANTES_ADULTO.Q4, 30, 260, 42)}
              {dibujarFila(CUADRANTES_ADULTO.Q3, 376, 260, 42)}
            </>
          )}

          {(modo === 'NINO' || modo === 'MIXTO') && (
            <>
              {dibujarFila(CUADRANTES_NINO.Q5, 156, modo === 'MIXTO' ? 115 : 50, 42)}
              {dibujarFila(CUADRANTES_NINO.Q6, 376, modo === 'MIXTO' ? 115 : 50, 42)}
              {dibujarFila(CUADRANTES_NINO.Q8, 156, modo === 'MIXTO' ? 195 : 260, 42)}
              {dibujarFila(CUADRANTES_NINO.Q7, 376, modo === 'MIXTO' ? 195 : 260, 42)}
            </>
          )}
        </svg>

        {!soloLectura && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '12px 16px', background: 'var(--surface2)',
            borderRadius: 8, border: '1px solid var(--border)',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 2 }}>
              ATAJOS
            </div>
            <BtnAtajo
              label="Boca entera"
              activo={seleccionadas.length > 0 && seleccionadas.length === obtenerTodasLasCaras(getPiezasActivas()).length}
              onClick={seleccionarTodo}
            />
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }}/>
            {cuadrantesVisibles.map(q => (
              <BtnAtajo
                key={q}
                label={`Cuadrante ${q}`}
                activo={cuadranteActivo(q)}
                onClick={() => toggleCuadrante(q)}
              />
            ))}
          </div>
        )}

      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
        {Object.entries(COLORES).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: val.fill, border: `1.5px solid ${val.stroke}` }}/>
            <span style={{ color: 'var(--text2)' }}>{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { COLORES }