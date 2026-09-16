import { ArrowUpRight } from 'lucide-react'
import type { AdmissionController } from '../hooks/useAdmission'

type Props = Pick<AdmissionController, 'setHelpOpen'>

export default function Footer({ setHelpOpen }: Props) {
  return (
    <footer className="page-footer">
      <span>
        вектор<span>↗</span> <small>Твоё будущее. Твоё направление.</small>
      </span>
      <button onClick={() => setHelpOpen(true)}>
        О проекте
        <ArrowUpRight size={14} />
      </button>
    </footer>
  )
}
