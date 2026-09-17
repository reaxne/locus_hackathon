import { describe, expect, it } from 'vitest'
import { programs, factApplies } from '../data/universities'
import { recommend } from './matching'
import { createPlan, createRoadmap } from './roadmap'
import {
  demoProfile,
  emptyProfile,
  initialState,
  parseSavedState,
  reconcile,
  validateProfile,
} from './persistence'
import type { ApplicantProfile } from '../types'

const aitu = programs.find((p) => p.id === 'aitu-cs')!
const nu = programs.find((p) => p.id === 'nu-cs')!
const profile = (patch: Partial<ApplicantProfile> = {}) => ({ ...demoProfile(), ...patch })

describe('explainable recommendations', () => {
  it('offers three distinct real universities for the prepared profile', () => {
    expect(new Set(recommend(profile()).map((r) => r.university.id)).size).toBe(3)
    expect(recommend(profile()).every((r) => r.reasons.length && r.caveats.length)).toBe(true)
  })
  it('changes the lead option and reasons when the interest changes', () => {
    const software = recommend(profile({ interest: 'Software engineering' }))
    const cyber = recommend(profile({ interest: 'Cybersecurity' }))
    expect(cyber[0].program.id).toBe('aitu-cyber')
    expect(software[0].program.id).not.toBe(cyber[0].program.id)
    expect(cyber[0].reasons.join(' ')).toContain('Cybersecurity')
  })
  it('changes budget grouping for a verified cycle without treating missing fees as free', () => {
    const low = recommend(profile({ entryYear: 2026, budget: 500_000 }))
    const high = recommend(profile({ entryYear: 2026, budget: 3_000_000 }))
    expect(low.find((r) => r.program.id === aitu.id)?.group).toBe('Over budget')
    expect(high.find((r) => r.program.id === aitu.id)?.group).toBe('Fits your verified budget')
    expect(low.find((r) => r.program.id === nu.id)?.group).toBe('Needs verification')
  })
  it('never applies a historical domestic price to a future or international intake', () => {
    expect(factApplies(aitu.tuition, profile({ entryYear: 2027 }))).toBe(false)
    expect(factApplies(aitu.tuition, profile({ entryYear: 2026, category: 'international' }))).toBe(false)
    expect(recommend(profile({ entryYear: 2027 })).every((r) => r.group === 'Needs verification')).toBe(true)
  })
  it('respects strict city limits while allowing a soft location preference', () => {
    expect(recommend(profile({ city: 'Almaty', mustStay: true }))).toEqual([])
    expect(recommend(profile({ city: 'Almaty', mustStay: false }))).toHaveLength(programs.length)
  })
  it('updates exam explanations and tasks, without inventing eligibility', () => {
    const before = profile()
    const after = {
      ...before,
      exams: { ...before.exams, AET: { status: 'completed' as const, score: null } },
    }
    expect(
      recommend(after)
        .find((r) => r.program.id === aitu.id)
        ?.reasons.join(' '),
    ).toContain('AET completed (score unknown)')
    expect(createRoadmap(before, aitu).map((t) => t.id)).not.toEqual(
      createRoadmap(after, aitu).map((t) => t.id),
    )
    expect(
      recommend(after)
        .find((r) => r.program.id === aitu.id)
        ?.caveats.join(' '),
    ).toContain('thresholds')
  })
})
describe('relevant and persistent roadmaps', () => {
  it('starts younger students on exploration and labels application timing as later', () => {
    const tasks = createRoadmap(profile({ grade: 9, entryYear: 2029 }), aitu)
    expect(tasks[0].title).toBe('Explore your chosen field')
    expect(tasks.filter((t) => t.stage === 'Now').some((t) => /apply|application/i.test(t.title))).toBe(false)
    expect(tasks.find((t) => t.title.startsWith('Verify the current deadline'))?.timing).toContain('Later')
    expect(tasks.find((t) => t.title.startsWith('Prepare to apply to'))?.timing).toContain('2029')
  })
  it('uses verification rather than a fabricated deadline for senior students', () => {
    const tasks = createRoadmap(profile({ grade: 12 }), aitu)
    expect(tasks[0].title).toBe('Check the admissions route at AITU')
    expect(tasks.find((t) => t.title.startsWith('Verify the current deadline'))?.description).toContain(
      'No deadline is verified',
    )
  })
  it('does not carry completed tasks to a different program', () => {
    const p = profile()
    const state = {
      ...initialState(),
      profile: p,
      draft: p,
      focus: aitu.id,
      completed: createRoadmap(p, aitu).map((t) => t.id),
    }
    const next = reconcile({ ...state, focus: nu.id })
    expect(next.completed.some((id) => id.startsWith(`${aitu.id}:`))).toBe(false)
    expect(next.completed.some((id) => id.startsWith('subjects:'))).toBe(true)
  })
  it('keeps stable relevant work while resetting changed exam and funding tasks', () => {
    const p = profile()
    const tasks = createRoadmap(p, aitu)
    const state = {
      ...initialState(),
      profile: p,
      draft: p,
      focus: aitu.id,
      completed: tasks.map((t) => t.id),
    }
    const changed = {
      ...p,
      budget: 1_000_000,
      exams: { ...p.exams, UNT: { status: 'completed' as const, score: 100 } },
    }
    const next = reconcile({ ...state, profile: changed })
    expect(next.completed).toContain(tasks[0].id)
    expect(next.completed.some((id) => id.includes(':budget:'))).toBe(false)
    const oldExamIds = tasks.filter((task) => task.title.includes('UNT')).map((task) => task.id)
    expect(next.completed.some((id) => oldExamIds.includes(id))).toBe(false)
    expect(next.completed.length).toBeLessThan(state.completed.length)
  })
  it('prunes focus, comparison and completed tasks after a hard constraint change', () => {
    const p = profile()
    const state = {
      ...initialState(),
      profile: { ...p, city: 'Almaty', mustStay: true },
      focus: aitu.id,
      comparison: [aitu.id, nu.id],
      completed: createRoadmap(p, aitu).map((t) => t.id),
    }
    expect(reconcile(state)).toMatchObject({ focus: null, comparison: [] })
    expect(reconcile(state).completed.some((id) => id.startsWith(`${aitu.id}:`))).toBe(false)
  })
})

