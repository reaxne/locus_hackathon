import type { RoadmapTask } from '../types'

export function currentTask(tasks: RoadmapTask[], completed: string[], serverCompleted: string[]) {
  const done = new Set([...completed, ...serverCompleted])
  return tasks.find((task) => !done.has(task.id))
}

export function changeTaskStatus(
  tasks: RoadmapTask[],
  completed: string[],
  inProgress: string[],
  serverCompleted: string[],
  id: string,
  status: 'planned' | 'in-progress' | 'completed',
) {
  if (!tasks.some((t) => t.id === id) || serverCompleted.includes(id)) return { completed, inProgress }
  if (status !== 'planned' && currentTask(tasks, completed, serverCompleted)?.id !== id)
    return { completed, inProgress }
  // Reopening an earlier step also reopens later manually completed steps.
  const index = tasks.findIndex((task) => task.id === id)
  const allowed = new Set(tasks.slice(0, index).map((task) => task.id))
  return {
    completed:
      status === 'planned'
        ? completed.filter((key) => allowed.has(key))
        : [...completed.filter((key) => key !== id), ...(status === 'completed' ? [id] : [])],
    inProgress:
      status === 'in-progress'
        ? [id]
        : inProgress.filter((key) => key !== id && (status !== 'planned' || allowed.has(key))),
  }
}
