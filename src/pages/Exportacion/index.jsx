import { useState, useEffect } from 'react'
import { Download, Shield, Database, FileSpreadsheet } from 'lucide-react'
import Toast from '../../components/Toast.jsx'

export default function Exportacion() {
  const [preview, setPreview]     = useState(null)
  const [anonimizar, setAnonimizar] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [toast, setToast]         = useState(null)

  useEffect(() => {
    fetch('http://localhost:5050/exportar/preview')
      .then(r => r.json())
      .then(setPreview)
      .catch(() => setPreview({ pacientes: 0, eventos: 0 }))
  }, [])

  async function descargar() {
    setDescargando(true)
    try {
      const url = `http://localhost:5050/exportar?anonimizar=${anonimizar}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al generar el archivo')

      // Descargar el archivo
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `odontosoft_${anonimizar ? 'anonimizado_' : ''}${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)

      setToast({ msg: 'Archivo descargado correctamente', type: 'success' })
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Exportación & Analítica</div>
          <div className="page-subtitle">Generá un dataset consolidado de todos los pacientes</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 800 }}>

        {/* Resumen */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Database size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700 }}>Resumen del sistema</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text2)' }}>Pacientes activos</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
                {preview?.pacientes ?? '—'}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text2)' }}>Eventos clínicos</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                {preview?.eventos ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Exportar */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileSpreadsheet size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700 }}>Exportar dataset</span>
          </div>

          {/* Toggle anonimización */}
          <div
            onClick={() => setAnonimizar(!anonimizar)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${anonimizar ? 'var(--primary)' : 'var(--border)'}`,
              background: anonimizar ? 'var(--primary-light)' : 'var(--surface2)',
              marginBottom: 16, transition: 'all .15s',
            }}
          >
            <Shield size={18} color={anonimizar ? 'var(--primary)' : 'var(--text3)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Anonimizar datos</div>
              <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 2 }}>
                Reemplaza nombre y DNI por hashes
              </div>
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: anonimizar ? 'var(--primary)' : 'var(--border)',
              position: 'relative', transition: 'background .15s', flexShrink: 0,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: anonimizar ? 19 : 3,
                transition: 'left .15s',
              }} />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={descargar}
            disabled={descargando || !preview?.pacientes}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            <Download size={15} />
            {descargando ? 'Generando...' : 'Descargar Excel'}
          </button>

          {!preview?.pacientes && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 10 }}>
              No hay pacientes registrados aún
            </div>
          )}
        </div>
      </div>

      {/* Descripción del esquema */}
      <div className="card" style={{ padding: 24, marginTop: 20, maxWidth: 800 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Esquema del archivo exportado</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
              Hoja: Pacientes
            </div>
            {['id_paciente','nombre','apellido','dni','fecha_nacimiento',
              'telefono','email','obra_social','nro_afiliado','alergias','creado_en'
            ].map(col => (
              <div key={col} style={{
                padding: '4px 8px', fontSize: 12,
                fontFamily: 'monospace', color: 'var(--primary)',
                background: 'var(--primary-light)',
                borderRadius: 4, marginBottom: 4,
              }}>
                {col}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
              Hoja: Historia
            </div>
            {['id_paciente','fecha','piezas','procedimiento','descripcion'].map(col => (
              <div key={col} style={{
                padding: '4px 8px', fontSize: 12,
                fontFamily: 'monospace', color: 'var(--accent)',
                background: '#f0fdf4',
                borderRadius: 4, marginBottom: 4,
              }}>
                {col}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}