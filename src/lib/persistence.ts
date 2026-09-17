import { currentYear } from '../data/universities'
import {
  academicStrengths,
  activityCategories,
  examNames,
  goalExamNames,
  ieltsSections,
  interests,
  type ApplicantProfile,
  type PlannedActivity,
  type SavedState,
} from '../types'
import { emptyGoals, emptySectionScores, validGoal, validScore } from './profile'
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
  return {
    ...state,
    comparison: [...new Set(state.comparison)].slice(0, 3),
    completed: [...new Set(state.completed)],
    inProgress: [...new Set(state.inProgress.filter((id) => !state.completed.includes(id)))],
  }
}

export function applyProfile(state: SavedState, profile: ApplicantProfile): SavedState {
  if (!validateProfile(profile)) return state
  return reconcile({ ...state, profile, draft: profile })
}
