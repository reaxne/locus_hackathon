import { describe, expect, it } from 'vitest'
import { adaptRecommendations } from './recommendations'
import { backendMatch, backendResponse } from '../../tests/fixtures/recommendations'
import { emptyProfile, validateProfile } from './persistence'

describe('backend recommendation contract', () => {
  it('keeps server order and accepts IDs absent from the old frontend catalog', () => {
    const response = backendResponse([backendMatch('second'), backendMatch('first')])
    const matches = adaptRecommendations(response)
    expect(matches.map((match) => match.program.id)).toEqual(['second', 'first'])
    expect(matches[0].reasons).toEqual(response.recommendations[0].whyRecommended)
    expect(matches[0].group).toBe('Fits your verified budget')
    expect(matches[0].program.language.value).toBeNull()
    expect(matches[0].program.duration.value).toBeNull()
    expect(matches[0].university.city).toBe('Не указан')
    expect(matches[0].program.tuition.value).toBe(1234567)
    expect(matches[0].program.tuition.sourceUrl).toBe('https://example.com/tuition')
  })
  it('does not fabricate recommendations or task content for an empty catalog', () => {
    expect(adaptRecommendations(backendResponse([]))).toEqual([])
  })
  it('preserves tasks, server completion and next action without ID collisions', () => {
    const first = backendMatch('a'),
      second = backendMatch('b')
    first.roadmap[0].status = 'completed'
    const [a, b] = adaptRecommendations(backendResponse([first, second]))
    expect(a.tasks[0].id).not.toBe(b.tasks[0].id)
    expect(a.completed).toEqual([a.tasks[0].id])
    expect(b.nextActionId).toBe(b.tasks[0].id)
    expect(b.tasks[0]).toMatchObject({
      title: 'Шаг из backend',
      why: 'Причина шага из backend',
      sourceUrl: '',
      deadlines: [{ programId: 'b', value: null, status: 'unknown', sourceUrl: '' }],
    })
  })
  it('uses server budget decisions and only requirements from the selected route', () => {
    const item = backendMatch()
    item.financial.withinBudget = null
    item.eligibility = {
      status: 'potentially_eligible',
      bestAdmissionRoute: 'sat',
      availableRoutes: [
        {
          route: 'unt',
          status: 'potentially_eligible',
          requirements: [
            { exam: 'UNT', studentValue: null, requiredValue: 100, status: 'missing', source: null },
          ],
        },
        {
          route: 'sat',
          status: 'potentially_eligible',
          requirements: [
            { exam: 'SAT', studentValue: null, requiredValue: 1300, status: 'missing', source: null },
          ],
        },
      ],
    }
    const [match] = adaptRecommendations(backendResponse([item]))
    expect(match.group).toBe('Needs verification')
    expect(match.program.examRequirements.value).toEqual([{ exam: 'SAT', minimum: 1300 }])
  })
})

describe('questionnaire input validation', () => {
  it('keeps missing results and rejects invalid scores, dates and nested input', () => {
    const profile = emptyProfile()
    expect(validateProfile(profile)).toBe(true)
    expect(profile.exams.IELTS.score).toBeNull()
    for (const patch of [
      { exams: null },
      { budget: -1 },
      { studyLanguage: 'de' },
      { constraints: 'x'.repeat(1001) },
      { exams: { ...profile.exams, IELTS: { status: 'completed', score: 99 } } },
      { examGoals: { ...profile.examGoals, SAT: { targetScore: 2000, targetDate: null } } },
      { examGoals: { ...profile.examGoals, IELTS: { targetScore: 7, targetDate: '2027-02-30' } } },
    ])
      expect(validateProfile({ ...profile, ...patch })).toBe(false)
  })
})