describe('extended planning and migration', () => {
  it('preserves legacy answers, theme and comparison while upgrading the JSON profile', () => {
    const p = profile()
    const legacy = {
      ...initialState(),
      version: 2,
      profile: p,
      draft: p,
      theme: 'dark',
      comparison: [nu.id, aitu.id],
      focus: nu.id,
    }
    const restored = parseSavedState(JSON.stringify(legacy)).state
    expect(restored.version).toBe(3)
    expect(restored.profile?.interest).toBe(p.interest)
    expect(restored.profile?.exams.IELTS.score).toBe(6.5)
    expect(restored.theme).toBe('dark')
    expect(restored.comparison).toEqual([nu.id, aitu.id])
    expect(restored.savedOptions).toContainEqual({ programId: nu.id, label: 'Priority' })
    expect(restored.profile?.examGoals.SAT.targetScore).toBeNull()
  })
  it('round trips progressive answers, list labels, activities and the optional demo session', () => {
    const p = profile()
    const state = {
      ...initialState(),
      profile: p,
      draft: p,
      draftStep: 8,
      answeredQuestions: ['grade', 'entryYear'],
      savedOptions: [{ programId: nu.id, label: 'Dream' as const }],
      activities: [
        {
          id: 'a1',
          templateId: null,
          title: 'School app',
          category: 'Personal Projects' as const,
          targetPeriod: 'October 2026',
          status: 'in-progress' as const,
        },
      ],
      demoSession: { displayName: 'Guest' },
    }
    expect(parseSavedState(JSON.stringify(state)).state).toEqual(state)
  })
  it('splits IELTS preparation into concrete actions and changes weak-section work after scores change', () => {
    const p = profile()
    p.examGoals.IELTS = { targetScore: 7.5, targetDate: '2027-02-01' }
    const before = createPlan(p)
    expect(before.map((task) => task.title)).toEqual(
      expect.arrayContaining([
        'Take a diagnostic test for IELTS',
        'Record your IELTS section scores',
        'Choose one IELTS section to improve',
        'Schedule two IELTS practice sessions',
      ]),
    )
    const changed = { ...p, ieltsSectionScores: { Listening: 7, Reading: 6.5, Writing: 5.5, Speaking: 6 } }
    const after = createPlan(changed)
    expect(after.find((t) => t.title === 'Choose one IELTS section to improve')?.description).toContain(
      'Writing',
    )
    expect(after.find((t) => t.title === 'Take a diagnostic test for IELTS')?.id).toBe(
      before.find((t) => t.title === 'Take a diagnostic test for IELTS')?.id,
    )
    expect(after.find((t) => t.title === 'Choose one IELTS section to improve')?.id).not.toBe(
      before.find((t) => t.title === 'Choose one IELTS section to improve')?.id,
    )
    expect(after.every((t) => t.why && t.how.length && t.sourceUrl && t.timing)).toBe(true)
  })
  it('does not generate SAT preparation just because an option mentions it as a possible route', () => {
    const p = emptyProfile()
    const tasks = createRoadmap(p, nu)
    expect(tasks.some((t) => t.title === 'Check the SAT route at NU')).toBe(true)
    expect(tasks.some((t) => t.title === 'Take a diagnostic test for SAT')).toBe(false)
  })
  it('invalidates removed university and activity tasks but retains the other saved program', () => {
    const p = profile()
    const savedOptions = [
      { programId: nu.id, label: 'Dream' as const },
      { programId: aitu.id, label: 'Priority' as const },
    ]
    const activity = {
      id: 'school-project',
      templateId: null,
      title: 'School app',
      category: 'Personal Projects' as const,
      targetPeriod: 'This term',
      status: 'planned' as const,
    }
    const tasks = createPlan(p, savedOptions, [activity])
    const state = {
      ...initialState(),
      profile: p,
      draft: p,
      savedOptions: savedOptions.slice(1),
      activities: [],
      completed: tasks.map((t) => t.id),
    }
    const next = reconcile(state)
    expect(next.completed.some((id) => id.startsWith(`${nu.id}:`))).toBe(false)
    expect(next.completed.some((id) => id.startsWith('activity:'))).toBe(false)
    expect(next.completed.some((id) => id.startsWith(`${aitu.id}:`))).toBe(true)
  })
  it('keeps personal labels outside search constraints while removing their active admission steps', () => {
    const p = profile({ city: 'Almaty', mustStay: true })
    const state = reconcile({
      ...initialState(),
      profile: p,
      draft: p,
      savedOptions: [{ programId: nu.id, label: 'Considering' }],
    })
    expect(state.savedOptions).toHaveLength(1)
    expect(createPlan(p, state.savedOptions).some((task) => task.id.startsWith(`${nu.id}:`))).toBe(false)
  })
  it('rejects impossible goal scores and dates without treating absent targets as zero', () => {
    const p = profile()
    expect(
      validateProfile({ ...p, examGoals: { ...p.examGoals, SAT: { targetScore: 2000, targetDate: null } } }),
    ).toBe(false)
    expect(
      validateProfile({
        ...p,
        examGoals: { ...p.examGoals, IELTS: { targetScore: 7, targetDate: '2027-02-30' } },
      }),
    ).toBe(false)
    expect(p.examGoals.IELTS.targetScore).toBeNull()
  })
  it('resets affected exam work when its target changes, preserving unrelated program checks', () => {
    const p = profile()
    p.examGoals.IELTS = { targetScore: 7, targetDate: '2027-02-01' }
    const tasks = createRoadmap(p, nu)
    const changed = {
      ...p,
      examGoals: { ...p.examGoals, IELTS: { targetScore: 7.5, targetDate: '2027-03-01' } },
    }
    const next = reconcile({
      ...initialState(),
      profile: changed,
      draft: changed,
      focus: nu.id,
      completed: tasks.map((task) => task.id),
    })
    const oldIeltsIds = tasks.filter((task) => task.id.includes(':IELTS:')).map((task) => task.id)
    expect(next.completed.some((id) => oldIeltsIds.includes(id))).toBe(false)
    expect(next.completed).toContain(tasks[0].id)
  })
})
describe('storage and input boundaries', () => {
  it('handles malformed JSON, unsupported schemas and malformed nested exams', () => {
    for (const raw of [
      '{broken',
      '{"version":1}',
      JSON.stringify({ ...initialState(), draft: { ...emptyProfile(), exams: null } }),
    ]) {
      expect(parseSavedState(raw).recovered).toBe(true)
      expect(parseSavedState(raw).state.profile).toBeNull()
    }
  })
  it('round trips drafts, theme and task completion and drops fabricated task IDs', () => {
    const p = profile()
    const id = createRoadmap(p, aitu)[0].id
    const state = {
      ...initialState(),
      profile: p,
      draft: p,
      draftStep: 2,
      theme: 'dark' as const,
      focus: aitu.id,
      completed: [id, 'fake'],
    }
    expect(parseSavedState(JSON.stringify(state)).state).toMatchObject({
      draftStep: 2,
      theme: 'dark',
      completed: [id],
    })
  })
  it('preserves missing scores as null and rejects impossible numeric results', () => {
    const p = emptyProfile()
    expect(validateProfile(p)).toBe(true)
    expect(p.exams.IELTS.score).toBeNull()
    expect(validateProfile({ ...p, exams: { ...p.exams, IELTS: { status: 'completed', score: 99 } } })).toBe(
      false,
    )
    expect(validateProfile({ ...p, budget: -100 })).toBe(false)
  })
  it('preserves the committed profile and progress when only an unfinished draft is invalid', () => {
    const p = profile()
    const id = createRoadmap(p, aitu)[0].id
    const saved = {
      ...initialState(),
      profile: p,
      draft: { ...p, budget: -1 },
      focus: aitu.id,
      completed: [id],
    }
    const recovered = parseSavedState(JSON.stringify(saved))
    expect(recovered.recovered).toBe(true)
    expect(recovered.state.profile).toEqual(p)
    expect(recovered.state.completed).toEqual([id])
    expect(recovered.state.draft).toEqual(p)
  })
})
