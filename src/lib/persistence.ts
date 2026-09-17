import { currentYear, programs } from '../data/universities'
import {
  academicStrengths,
  activityCategories,
  examNames,
  goalExamNames,
  ieltsSections,
  interests,
  listLabels,
  type ApplicantProfile,
  type PlannedActivity,
  type SavedOption,
  type SavedState,
} from '../types'
import { meetsHardConstraints } from './matching'
import { createPlan } from './roadmap'
import { emptyGoals, emptySectionScores, questionIds, validGoal, validScore } from './profile'
export { examLimits } from './profile'

export const storageKey = 'admission-journey-v3'
export const legacyStorageKey = 'admission-journey-v2'
export function emptyProfile(): ApplicantProfile {
  return {
    grade: 11,
    entryYear: currentYear + 1,
    interest: 'Software engineering',
    city: 'Any city',
    mustStay: false,
    budget: null,
    funding: 'either',
    category: 'unknown',
    country: 'Kazakhstan',
    level: 'bachelor',
    studyLanguage: 'any',
    academicPerformance: 'unknown',
    constraints: '',
    exams: Object.fromEntries(
      examNames.map((exam) => [exam, { status: 'unknown', score: null }]),
    ) as ApplicantProfile['exams'],
    academicStrengths: [],
    extracurricularInterests: [],
    examGoals: emptyGoals(),
    ieltsSectionScores: emptySectionScores(),
  }
}
export function demoProfile(): ApplicantProfile {
  const profile = emptyProfile()
  return {
    ...profile,
    budget: 3_000_000,
    city: 'Astana',
    category: 'domestic',
    academicStrengths: ['Mathematics', 'Programming'],
    extracurricularInterests: ['Personal Projects', 'Hackathons'],
    exams: {
      ...profile.exams,
      UNT: { status: 'planned', score: null },
      IELTS: { status: 'completed', score: 6.5 },
    },
  }
}
export const initialState = (): SavedState => ({
  version: 3,
  profile: null,
  draft: emptyProfile(),
  draftStep: 0,
  answeredQuestions: [],
  comparison: [],
  focus: null,
  completed: [],
  inProgress: [],
  theme: 'dark',
  isDemo: false,
  savedOptions: [],
  activities: [],
  demoSession: null,
  demoAccount: null,
})
export function validateProfile(value: unknown): value is ApplicantProfile {
  if (!value || typeof value !== 'object') return false
  const p = value as ApplicantProfile
  return (
    [9, 10, 11, 12].includes(p.grade) &&
    Number.isInteger(p.entryYear) &&
    p.entryYear >= 2026 &&
    p.entryYear <= 2100 &&
    interests.includes(p.interest) &&
    ['Any city', 'Astana', 'Almaty', 'Karaganda', 'Shymkent', 'Other city'].includes(p.city) &&
    typeof p.mustStay === 'boolean' &&
    (p.budget === null || (Number.isFinite(p.budget) && p.budget >= 0 && p.budget <= 100_000_000)) &&
    ['self', 'grant', 'either'].includes(p.funding) &&
    ['domestic', 'international', 'unknown'].includes(p.category) &&
    p.country === 'Kazakhstan' &&
    p.level === 'bachelor' &&
    ['any', 'ru', 'kk', 'en'].includes(p.studyLanguage) &&
    ['unknown', 'excellent', 'good', 'needs-support'].includes(p.academicPerformance) &&
    typeof p.constraints === 'string' &&
    p.constraints.length <= 1000 &&
    Array.isArray(p.academicStrengths) &&
    p.academicStrengths.every((s) => academicStrengths.includes(s)) &&
    Array.isArray(p.extracurricularInterests) &&
    p.extracurricularInterests.every((s) => activityCategories.includes(s)) &&
    !!p.examGoals &&
    goalExamNames.every((exam) => validGoal(exam, p.examGoals[exam])) &&
    !!p.ieltsSectionScores &&
    ieltsSections.every((section) => validScore('IELTS', p.ieltsSectionScores[section])) &&
    !!p.exams &&
    examNames.every((exam) => {
      const result = p.exams[exam]
      return (
        !!result &&
        ['unknown', 'planned', 'completed', 'not-planned'].includes(result.status) &&
        (result.score === null ||
          (exam !== 'AET' && result.status === 'completed' && validScore(exam, result.score)))
      )
    })
  )
}
export function validActivity(value: unknown): value is PlannedActivity {
  if (!value || typeof value !== 'object') return false
  const a = value as PlannedActivity
  return (
    typeof a.id === 'string' &&
    a.id.length > 0 &&
    a.id.length <= 200 &&
    (a.templateId === null || (typeof a.templateId === 'string' && a.templateId.length <= 200)) &&
    activityCategories.includes(a.category) &&
    typeof a.title === 'string' &&
    a.title.trim().length > 0 &&
    a.title.length <= 120 &&
    typeof a.targetPeriod === 'string' &&
    a.targetPeriod.length <= 80 &&
    ['planned', 'in-progress', 'completed'].includes(a.status)
  )
}
export function reconcile(state: SavedState): SavedState {
  if (!state.profile) return { ...state, comparison: [], focus: null, completed: [], inProgress: [] }
  const allowed = programs.filter((program) => meetsHardConstraints(state.profile!, program)).map((p) => p.id)
  const focus = state.focus && allowed.includes(state.focus) ? state.focus : null
  // Personal bookmarks survive changed preferences; the active plan respects hard constraints.
  const taskIds = new Set(
    createPlan(state.profile, state.savedOptions, state.activities, focus).map((task) => task.id),
  )
  return {
    ...state,
    comparison: [...new Set(state.comparison.filter((id) => allowed.includes(id)))].slice(0, 3),
    focus,
    completed: [...new Set(state.completed.filter((id) => taskIds.has(id)))],
    inProgress: [
      ...new Set((state.inProgress ?? []).filter((id) => taskIds.has(id) && !state.completed.includes(id))),
    ],
  }
}
export function applyProfile(state: SavedState, profile: ApplicantProfile): SavedState {
  if (!validateProfile(profile)) return state
  return reconcile({ ...state, profile, draft: profile })
}
export function parseSavedState(raw: string | null): { state: SavedState; recovered: boolean } {
  if (!raw) return { state: initialState(), recovered: false }
  try {
    const saved = JSON.parse(raw)
    if (!saved || ![2, 3].includes(saved.version)) throw new Error('Unsupported schema')
    const legacy = saved.version === 2
    const upgrade = (p: unknown): unknown =>
      p && typeof p === 'object'
        ? {
            academicStrengths: [],
            extracurricularInterests: [],
            examGoals: emptyGoals(),
            ieltsSectionScores: emptySectionScores(),
            studyLanguage: 'any',
            academicPerformance: 'unknown',
            constraints: '',
            ...p,
          }
        : p
    const profile = upgrade(saved.profile)
    if (profile !== null && !validateProfile(profile)) throw new Error('Invalid saved profile')
    const draft = upgrade(saved.draft)
    const draftValid = validateProfile(draft)
    const oldQuestionIds = [
      'grade',
      'entryYear',
      'interest',
      'city',
      'mustStay',
      'budget',
      'funding',
      'category',
      'academicStrengths',
      'SAT',
      'IELTS',
      'NUET',
      'UNT',
      'AET',
      'extracurricularInterests',
    ]
    const mappedStep =
      saved.draft &&
      typeof saved.draft === 'object' &&
      !('studyLanguage' in saved.draft) &&
      !legacy &&
      Number.isInteger(saved.draftStep)
        ? questionIds.findIndex((id) => id === oldQuestionIds[saved.draftStep])
        : saved.draftStep
    const strings = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((id): id is string => typeof id === 'string').slice(0, 1000) : []
    const options: SavedOption[] = Array.isArray(saved.savedOptions)
      ? saved.savedOptions
          .map(
            (item: { programId: string; label: string }) =>
              item && { ...item, label: item.label === 'Considering' ? 'Priority' : item.label },
          )
          .filter(
            (item: SavedOption) =>
              item && programs.some((p) => p.id === item.programId) && listLabels.includes(item.label),
          )
      : []
    if (legacy && typeof saved.focus === 'string' && programs.some((p) => p.id === saved.focus))
      options.push({ programId: saved.focus, label: 'Priority' })
    const activities: PlannedActivity[] = Array.isArray(saved.activities)
      ? saved.activities.filter(validActivity).slice(0, 100)
      : []
    const session =
      saved.demoSession && typeof saved.demoSession.displayName === 'string'
        ? { displayName: saved.demoSession.displayName.slice(0, 40) }
        : null
    return {
      state: reconcile({
        version: 3,
        profile,
        draft: draftValid ? draft : (profile ?? emptyProfile()),
        draftStep:
          draftValid &&
          !legacy &&
          Number.isInteger(mappedStep) &&
          mappedStep >= 0 &&
          mappedStep < questionIds.length
            ? mappedStep
            : 0,
        answeredQuestions:
          legacy && profile
            ? [...questionIds]
            : strings(saved.answeredQuestions).filter((id) => questionIds.some((q) => q === id)),
        comparison: strings(saved.comparison),
        focus: typeof saved.focus === 'string' ? saved.focus : null,
        completed: strings(saved.completed),
        inProgress: strings(saved.inProgress),
        theme: ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : 'system',
        isDemo: saved.isDemo === true,
        savedOptions: [
          ...new Map(
            options.map((item) => [item.programId, { programId: item.programId, label: item.label }]),
          ).values(),
        ],
        activities: [...new Map(activities.map((item) => [item.id, item])).values()],
        demoSession: session,
        demoAccount:
          saved.demoAccount &&
          typeof saved.demoAccount.email === 'string' &&
          typeof saved.demoAccount.displayName === 'string' &&
          ['email', 'google'].includes(saved.demoAccount.provider)
            ? {
                email: saved.demoAccount.email.slice(0, 254),
                displayName: saved.demoAccount.displayName.slice(0, 40),
                provider: saved.demoAccount.provider,
              }
            : null,
      }),
      recovered: !draftValid,
    }
  } catch {
    return { state: initialState(), recovered: true }
  }
}
