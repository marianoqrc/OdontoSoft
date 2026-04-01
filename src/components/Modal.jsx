import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  
  // Efecto para escuchar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Activamos el "escuchador" de teclas al abrir el modal
    window.addEventListener('keydown', handleKeyDown);

    // Lo apagamos al cerrar el modal para no consumir memoria
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    // Le sacamos el onClick al overlay para que no se cierre al hacer clic afuera
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}