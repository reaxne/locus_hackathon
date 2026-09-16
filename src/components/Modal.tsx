import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current!
    el.showModal()
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el.close()
      document.body.style.overflow = old
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Закрыть окно">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
