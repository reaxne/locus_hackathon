import { ArrowRight } from 'lucide-react'
import type { AdmissionController } from '../hooks/useAdmission'
import Modal from './Modal'

type Props = Pick<AdmissionController, 'setHelpOpen'>

export default function HelpDialog({ setHelpOpen }: Props) {
  return (
    <Modal title="Каждой цели нужен вектор" onClose={() => setHelpOpen(false)}>
      <div className="help-content">
        <p>
          Вектор помогает старшеклассникам пройти путь от выбора направления до плана поступления на
          бакалавриат.
        </p>
        <ol>
          <li>Расскажи о себе в короткой анкете.</li>
          <li>Посмотри, какие программы подходят и почему.</li>
          <li>Сравни варианты и выбери цель.</li>
          <li>Двигайся по маршруту и отмечай прогресс.</li>
        </ol>
        <h3>Как работает подбор</h3>
        <p>
          Используем понятные правила: направление, страна, бюджет, IELTS и средний балл. Наибольший вес имеют
          направление, бюджет и страна. Совпадение — не оценка шансов поступления.
        </p>
        <h3>Что важно знать</h3>
        <p>
          Это начальный проект по кейсу LOCUS Hackathon 2026. Каталог вымышленный, внешняя AI-модель не
          подключена. Данные сохраняются только в этом браузере и не отправляются на сервер. Изменение профиля
          пересчитывает подбор и начинает новый план.
        </p>
      </div>
      <button className="button dark full" onClick={() => setHelpOpen(false)}>
        Понятно, идём дальше
        <ArrowRight size={17} />
      </button>
    </Modal>
  )
}
