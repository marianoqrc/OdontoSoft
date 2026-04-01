export default function Cargando({ mensaje = 'Iniciando...' }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', color: '#fff', gap: 16
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C9.5 2 8 3.5 8 5.5C8 7 8.5 8.5 8.5 10C8.5 12 7 13.5 7 15.5C7 18 8.5 22 12 22C15.5 22 17 18 17 15.5C17 13.5 15.5 12 15.5 10C15.5 8.5 16 7 16 5.5C16 3.5 14.5 2 12 2Z" fill="#38bdf8"/>
      </svg>
      <div style={{ fontSize: 22, fontWeight: 700 }}>OdontoSoft</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{mensaje}</div>
      <div style={{
        width: 40, height: 40, border: '3px solid #1e3a5f',
        borderTop: '3px solid #38bdf8', borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}