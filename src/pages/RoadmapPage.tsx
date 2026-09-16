import { Check, Clock3, Info } from 'lucide-react'
import { programName } from '../model'
import type { AdmissionController } from '../hooks/useAdmission'

type Props = Pick<
  AdmissionController,
  | 'profile'
  | 'completed'
  | 'target'
  | 'tasks'
  | 'completedCount'
  | 'progress'
  | 'nextTask'
  | 'navigate'
  | 'toggleTask'
>

export default function RoadmapPage({
  profile,
  completed,
  target,
  tasks,
  completedCount,
  progress,
  nextTask,
  navigate,
  toggleTask,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">НЕ ВСЁ СРАЗУ. ШАГ ЗА ШАГОМ.</div>
          <h1>
            Твой маршрут поступления<span className="lime-period">.</span>
          </h1>
          <p>Один следующий шаг, чтобы не потеряться среди десятков задач.</p>
        </div>
        <span className="tag">Набор {profile.year}</span>
      </div>
      <div className="roadmap-layout">
        <div>
          <div className="roadmap-target">
            <span className={`uni-monogram ${target.color}`}>{target.short}</span>
            <div>
              <small>ТВОЯ ЦЕЛЬ</small>
              <h3>{target.name}</h3>
              <span>
                {programName(target.fields.includes(profile.interest) ? profile.interest : target.fields[0])}{' '}
                · {target.country}
              </span>
            </div>
            <button className="text-link" onClick={() => navigate('programs')}>
              Изменить
            </button>
          </div>
          <div className="task-list">
            {tasks.map((task, i) => {
              const done = completed.includes(task.id)
              return (
                <article
                  key={task.id}
                  className={`task-row ${done ? 'completed' : ''} ${task.id === nextTask?.id ? 'next' : ''}`}
                >
                  <button
                    className="task-check"
                    aria-label={`${done ? 'Отменить выполнение' : 'Завершить'}: ${task.title}`}
                    aria-pressed={done}
                    onClick={() => toggleTask(task.id)}
                  >
                    {done ? <Check size={19} /> : <span>{String(i + 1).padStart(2, '0')}</span>}
                  </button>
                  <div>
                    <div className="task-meta">
                      <span>{task.category}</span>
                      {task.id === nextTask?.id && <b>Следующий шаг</b>}
                    </div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <span className="task-time">
                      <Clock3 size={14} />
                      {task.timing}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
        <aside>
          <section className="panel progress-panel">
            <span className="eyebrow">ТВОЙ ПРОГРЕСС</span>
            <strong>
              {progress}
              <span>%</span>
            </strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Прогресс маршрута"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${progress}%` }} />
            </div>
            <p>
              {completedCount} из {tasks.length} шагов завершено
            </p>
            <hr />
            <p>Отмечай выполненные задачи. Твой прогресс сохранится в этом браузере.</p>
          </section>
          <div className="roadmap-note">
            <Info size={20} />
            <p>
              Сроки в плане — ориентиры для подготовки. Официальные дедлайны и условия нужно проверить у
              реального университета.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
