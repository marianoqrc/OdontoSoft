import React, { useState } from 'react';

// PALETA SIMPLIFICADA Y CON ORTODONCIA
const COLORES = {
  sano:                { fill: '#ffffff', stroke: '#94a3b8', label: 'Sano' },
  caries:              { fill: '#fecaca', stroke: '#dc2626', label: 'Caries' },
  obturacion:          { fill: '#bfdbfe', stroke: '#2563eb', label: 'Obturación' },
  corona:              { fill: '#bbf7d0', stroke: '#15803d', label: 'Corona' },
  ausente:             { fill: '#e2e8f0', stroke: '#64748b', label: 'Ausente' },
  extraccion_indicada: { fill: '#fef08a', stroke: '#ca8a04', label: 'Extracción ind.' },
  ortodoncia:          { fill: '#e9d5ff', stroke: '#9333ea', label: 'Ortodoncia' },
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
        border: `1px solid ${activo ? '#d4a5a5' : 'var(--border)'}`,
        background: activo ? '#fcf6f6' : 'var(--surface)',
        color: activo ? '#c49090' : 'var(--text2)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all .15s',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        width: '100%',
      }}
    >
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
      return { fill: colorObj.fill, stroke: '#f59e0b', strokeWidth: 1.5 };
    } 
    
    const nombreEstado = estados[id] || 'sano';
    const colorGuardado = COLORES[nombreEstado] || COLORES.sano;
    return { fill: colorGuardado.fill, stroke: colorGuardado.stroke, strokeWidth: 1 };
  };

  return (
    <g transform="translate(0,0)">
      
      {!soloLectura && (
        <g 
          onClick={() => onTogglePiezaEntera(fdi)} 
          style={{ cursor: 'pointer' }}
          transform="translate(0, -22)"
        >
          <rect 
            x="-6" y="-6" width="12" height="12" rx="2"
            fill={isPiezaEnteraSelected ? '#f59e0b' : '#f1f5f9'}
            stroke={isPiezaEnteraSelected ? '#d97706' : '#cbd5e1'}
            strokeWidth="1"
          />
          {isPiezaEnteraSelected && (
            <path d="M-3,0 L-1,2 L4,-3" fill="none" stroke="white" strokeWidth="1.5" />
          )}
        </g>
      )}

      <path 
        d="M -10,-14 L 10,-14 A 14,14 0 0,1 14,-10 L 7,-7 L -7,-7 L -14,-10 A 14,14 0 0,1 -10,-14 Z" 
        fill={getColor('T').fill} stroke={getColor('T').stroke} strokeWidth={getColor('T').strokeWidth}
        onClick={() => onClickPieza && onClickPieza(fdi, 'T')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      <path 
        d="M -10,14 L 10,14 A 14,14 0 0,0 14,10 L 7,7 L -7,7 L -14,10 A 14,14 0 0,0 -10,14 Z" 
        fill={getColor('B').fill} stroke={getColor('B').stroke} strokeWidth={getColor('B').strokeWidth}
        onClick={() => onClickPieza && onClickPieza(fdi, 'B')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      <path 
        d="M -14,-10 A 14,14 0 0,0 -14,10 L -7,7 L -7,-7 Z" 
        fill={getColor('L').fill} stroke={getColor('L').stroke} strokeWidth={getColor('L').strokeWidth}
        onClick={() => onClickPieza && onClickPieza(fdi, 'L')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      <path 
        d="M 14,-10 A 14,14 0 0,1 14,10 L 7,7 L 7,-7 Z" 
        fill={getColor('R').fill} stroke={getColor('R').stroke} strokeWidth={getColor('R').strokeWidth}
        onClick={() => onClickPieza && onClickPieza(fdi, 'R')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      <rect 
        x="-7" y="-7" width="14" height="14" 
        fill={getColor('C').fill} stroke={getColor('C').stroke} strokeWidth={getColor('C').strokeWidth}
        onClick={() => onClickPieza && onClickPieza(fdi, 'C')} style={{ cursor: onClickPieza ? 'pointer' : 'default' }}
      />
      
      <text textAnchor="middle" y={30} fontSize={11} fill="#475569" fontWeight="600" fontFamily="system-ui">
        {fdi}
      </text>
    </g>
  )
}

export default function Odontograma({ modoInicial = 'ADULTO', estados = {}, seleccionadas = {}, onToggleSeccion, onSetSeleccionadas, soloLectura = false }) {
  const [modo, setModo] = useState(modoInicial);
  const [pincel, setPincel] = useState('caries');

  const handleClickPieza = (fdi, seccion) => {
    if (!soloLectura && onToggleSeccion) {
      onToggleSeccion(`${fdi}-${seccion}`, pincel); 
    }
  };

  const handleTogglePiezaEntera = (fdi) => {
    if (soloLectura) return;
    const carasDelDiente = SECCIONES.map(sec => `${fdi}-${sec}`);
    const todasMismoPincel = carasDelDiente.every(c => seleccionadas[c] === pincel);
    
    const nuevas = { ...seleccionadas };
    if (todasMismoPincel) {
      carasDelDiente.forEach(c => delete nuevas[c]); 
    } else {
      carasDelDiente.forEach(c => nuevas[c] = pincel); 
    }
    onSetSeleccionadas(nuevas);
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
    return carasCuadrante.every(cara => seleccionadas[cara] === pincel);
  };

  const toggleCuadrante = (q) => {
    if (soloLectura) return;
    const map = { ...CUADRANTES_ADULTO, ...CUADRANTES_NINO };
    const carasCuadrante = obtenerTodasLasCaras(map[q]);
    const nuevas = { ...seleccionadas };
    
    if (cuadranteActivo(q)) {
      carasCuadrante.forEach(c => delete nuevas[c]);
    } else {
      carasCuadrante.forEach(c => nuevas[c] = pincel);
    }
    onSetSeleccionadas(nuevas);
  };

  const seleccionarTodo = () => {
    if (soloLectura) return;
    const todasLasCaras = obtenerTodasLasCaras(getPiezasActivas());
    const todoPintado = todasLasCaras.every(c => seleccionadas[c] === pincel);
    
    const nuevas = { ...seleccionadas };
    if (todoPintado) {
      todasLasCaras.forEach(c => delete nuevas[c]);
    } else {
      todasLasCaras.forEach(c => nuevas[c] = pincel);
    }
    onSetSeleccionadas(nuevas);
  };

  const renderSelectorModo = () => {
    if (soloLectura) return null; 
    
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', justifyContent: 'center' }}>
        {['ADULTO', 'NINO', 'MIXTO'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setModo(m); onSetSeleccionadas({}); }} 
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
          onTogglePiezaEntera={handleTogglePiezaEntera}
          soloLectura={soloLectura}
        />
      </g>
    ))
  );

  const cuadrantesVisibles = [];
  if (!soloLectura) {
    if (modo === 'ADULTO' || modo === 'MIXTO') cuadrantesVisibles.push('Q1', 'Q2', 'Q4', 'Q3');
    if (modo === 'NINO' || modo === 'MIXTO') cuadrantesVisibles.push('Q5', 'Q6', 'Q8', 'Q7');
  }

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
            minWidth: 100,
            maxWidth: 140, 
            flexShrink: 0, 
            height: 'fit-content'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 2 }}>
              ATAJOS
            </div>
            <BtnAtajo
              label="Boca entera"
              activo={Object.keys(seleccionadas).length > 0 && obtenerTodasLasCaras(getPiezasActivas()).every(c => seleccionadas[c] === pincel)}
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
        {Object.entries(COLORES).map(([key, val]) => {
          const isActivo = pincel === key;

          if (soloLectura) {
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: val.fill, border: `1.5px solid ${val.stroke}` }}/>
                <span style={{ color: 'var(--text2)' }}>{val.label}</span>
              </div>
            )
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => setPincel(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                background: isActivo ? val.fill : 'var(--surface)',
                border: `1.5px solid ${isActivo ? val.stroke : 'var(--border)'}`,
                color: isActivo ? '#000' : 'var(--text2)',
                fontWeight: isActivo ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActivo ? `0 0 0 2px #fff, 0 0 0 4px ${val.stroke}` : 'none', 
                outline: 'none'
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: val.fill, border: `1.5px solid ${val.stroke}` }}/>
              <span style={{ fontSize: 12 }}>{val.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { COLORES }