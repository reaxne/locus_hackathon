import { describe, expect, it } from 'vitest'
import {
  createRoadmap,
  demoProfile,
  initialState,
  parseSavedState,
  recommend,
  universities,
  validateProfile,
} from './model'

describe('personalized recommendations', () => {
  it('changes the leading program when country changes', () => {
    expect(recommend(demoProfile)[0].university.country).toBe('Германия')
    expect(recommend({ ...demoProfile, countries: ['Казахстан'] })[0].university.country).toBe('Казахстан')
  })
  it('prefers an affordable alternative after a budget change', () => {
    const profile = {
      ...demoProfile,
      countries: ['Нидерланды'] as typeof demoProfile.countries,
      ielts: 7,
      gpa: 5,
    }
    expect(recommend({ ...profile, budget: 15000 })[0].university.country).toBe('Нидерланды')
    expect(recommend({ ...profile, budget: 5000 })[0].university.id).not.toBe(
      recommend(profile)[0].university.id,
    )
  })
  it('changes programs for a different interest and explains every criterion', () => {
    const result = recommend({ ...demoProfile, interest: 'Бизнес и экономика' })
    expect(result[0].university.id).not.toBe(recommend(demoProfile)[0].university.id)
    expect(result[0].university.fields).toContain('Бизнес и экономика')
    for (const r of result) expect(r.reasons.length + r.gaps.length).toBe(5)
  })
  it('keeps limitations visible when no options fit the budget', () => {
    const result = recommend({ ...demoProfile, budget: 0 })
    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result.every((r) => r.gaps.some((g) => g.includes('Выше бюджета')))).toBe(true)
  })
})

describe('roadmap adaptation', () => {
  const target = universities[1]
  it('adds preparation only when the exam result is insufficient', () => {
    expect(createRoadmap({ ...demoProfile, ielts: 5 }, target).some((t) => t.id.startsWith('ielts-'))).toBe(
      true,
    )
    expect(createRoadmap({ ...demoProfile, ielts: 7 }, target).some((t) => t.id.startsWith('ielts-'))).toBe(
      false,
    )
  })
  it('adds funding and grade tasks for unmet constraints', () => {
    const tasks = createRoadmap({ ...demoProfile, budget: 1000, gpa: 3 }, target)
    expect(tasks.some((t) => t.id.startsWith('funding-'))).toBe(true)
    expect(tasks.some((t) => t.id.startsWith('grades-'))).toBe(true)
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
  })
  it('updates target year and subject-specific activity', () => {
    const tasks = createRoadmap({ ...demoProfile, year: demoProfile.year + 1, interest: 'Инженерия' }, target)
    expect(tasks.some((t) => t.title.includes(`${demoProfile.year + 1}`))).toBe(true)
    expect(tasks.some((t) => t.title === 'Описать инженерный проект')).toBe(true)
  })
})

describe('saved profile validation', () => {
  it('recovers from corrupt storage and invalid data', () => {
    expect(parseSavedState('{broken')).toEqual(initialState())
    expect(
      parseSavedState(JSON.stringify({ ...initialState(), profile: { ...demoProfile, budget: -5 } })),
    ).toEqual(initialState())
    expect(validateProfile({ ...demoProfile, countries: [] })).toBe(false)
    expect(validateProfile({ ...demoProfile, gpa: null })).toBe(false)
    expect(validateProfile({ ...demoProfile, ielts: 6.3 })).toBe(false)
  })
  it('round trips completed tasks and profile without retaining unknown universities', () => {
    const saved = {
      ...initialState(),
      isDemo: false,
      completed: ['example-task'],
      comparison: ['rhein', 'rhein', 'unknown'],
      target: 'unknown',
    }
    const restored = parseSavedState(JSON.stringify(saved))
    expect(restored.isDemo).toBe(false)
    expect(restored.completed).toEqual(['example-task'])
    expect(restored.comparison).toEqual(['rhein'])
    expect(restored.target).toBe(null)
  })
})
