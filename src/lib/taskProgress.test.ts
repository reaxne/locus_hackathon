import { describe, expect, it } from 'vitest'
import { currentTask, changeTaskStatus } from './taskProgress'
import { adaptRecommendations } from './recommendations'
import { backendMatch, backendResponse } from '../../tests/fixtures/recommendations'

const tasks = ['a', 'b', 'c'].map(
  (id) => adaptRecommendations(backendResponse([backendMatch(id)]))[0].tasks[0],
)
describe('sequential task progress', () => {
  it('only allows the first unfinished task and advances after completion', () => {
    expect(changeTaskStatus(tasks, [], [], [], tasks[1].id, 'completed').completed).toEqual([])
    const progress = changeTaskStatus(tasks, [], [], [], tasks[0].id, 'completed')
    expect(currentTask(tasks, progress.completed, [])?.id).toBe(tasks[1].id)
  })
  it('reopens later manual tasks when an earlier step is reopened', () => {
    const progress = changeTaskStatus(
      tasks,
      tasks.map((t) => t.id),
      [],
      [],
      tasks[1].id,
      'planned',
    )
    expect(progress.completed).toEqual([tasks[0].id])
  })
  it('respects verified server completion', () => {
    expect(currentTask(tasks, [], [tasks[0].id])?.id).toBe(tasks[1].id)
    expect(changeTaskStatus(tasks, [], [], [tasks[0].id], tasks[0].id, 'planned').completed).toEqual([])
  })
})
