import { ArrowRight, Check, Plus, CircleCheck, Info } from 'lucide-react'
import { money, type University } from '../model'
import Modal from './Modal'
import type { AdmissionController } from '../hooks/useAdmission'

type Props = Pick<
  AdmissionController,
  'recommendations' | 'comparison' | 'toggleCompare' | 'chooseTarget' | 'setDetails'
> & { university: University }
export default function ProgramDetailsDialog({
  university,
  recommendations,
  comparison,
  toggleCompare,
  chooseTarget,
  setDetails,
}: Props) {
  return (
    <Modal title="Ближе к твоей цели" onClose={() => setDetails(null)}>
      <div className="detail-heading">
        <span className={`uni-monogram ${university.color}`}>{university.short}</span>
        <div>
          <h3>{university.name}</h3>
          <p>
            {university.city}, {university.country}
          </p>
        </div>
      </div>
      <div className="detail-facts">
        <span>{money(university.fee)} / год</span>
        <span>IELTS {university.ielts}</span>
        <span>{university.duration} года</span>
      </div>
      <div className="detail-reasons">
        <h3>Почему этот вариант в подборке</h3>
        {recommendations
          .find((r) => r.university.id === university.id)!
          .reasons.map((r) => (
            <p key={r}>
              <CircleCheck size={17} />
              {r}
            </p>
          ))}
        {recommendations
          .find((r) => r.university.id === university.id)!
          .gaps.map((r) => (
            <p className="gap" key={r}>
              <Info size={17} />
              {r}
            </p>
          ))}
      </div>
      <div className="field-note">
        <Info size={19} />
        <p>
          Это вымышленный университет для демонстрации. Все требования и цены — примеры, а не фактические
          условия поступления.
        </p>
      </div>
      <div className="detail-actions">
        <button className="button secondary" onClick={() => toggleCompare(university.id)}>
          {comparison.includes(university.id) ? <Check size={17} /> : <Plus size={17} />}
          {comparison.includes(university.id) ? 'В сравнении' : 'Сравнить'}
        </button>
        <button className="button primary" onClick={() => chooseTarget(university)}>
          Выбрать и построить план
          <ArrowRight size={17} />
        </button>
      </div>
    </Modal>
  )
}
