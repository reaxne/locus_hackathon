import type { RoadmapTask } from '../types'
import { External } from './Shared'
import { Link } from '../lib/router'

export function TaskSource({ task }: { task: RoadmapTask }) {
  return task.sourceUrl.startsWith('/') ? (
    <Link className="external" href={task.sourceUrl}>
      {task.sourceLabel}
    </Link>
  ) : (
    <External href={task.sourceUrl}>{task.sourceLabel}</External>
  )
}
export default function TaskDetails({ task }: { task: RoadmapTask }) {
  return (
    <details className="task-details">
      <summary>Why this matters / How to do it / Source</summary>
      <h4>Why this matters</h4>
      <p>{task.why}</p>
      <h4>How to do it</h4>
      <ol>
        {task.how.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <h4>Source</h4>
      <TaskSource task={task} />
      {task.actionPath && (
        <Link className="text-button" href={task.actionPath}>
          Open related workspace
        </Link>
      )}
    </details>
  )
}
