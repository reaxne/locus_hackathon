import { useState } from 'react'
import { Flag, X, Check } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import TaskDetails from './TaskDetails'

export default function CurrentGoal({ admission }: { admission: Admission }) {
  const [open, setOpen] = useState(false)
  const task = admission.nextTask
  if (!task) return null
  return (
    <aside className="current-goal" aria-label="Текущая цель">
      {open && (
        <section className="panel current-goal-panel" aria-label="Описание текущей цели">
          <button className="icon-button" aria-label="Закрыть текущую цель" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
          <span className="eyebrow">СЛЕДУЮЩИЙ ШАГ</span>
          <h2>{task.title}</h2>
          <p>{task.description}</p>
          <TaskDetails task={task} admission={admission} />
          <button
            className="button primary"
            disabled={!admission.roadmapCurrent}
            onClick={() => admission.setTaskStatus(task.id, 'completed')}
          >
            <Check size={16} />
            Выполнено
          </button>
          {!admission.roadmapCurrent && <p role="status">Обновляем маршрут после изменения профиля…</p>}
        </section>
      )}
      <button
        className="button primary"
        aria-expanded={open}
        aria-label="Открыть текущую цель"
        onClick={() => setOpen(!open)}
      >
        <Flag size={20} />
        <span>Текущая цель</span>
      </button>
    </aside>
  )
}
