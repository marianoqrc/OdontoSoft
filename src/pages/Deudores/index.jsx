import { useState, useEffect } from 'react';
import { api } from "../../utils/api.js";
import { useNavigate } from 'react-router-dom';
import { MessageCircle, AlertTriangle, ArrowRight, User } from 'lucide-react';

export default function Deudores() {
  const [deudores, setDeudores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get('/deudores');
        setDeudores(res);
      } catch (error) {
        console.error("Error al cargar deudores", error);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const abrirWhatsApp = (deudor) => {
    if (!deudor.telefono) {
      alert("Este paciente no tiene un número de teléfono registrado.");
      return;
    }

    // Limpiamos el número de espacios o guiones. (Se asume que tiene el código de área, ej: 381...)
    let numeroLimpio = deudor.telefono.replace(/\D/g, '');
    
    // Si en Argentina no le pusieron el 549 adelante, se lo agregamos por las dudas
    if (!numeroLimpio.startsWith('549') && !numeroLimpio.startsWith('54')) {
        numeroLimpio = `549${numeroLimpio}`;
    }

    const mensaje = `Hola ${deudor.nombre}, te escribimos del consultorio odontológico. Nos comunicamos para recordarte que figura un saldo pendiente en tu cuenta de $${deudor.deuda_total.toLocaleString('es-AR')}. Por favor, avisanos cuando puedas regularizarlo. ¡Muchas gracias!`;
    
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  if (cargando) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando ranking...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div className="page-header">
        <h1 className="page-title">Gestión de Cobranzas</h1>
        <p className="page-subtitle">Ranking de pacientes con saldo pendiente</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', background: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c' }}>
          <AlertTriangle size={20} />
          <strong>Total de Morosos: {deudores.length} pacientes</strong>
        </div>

        {deudores.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
            ¡Excelente! No hay pacientes con deudas pendientes.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', textAlign: 'left', fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 20px' }}>Paciente</th>
                <th style={{ padding: '12px 20px' }}>Tratamientos Adeudados</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Deuda Total</th>
                <th style={{ padding: '12px 20px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deudores.map((d, index) => (
                <tr key={d.dni} style={{ borderBottom: '1px solid var(--border)', background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 24, height: 24, background: 'var(--surface2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{index + 1}</div>
                      {d.nombre}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '32px' }}>DNI: {d.dni} {d.telefono ? `· Tel: ${d.telefono}` : '· Sin teléfono'}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text2)' }}>
                    {d.cantidad_tratamientos} {d.cantidad_tratamientos === 1 ? 'sesión' : 'sesiones'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>
                    ${d.deuda_total.toLocaleString('es-AR')}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: '#25D366', color: '#fff', border: 'none', padding: '6px 12px' }}
                        onClick={() => abrirWhatsApp(d)}
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle size={14} /> Reclamar
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        style={{ padding: '6px 12px' }}
                        onClick={() => navigate(`/historia?dni=${d.dni}&nombre=${encodeURIComponent(d.nombre)}`)}
                        title="Ver Historia Clínica"
                      >
                        Historia <ArrowRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}