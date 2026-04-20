import React from 'react';
import Odontograma, { COLORES } from './Odontograma';

const Checkbox = ({ checked }) => (
  <div style={{ 
    width: '12px', height: '12px', border: '1px solid #000', 
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
    fontSize: '11px', fontWeight: 'bold', background: '#fff', color: '#000'
  }}>
    {checked ? 'X' : ''}
  </div>
);

const CampoTexto = ({ label, value, width = 'auto', flex = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', width, flex, marginBottom: '4px' }}>
    <span style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ borderBottom: '1px solid #000', flex: 1, minWidth: '20px', paddingBottom: '1px', fontFamily: 'monospace', fontSize: '13px' }}>
      {value || ''}
    </div>
  </div>
);

export default function LayoutImpresionPdf({ paciente, estadosOdontograma, observaciones }) {
  if (!paciente) return null;

  const isChecked = (val) => val === 1 || val === '1' || val === true || String(val).toUpperCase() === 'SI';

  // --- NUEVA LÓGICA: Generar el resumen para el PDF ---
  const generarResumen = () => {
    if (!estadosOdontograma || Object.keys(estadosOdontograma).length === 0) return null;
    const porDienteYEstado = {};
    Object.entries(estadosOdontograma).forEach(([id, estado]) => {
      if (estado === 'sano') return;
      const partes = id.split('-');
      const fdi = partes[0];
      const seccion = partes.length > 1 ? partes[1] : 'C';
      if (!porDienteYEstado[fdi]) porDienteYEstado[fdi] = {};
      if (!porDienteYEstado[fdi][estado]) porDienteYEstado[fdi][estado] = [];
      porDienteYEstado[fdi][estado].push(seccion);
    });

    const itemsResumen = [];
    Object.entries(porDienteYEstado).forEach(([fdi, estadosDelDiente]) => {
      Object.entries(estadosDelDiente).forEach(([estado, caras]) => {
        const nombreEstado = COLORES[estado]?.label || estado;
        if (caras.length === 5) {
          itemsResumen.push(<li key={`${fdi}-${estado}`} style={{ marginBottom: '2px' }}><strong>P. {fdi}:</strong> {nombreEstado} (Completo)</li>);
        } else {
          const carasLegibles = caras.map(c => c === 'C' ? 'Centro' : c === 'T' ? 'Arriba' : c === 'B' ? 'Abajo' : c === 'L' ? 'Izq' : c === 'R' ? 'Der' : c).join(', ');
          itemsResumen.push(<li key={`${fdi}-${estado}`} style={{ marginBottom: '2px' }}><strong>P. {fdi}:</strong> {nombreEstado} ({carasLegibles})</li>);
        }
      });
    });
    return itemsResumen;
  };

  const listaResumen = generarResumen();

  return (
    <div className="pdf-container" style={{ 
      padding: '10px 15px', 
      background: '#fff', 
      color: '#000', 
      fontFamily: 'Arial, sans-serif', 
      width: '210mm', 
      minHeight: '297mm', // Altura exacta de un A4
      boxSizing: 'border-box',
      filter: 'grayscale(100%)' // Blanco y negro
    }}>
      
      <style>{`
        .odontograma-cleaner .print-only { display: none !important; }
        .odontograma-cleaner .no-print { display: none !important; }
        .odontograma-cleaner .print-content { padding: 0 !important; }
        .odontograma-cleaner .print-content > div:nth-child(1) { display: none !important; }
        .odontograma-cleaner .print-content > div:nth-child(3) { display: none !important; }
        .odontograma-cleaner .print-content > div:nth-child(4) { display: none !important; }
        .odontograma-cleaner svg { transform: scale(0.9); transform-origin: top center; }
      `}</style>

      {/* Contenedor principal que ocupa todo el alto disponible */}
      <div style={{ border: '2px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', minHeight: '277mm', boxSizing: 'border-box' }}>
        
        {/* ENCABEZADO (AQUÍ SE SACÓ LA FIRMA PROFESIONAL DE ARRIBA) */}
        <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal', letterSpacing: '1px' }}>ODONTOGRAMA</h1>
        </div>

        {/* DATOS DEL PACIENTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <CampoTexto label="Nombre y Apellido:" value={`${paciente.nombre || ''} ${paciente.apellido || ''}`.trim()} flex={3} />
            <CampoTexto label="Edad:" value={paciente.edad} flex={1} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <CampoTexto label="Domicilio:" value={paciente.domicilio} flex={2} />
            <CampoTexto label="Localidad:" value={paciente.localidad} flex={2} />
            <CampoTexto label="F. Nac:" value={paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR') : ''} flex={1} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <CampoTexto label="Tel:" value={paciente.telefono} flex={1.5} />
            <CampoTexto label="Obra Social:" value={paciente.obra_social} flex={1.5} />
            <CampoTexto label="Nº de Afiliado:" value={paciente.nro_afiliado} flex={1} />
            <CampoTexto label="Plan:" value={paciente.plan} flex={1} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <CampoTexto label="Contacto de Emergencia:" value={paciente.contacto_emergencia} />
          </div>
        </div>

        {/* ANTECEDENTES MÉDICOS */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Antecedentes Médicos:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.3fr 1.5fr', gap: '10px', fontSize: '11px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Alergia</span><Checkbox checked={isChecked(paciente.alergia)} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>P.A</span><Checkbox checked={isChecked(paciente.hipertenso)} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Antec. Hemorrágicos</span><Checkbox checked={isChecked(paciente.antecedentes_hemor)} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Diabetes</span><Checkbox checked={isChecked(paciente.diabetico) || isChecked(paciente.diabetes)} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Úlcera gastrointest.</span><Checkbox checked={isChecked(paciente.ulsera_gast)} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Epilepsia</span><Checkbox checked={isChecked(paciente.epilepsia)} /></div>
              <CampoTexto label="Médico de cabecera" value="" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Enf. Respiratoria</span><Checkbox checked={isChecked(paciente.enf_respiratoria)} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Trast. Cardíacos</span><Checkbox checked={isChecked(paciente.trast_cardiacos)} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Enfermedades Venéreas</span><Checkbox checked={isChecked(paciente.enfermedades_venereas)} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '5px' }}><span>Fuma:</span><Checkbox checked={isChecked(paciente.fuma)} /></div>
                <CampoTexto label="Ctos?:" value={paciente.tiempo_fumador} />
              </div>
              <CampoTexto label="Medicamentos:" value={paciente.medicamentos} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ marginLeft: 'auto', marginRight: '5px' }}>Hepatitis</span><Checkbox checked={isChecked(paciente.hepatitis)} />
              </div>
            </div>
          </div>
        </div>

        {/* ZONA CENTRAL: ODONTOGRAMA Y OBSERVACIONES */}
        {/* CAMBIO: Se agregó flex: 1 para que ocupe todo el espacio sobrante */}
        <div style={{ display: 'flex', borderTop: '1px solid #000', paddingTop: '15px', gap: '10px', flex: 1 }}>
          
          <div style={{ flex: '1.4', display: 'flex', flexDirection: 'column' }}>
            <div className="odontograma-cleaner" style={{ height: '220px', overflow: 'hidden' }}>
              <Odontograma estados={estadosOdontograma} soloLectura={true} />
            </div>
            
            {/* NUEVO BLOQUE: Resumen y Referencias (Dividido en dos columnas) */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc', flex: 1 }}>
              
              {/* RESUMEN DE SELECCIÓN (Izquierda) */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>Resumen de selección:</div>
                <div style={{ fontSize: '9px' }}>
                  {listaResumen && listaResumen.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '15px' }}>
                      {listaResumen}
                    </ul>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#666' }}>Sin alteraciones</span>
                  )}
                </div>
              </div>

              {/* REFERENCIAS (Derecha) */}
              <div style={{ flex: 1, borderLeft: '1px dashed #ccc', paddingLeft: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>Referencias:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '8px' }}>
                  <div>
                    <div style={{ textDecoration: 'underline', marginBottom: '2px' }}>Pendientes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px' }}>
                      {Object.entries(COLORES).filter(([_, v]) => v.colorBase === 'red').map(([k, v]) => (
                        <div key={k}><strong>[{v.abbr}]</strong> {v.label}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ textDecoration: 'underline', marginBottom: '2px' }}>Realizados</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px' }}>
                      {Object.entries(COLORES).filter(([_, v]) => v.colorBase === 'blue').map(([k, v]) => (
                        <div key={k}><strong>[{v.abbr}]</strong> {v.label}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* OBSERVACIONES */}
          <div style={{ flex: '1', borderLeft: '1px solid #000', paddingLeft: '10px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', marginBottom: '5px' }}>Observaciones:</span>
            {/* CAMBIO: Se agregó flex: 1 para que las líneas se estiren hasta abajo */}
            <div style={{ 
              flex: 1, 
              whiteSpace: 'pre-wrap', 
              fontSize: '11px', 
              lineHeight: '22px', 
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 21px, #000 22px)'
            }}>
              {observaciones}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TEXTO LEGAL Y FIRMAS (Empujados automáticamente al fondo) */}
        {/* ======================================================== */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <div style={{ fontSize: '10px', lineHeight: '1.2', marginBottom: '40px' }}>
            Declaro que he contestado todas las preguntas con honestidad y según mi conocimiento.<br/>
            Así mismo, he sido informado que los datos suministrados, quedan reservados en la presente historia clínica y amparados en el secreto profesional.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', paddingBottom: '10px' }}>
            <div style={{ width: '200px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>Firma del Paciente</div>
            </div>
            <div style={{ width: '200px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>Firma del Profesional</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}