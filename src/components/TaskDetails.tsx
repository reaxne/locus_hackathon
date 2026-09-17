import type { RoadmapTask } from '../types'
import type { Admission } from '../hooks/useAdmission'
import { External } from './Shared'
import { Link } from '../lib/router'
import { ru } from '../lib/labels'

export function TaskSource({ task }: { task: RoadmapTask }) {
  return task.sourceUrl.startsWith('/') ? (
    <Link className="external" href={task.sourceUrl}>
      {task.sourceLabel}
    </Link>
  ) : (
    <External href={task.sourceUrl}>{task.sourceLabel}</External>
  )
}
export default function TaskDetails({
  task,
  onComplete,
  admission,
}: {
  task: RoadmapTask
  onComplete?: () => void
  admission: Admission
}) {
  const { programs, universityFor } = admission
  const associated = programs.filter((program) => task.programIds.includes(program.id))
  const nearest = task.deadlines
    .filter(
      (deadline) =>
        deadline.status === 'verified' && deadline.value && Date.parse(deadline.value) >= Date.now(),
    )
    .sort((a, b) => Date.parse(a.value!) - Date.parse(b.value!))[0]
  return (
    <details className="task-details">
      <summary>
        Что делать и почему <span aria-hidden="true">↗</span>
      </summary>
      <div className="task-detail-body">
        <h4>Почему это важно</h4>
        <p>{task.why}</p>
        <h4>Как выполнить</h4>
        <ol>
          {task.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h4>Критерий готовности</h4>
        <p>{task.completionCriteria}</p>
        <h4>Связанные программы</h4>
        {associated.length ? (
          <ul>
            {associated.map((program) => (
              <li key={program.id}>
                <Link href={`/universities/${program.id}`}>
                  {universityFor(program).shortName} · {ru(program.title.value ?? 'Программа')}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Общий шаг твоей подготовки.</p>
        )}
        <h4>Сроки и источники</h4>
        {task.deadlines.length ? (
          <ul>
            {task.deadlines.map((deadline) => (
              <li key={deadline.programId}>
                {programs.find((program) => program.id === deadline.programId)?.universityId.toUpperCase()} —{' '}
                {deadline.status === 'verified' && deadline.value
                  ? deadline.value
                  : 'Уточнить на сайте университета'}
                {deadline === nearest && <strong> · Ближайший срок</strong>}.{' '}
                <External href={deadline.sourceUrl}>Источник</External>
              </li>
            ))}
          </ul>
        ) : (
          <p>Срок подготовки — рекомендация, а не официальный дедлайн.</p>
        )}
        <TaskSource task={task} />
        {task.actionPath && (
          <Link className="text-button" href={task.actionPath}>
            {task.actionLabel ?? 'Открыть раздел для этого шага'} →
          </Link>
        )}
        {onComplete && (
          <button className="button secondary" onClick={onComplete}>
            Отметить выполненным
          </button>
        )}
      </div>
    </details>
  )
}
