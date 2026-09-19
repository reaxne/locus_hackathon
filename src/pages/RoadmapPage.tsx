import { ArrowRight, Check, Flag, CircleCheck, CalendarDays } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { Empty, PageHeading } from '../components/Shared'
import TaskDetails from '../components/TaskDetails'
import { Link } from '../lib/router'
import { ru } from '../lib/labels'
import LoadingState from '../components/LoadingState'

export default function RoadmapPage({ admission }: { admission: Admission }) {
  const { programs, universityFor } = admission
  const { state, tasks } = admission
  if (!state.profile)
    return (
      <Empty title="Твой маршрут начинается с профиля" art="survey">
        Расскажи о своих интересах и планах, чтобы увидеть первые шаги.
      </Empty>
    )
  const profile = state.profile
  const completed = tasks.filter(
    (task) => state.completed.includes(task.id) || admission.serverCompleted.includes(task.id),
  ).length
  const next = admission.nextTask
  const saved = programs.filter((program) =>
    state.savedOptions.some((option) => option.programId === program.id),
  )
  const deadline = tasks
    .flatMap((task) => task.deadlines)
    .filter(
      (item) =>
        item.status === 'verified' &&
        item.value &&
        Number.isFinite(Date.parse(item.value)) &&
        Date.parse(item.value) >= Date.now(),
    )
    .sort((a, b) => Date.parse(a.value!) - Date.parse(b.value!))[0]
  return (
    <>
      <PageHeading
        eyebrow="ТВОЯ ЦЕЛЬ. ТВОЙ ТЕМП."
        title="Мой маршрут"
        description="Большая цель становится ближе с каждым небольшим действием."
      >
        <Link className="button secondary" href="/profile">
          Изменить профиль
        </Link>
      </PageHeading>
      <div className="panel ai-controls" data-request-id={admission.roadmapRequestId}>
        <p>
          Цели выполняются по порядку. Изменения экзаменов обновляют маршрут автоматически после сохранения.
        </p>
        <button
          className="button secondary"
          disabled={admission.roadmapLoading}
          onClick={admission.generateAIRoadmap}
        >
          {admission.roadmapLoading ? 'Обновляем маршрут…' : 'Дополнить маршрут с ИИ'}
        </button>
        {admission.roadmapMessage && <p role="status">{admission.roadmapMessage}</p>}
      </div>
      {admission.roadmapLoading && (
        <LoadingState stage={admission.roadmapStage} onCancel={admission.cancelRoadmap} />
      )}
      <section className="route-overview" aria-label="Обзор подготовки">
        <div className="route-stat">
          <span className="small-label">ТВОЙ ПРОФИЛЬ</span>
          <strong>
            {profile.grade} класс · Поступление {profile.entryYear}
          </strong>
          <p>
            {ru(profile.interest)} · {ru(profile.city)}
          </p>
        </div>
        <div className="route-stat">
          <span className="small-label">ПРОГРЕСС</span>
          <strong>
            {completed} <span>из {tasks.length} шагов</span>
          </strong>
          <progress value={completed} max={tasks.length || 1} aria-label="Прогресс маршрута" />
        </div>
        <div className="route-stat">
          <span className="small-label">
            <CalendarDays size={14} /> БЛИЖАЙШИЙ ДЕДЛАЙН
          </span>
          {deadline ? (
            <a href={deadline.sourceUrl} target="_blank" rel="noreferrer">
              {deadline.value}
            </a>
          ) : (
            <strong className="deadline-unknown">Уточнить на сайте университета</strong>
          )}
          <p>Только подтверждённые сроки твоего набора</p>
        </div>
      </section>
      <section className="route-saved">
        <span className="small-label">ТВОИ ПРОГРАММЫ</span>
        <div>
          {saved.length ? (
            saved.map((program) => (
              <Link className="route-program-chip" key={program.id} href={`/universities/${program.id}`}>
                <strong>{universityFor(program).shortName}</strong>
                {ru(program.title.value ?? 'Программа')}
                <ArrowRight size={14} />
              </Link>
            ))
          ) : (
            <p>Сохрани интересующие программы, чтобы добавить их требования в маршрут.</p>
          )}
          <Link className="text-button" href="/my-list">
            Мой список →
          </Link>
        </div>
      </section>
      <section className="route-next" aria-labelledby="next-action-title">
        <span className="next-icon">{next ? <Flag size={24} /> : <CircleCheck size={24} />}</span>
        <div>
          <span className="small-label">{next ? 'ОДНО ДЕЙСТВИЕ СЕЙЧАС' : 'ТЕКУЩИЙ ПЛАН'}</span>
          <h2 id="next-action-title">
            {next?.title ?? (tasks.length ? 'Нет следующего действия.' : 'Маршрут пока не сформирован.')}
          </h2>
          <p>
            {next?.description ??
              (admission.recommendationWarnings.join(' ') ||
                'Возвращайся к официальным источникам ближе к поступлению: требования могут измениться.')}
          </p>
          {next && <span className="task-timing">{next.timing}</span>}
        </div>
        {next && (
          <a
            className="button primary"
            href={`#route-${next.id}`}
            onClick={() => {
              const detail = document.getElementById(`route-${next.id}`)?.querySelector('details')
              if (detail) detail.open = true
            }}
          >
            К действию <ArrowRight size={17} />
          </a>
        )}
      </section>
      <div className="route-section-heading">
        <h2>Путь к поступлению</h2>
        <span>Планы подготовки ≠ официальные дедлайны</span>
      </div>
      <ol className="winding-route">
        {tasks.map((task, index) => {
          const status =
            state.completed.includes(task.id) || admission.serverCompleted.includes(task.id)
              ? 'completed'
              : state.inProgress.includes(task.id)
                ? 'in-progress'
                : 'planned'
          return (
            <li
              className={`route-stop ${status}`}
              id={`route-${task.id}`}
              key={task.id}
              style={{ gridRow: Math.floor(index / 3) + 1 }}
            >
              <span className="route-node" aria-label={`Шаг ${index + 1}`}>
                {status === 'completed' ? <Check size={20} /> : String(index + 1).padStart(2, '0')}
              </span>
              <article className="route-task">
                <div className="route-task-top">
                  <span className="small-label">{ru(task.stage)}</span>
                  <span className={`route-status ${status}`}>
                    {status === 'completed'
                      ? 'Готово'
                      : status === 'in-progress'
                        ? 'В работе'
                        : 'Запланировано'}
                  </span>
                </div>
                <span className="task-timing">{task.timing}</span>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <TaskDetails
                  task={task}
                  admission={admission}
                  onComplete={
                    next?.id === task.id && admission.roadmapCurrent
                      ? () => admission.setTaskStatus(task.id, 'completed')
                      : undefined
                  }
                />
                {/* Only the current step is actionable; a disabled control on every other
                    card is noise, and the order is already stated above the route. */}
                {admission.roadmapCurrent &&
                  !admission.serverCompleted.includes(task.id) &&
                  (next?.id === task.id || status === 'completed') && (
                    <label className="task-status-control">
                      <span>Статус шага</span>
                      <select
                        aria-label={`Статус: ${task.title}`}
                        value={status}
                        onChange={(event) =>
                          admission.setTaskStatus(
                            task.id,
                            event.target.value as 'planned' | 'in-progress' | 'completed',
                          )
                        }
                      >
                        <option value="planned">Запланировано</option>
                        <option value="in-progress">В работе</option>
                        <option value="completed">Готово</option>
                      </select>
                    </label>
                  )}
              </article>
            </li>
          )
        })}
      </ol>
      <p className="route-footnote">
        Маршрут обновляется по сохранённой анкете. Отметки задач доступны только в текущем сеансе. «Готово» не
        отправляет документы в университет.
      </p>
    </>
  )
}
