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

const CUADRANTES = {
  Q1: [18,17,16,15,14,13,12,11],
  Q2: [21,22,23,24,25,26,27,28],
  Q3: [31,32,33,34,35,36,37,38],
  Q4: [41,42,43,44,45,46,47,48],
}

const SUPERIORES = [...CUADRANTES.Q1, ...CUADRANTES.Q2]
const INFERIORES = [
  48,47,46,45,44,43,42,41,
  31,32,33,34,35,36,37,38
]
const TODAS = [...SUPERIORES, ...INFERIORES]

function Pieza({ fdi, estado = 'sano', seleccionada, onClick }) {
  const { fill, stroke } = COLORES[estado] || COLORES.sano
  const esMolar = [6, 7, 8].includes(fdi % 10)
  const w = esMolar ? 26 : 20
  const h = esMolar ? 26 : 20

  return (
    <g onClick={() => onClick(fdi)} style={{ cursor: 'pointer' }}>
      <rect
        x={-w/2} y={-h/2} width={w} height={h}
        rx={esMolar ? 4 : 10}
        fill={fill}
        stroke={seleccionada ? '#f59e0b' : stroke}
        strokeWidth={seleccionada ? 2.5 : 1.5}
        style={{ transition: 'stroke .1s' }}
      />
      {estado === 'ausente' && <>
        <line x1={-6} y1={-6} x2={6} y2={6} stroke={stroke} strokeWidth={1.5}/>
        <line x1={6} y1={-6} x2={-6} y2={6} stroke={stroke} strokeWidth={1.5}/>
      </>}
      <text textAnchor="middle" y={h/2+12} fontSize={8} fill="#64748b" fontFamily="system-ui">
        {fdi}
      </text>
    </g>
  )
}

function BtnAtajo({ label, onClick, activo }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: 5,
        border: `1.5px solid ${activo ? '#f59e0b' : 'var(--border)'}`,
        background: activo ? '#fef3c7' : 'var(--surface)',
        color: activo ? '#92400e' : 'var(--text2)',
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

export default function Odontograma({ estados = {}, seleccionadas = [], onToggle, onSetSeleccionadas }) {
  const GAP = 30
  const xPos = (i) => 18 + i * GAP

  // Chequear si un cuadrante está completamente seleccionado
  function cuadranteActivo(q) {
    return CUADRANTES[q].every(p => seleccionadas.includes(p))
  }

  function toggleCuadrante(q) {
    const piezas = CUADRANTES[q]
    if (cuadranteActivo(q)) {
      // Deseleccionar todo el cuadrante
      onSetSeleccionadas(seleccionadas.filter(p => !piezas.includes(p)))
    } else {
      // Agregar las piezas del cuadrante que no estén ya seleccionadas
      const nuevas = piezas.filter(p => !seleccionadas.includes(p))
      onSetSeleccionadas([...seleccionadas, ...nuevas])
    }
  }

  function seleccionarTodo() {
    if (seleccionadas.length === TODAS.length) {
      onSetSeleccionadas([])
    } else {
      onSetSeleccionadas([...TODAS])
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'center' }}>

        {/* SVG Odontograma */}
        <svg viewBox="0 0 490 200" style={{ width: '100%', maxWidth: 490, display: 'block' }}>
          <line x1="245" y1="8" x2="245" y2="192" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3"/>
          <line x1="8" y1="100" x2="482" y2="100" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3"/>

          <text x={12} y={20} fontSize={9} fill="#94a3b8" fontFamily="system-ui">Q1</text>
          <text x={454} y={20} fontSize={9} fill="#94a3b8" fontFamily="system-ui">Q2</text>
          <text x={12} y={195} fontSize={9} fill="#94a3b8" fontFamily="system-ui">Q4</text>
          <text x={454} y={195} fontSize={9} fill="#94a3b8" fontFamily="system-ui">Q3</text>

          {SUPERIORES.map((fdi, i) => (
            <g key={fdi} transform={`translate(${xPos(i)}, 60)`}>
              <Pieza fdi={fdi} estado={estados[fdi] || 'sano'}
                seleccionada={seleccionadas.includes(fdi)} onClick={onToggle}/>
            </g>
          ))}
          {INFERIORES.map((fdi, i) => (
            <g key={fdi} transform={`translate(${xPos(i)}, 140)`}>
              <Pieza fdi={fdi} estado={estados[fdi] || 'sano'}
                seleccionada={seleccionadas.includes(fdi)} onClick={onToggle}/>
            </g>
          ))}
        </svg>

        {/* Panel de atajos */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: '10px 14px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          minWidth: 110,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 2 }}>
            ATAJOS
          </div>
          <BtnAtajo
            label="Boca entera"
            activo={seleccionadas.length === TODAS.length}
            onClick={seleccionarTodo}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }}/>
          {Object.keys(CUADRANTES).map(q => (
            <BtnAtajo
              key={q}
              label={`Cuadrante ${q}`}
              activo={cuadranteActivo(q)}
              onClick={() => toggleCuadrante(q)}
            />
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 16px',
        marginTop: 12, paddingTop: 12,
        borderTop: '1px solid var(--border)'
      }}>
        {Object.entries(COLORES).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: val.fill, border: `1.5px solid ${val.stroke}`
            }}/>
            <span style={{ color: 'var(--text2)' }}>{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { COLORES }