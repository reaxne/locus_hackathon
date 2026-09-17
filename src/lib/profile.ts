import { goalExamNames, ieltsSections, type ApplicantProfile, type ExamName, type ExamGoal } from '../types'

export const questionIds = [
  'grade',
  'entryYear',
  'interest',
  'academicPerformance',
  'studyLanguage',
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
  'constraints',
] as const
export const examLimits = {
  UNT: [0, 140, 1],
  SAT: [400, 1600, 10],
  IELTS: [0, 9, 0.5],
  NUET: [0, 240, 1],
  AET: [0, 100, 1],
} as const
export const examLabel = (exam: ExamName) => (exam === 'UNT' ? 'ЕНТ' : exam)
export const statusLabels = {
  unknown: 'Не указано',
  planned: 'Планирую сдавать',
  completed: 'Сдан',
  'not-planned': 'Не планирую',
}
export const emptyGoals = () =>
  Object.fromEntries(
    goalExamNames.map((exam) => [exam, { targetScore: null, targetDate: null }]),
  ) as ApplicantProfile['examGoals']
export const emptySectionScores = () =>
  Object.fromEntries(
    ieltsSections.map((section) => [section, null]),
  ) as ApplicantProfile['ieltsSectionScores']
export function validScore(exam: ExamName, value: unknown): value is number | null {
  if (value === null) return true
  const [min, max, step] = examLimits[exam]
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && value % step === 0
  )
}
export function validDate(value: unknown): value is string | null {
  if (value === null) return true
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function validGoal(exam: ExamName, value: unknown): value is ExamGoal {
  if (!value || typeof value !== 'object') return false
  const goal = value as ExamGoal
  return validScore(exam, goal.targetScore) && validDate(goal.targetDate)
}
