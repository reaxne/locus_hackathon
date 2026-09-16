import { X, CircleCheck } from 'lucide-react'
import type { AdmissionController } from '../hooks/useAdmission'

type Props = Pick<AdmissionController, 'toast' | 'setToast'>

export default function Toast({ toast, setToast }: Props) {
  return (
    <div className="toast" role="status">
      <CircleCheck size={19} />
      {toast}
      <button aria-label="Закрыть уведомление" onClick={() => setToast('')}>
        <X size={16} />
      </button>
    </div>
  )
}
