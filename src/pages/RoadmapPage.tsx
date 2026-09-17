import { Check, ArrowRight, CircleCheck, Flag } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { universityFor } from '../data/universities'
import { Empty, Notice, PageHeading } from '../components/Shared'
import TaskDetails, { TaskSource } from '../components/TaskDetails'
import { Link } from '../lib/router'

export default function RoadmapPage({ admission }: { admission: Admission }) {
  const { focus, state, tasks } = admission
  if (!state.profile)
    return (
      <Empty title="Start your personal plan">
        Build a profile, compare your options, then choose a focus program.
      </Empty>
    )
  const completed = tasks.filter((task) => state.completed.includes(task.id)).length
  const next = tasks.find((task) => !state.completed.includes(task.id))
  return (
    <>
      <PageHeading
        eyebrow="ONE STEP AT A TIME"
        title="Your admission roadmap."
        description={`A preparation plan for grade ${state.profile.grade}, with university entry in ${state.profile.entryYear}.`}
        back="/dashboard"
      >
        <Link className="button secondary" href="/profile">
          Edit answers
        </Link>
      </PageHeading>
      {focus ? (
        <section className="roadmap-focus panel">
          <span className={`university-monogram ${focus.universityId}`}>
            {universityFor(focus).shortName}
          </span>
          <div>
            <span className="small-label">YOUR CURRENT FOCUS</span>
            <h2>{focus.title.value}</h2>
            <p>{universityFor(focus).name}</p>
          </div>
          <Link className="text-button" href="/my-list">
            Change focus
            <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <div className="plan-inputs panel">
          <strong>Your plan combines your answers, exam goals and portfolio activities.</strong>
          <p>
            {state.savedOptions.length} saved programs · {state.activities.length} activities · Entry in{' '}
            {state.profile.entryYear}
          </p>
          <Link href="/my-list">Manage my university list</Link>
        </div>
      )}
      <Notice>
        {state.profile.grade <= 10
          ? 'Your first steps focus on exploring and strengthening subjects. Application tasks are for your future intake. '
          : ''}
        Timings are suggested preparation milestones, not official deadlines. Checking a task marks your own
        progress; it does not submit anything. University-specific steps include saved programs that meet your
        hard constraints. Completed work is retained only while its inputs remain relevant.
      </Notice>
      <div className="roadmap-layout">
        <div className="roadmap-stages">
          {(['Now', 'Prepare', 'Apply', 'Confirm'] as const).map((stage, i) => (
            <section key={stage} className="roadmap-stage">
              <div className="stage-title">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h2>{stage}</h2>
                <small>
                  {i === 0
                    ? 'Start here'
                    : i === 1
                      ? 'Build your readiness'
                      : i === 2
                        ? 'When your intake opens'
                        : 'After an official decision'}
                </small>
              </div>
              <div className="stage-tasks">
                {tasks
                  .filter((task) => task.stage === stage)
                  .map((task) => {
                    const done = state.completed.includes(task.id)
                    return (
                      <article className={`task-card ${done ? 'done' : ''}`} key={task.id}>
                        <label className="task-check">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => admission.toggleTask(task.id)}
                          />
                          <span>
                            <Check size={15} />
                          </span>
                          <span className="sr-only">Complete: {task.title}</span>
                        </label>
                        <div>
                          <span className="task-timing">{task.timing}</span>
                          <h3>{task.title}</h3>
                          <p>{task.description}</p>
                          <TaskDetails task={task} />
                        </div>
                      </article>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
        <aside className="next-action panel">
          <span className="next-icon">{next ? <Flag size={22} /> : <CircleCheck size={22} />}</span>
          <span className="small-label">{next ? 'YOUR NEXT ACTION' : 'CHECKLIST COMPLETE'}</span>
          <h2>{next?.title ?? 'You have worked through your plan.'}</h2>
          <p>
            {next?.description ??
              'Revisit official sources when your intake approaches. You can uncheck any task to return to it.'}
          </p>
          {next && (
            <>
              <span className="task-timing">{next.timing}</span>
              <TaskSource task={next} />
              {next.actionPath && (
                <Link className="text-button" href={next.actionPath}>
                  Open task workspace
                  <ArrowRight size={15} />
                </Link>
              )}
              <button
                className="button primary"
                onClick={() => {
                  admission.toggleTask(next.id)
                  admission.setNotice('Task completed. Your next action has been updated.')
                }}
              >
                <Check size={17} />
                Mark complete
              </button>
            </>
          )}
          <div className="plan-progress">
            <div>
              <strong>
                {completed} of {tasks.length}
              </strong>
              <span>tasks complete</span>
            </div>
            <progress value={completed} max={tasks.length} aria-label="Roadmap progress" />
          </div>
          <small>Progress is saved in this browser.</small>
        </aside>
      </div>
    </>
  )
}
