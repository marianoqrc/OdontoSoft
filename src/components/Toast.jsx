import { useEffect } from 'react'

export default function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`toast toast-${type}`}>
      {msg}
    </div>
  )
}