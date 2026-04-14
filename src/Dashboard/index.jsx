import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { DollarSign, AlertCircle, TrendingUp, CheckCircle, Calendar } from 'lucide-react';

const COLORES_PIE = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [rango, setRango] = useState('historico');

  useEffect(() => {
    async function cargarEstadisticas() {
      setCargando(true);
      try {
        const res = await api.get(`/estadisticas?rango=${rango}`);
        setData(res);
      } catch (error) {
        console.error("Error cargando estadísticas", error);
      } finally {
        setCargando(false);
      }
    }
    cargarEstadisticas();
  }, [rango]);

  if (cargando) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Analizando datos clínicos...</div>;
  if (!data || data.error) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--danger)' }}>Error: {data?.error || 'No se pudo conectar con el servidor'}</div>;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">Visualización de métricas de OdontoSoft</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <Calendar size={16} color="var(--text3)" />
          <select 
            value={rango} 
            onChange={(e) => setRango(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="historico">Todo el historial</option>
            <option value="año">Último Año</option>
            <option value="trimestre">Últimos 90 días</option>
            <option value="mes">Últimos 30 días</option>
          </select>
        </div>
      </div>

      {/* TARJETAS KPI (4 COLUMNAS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', marginBottom: '8px' }}>INGRESOS (CAJA)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800 }}>${data.ingresos_totales.toLocaleString('es-AR')}</span>
            <DollarSign size={14} color="#10b981" />
          </div>
          <div style={{ fontSize: '11px', marginTop: '8px', color: '#059669', fontWeight: 600 }}>Cobrabilidad: {data.cobrabilidad}%</div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', marginBottom: '8px' }}>DEUDA PENDIENTE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800 }}>${data.deuda_total.toLocaleString('es-AR')}</span>
            <AlertCircle size={14} color="#ef4444" />
          </div>
          <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text3)' }}>En {data.tratamientos_totales} sesiones</div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', marginBottom: '8px' }}>TICKET PROMEDIO</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800 }}>${data.ticket_promedio.toLocaleString('es-AR')}</span>
            <TrendingUp size={14} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text3)' }}>Rendimiento por sesión</div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6', background: 'linear-gradient(to right, #f5f3ff, #fff)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6d28d9', marginBottom: '8px' }}>MAYOR IMPACTO</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#4c1d95', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.mayor_impacto}
          </div>
          <div style={{ fontSize: '11px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed' }}>
            <CheckCircle size={12} /> Líder en recaudación
          </div>
        </div>

      </div>

      {/* GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Procedimientos más frecuentes
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.procedimientos} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                    formatter={(value, name, props) => [
                        `$${props.payload.monto?.toLocaleString('es-AR') || 0}`, 
                        'Recaudado'
                    ]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  {/* ETIQUETAS SOBRE LAS BARRAS */}
                  <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fontWeight: 700, fill: '#1e293b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '25px' }}>Distribución de Ingresos ($)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.metodos_pago} 
                  cx="50%" cy="50%" 
                  innerRadius={70} outerRadius={100} 
                  paddingAngle={5} dataKey="value"
                >
                  {data.metodos_pago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}