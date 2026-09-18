export type FactStatus = 'verified' | 'unknown' | 'demo'
export interface SourcedFact<T> {
  value: T | null
  status: FactStatus
  sourceUrl: string
  verifiedAt: string | null
  admissionCycle: string | null
  scope?: 'all' | 'domestic' | 'international'
}
export const interests = [
  'Software engineering',
  'AI & data',
  'Cybersecurity',
  'Engineering and Technology',
  'Medicine and Healthcare',
  'Economics and Business',
  'Law',
  'Natural Sciences',
  'Humanities',
  'Education and Pedagogy',
  'Architecture and Construction',
  'Art and Design'
] as const
export type Interest = (typeof interests)[number]
export const examNames = ['UNT', 'SAT', 'IELTS', 'NUET', 'AET'] as const
export type ExamName = (typeof examNames)[number]
export type ExamStatus = 'unknown' | 'planned' | 'completed' | 'not-planned'
export interface ExamResult {
  status: ExamStatus
  score: number | null
}
export const academicStrengths = [
  'Mathematics',
  'Programming',
  'English',
  'Writing',
  'Research',
  'Teamwork',
] as const
export type AcademicStrength = (typeof academicStrengths)[number]
export const activityCategories = [
  'Hackathons',
  'Volunteering',
  'Research',
  'Personal Projects',
  'Competitions',
  'Leadership',
] as const
export type ActivityCategory = (typeof activityCategories)[number]
export const goalExamNames = ['SAT', 'IELTS', 'NUET', 'UNT'] as const
export type GoalExamName = (typeof goalExamNames)[number]
export const ieltsSections = ['Listening', 'Reading', 'Writing', 'Speaking'] as const
export interface ExamGoal {
  targetScore: number | null
  targetDate: string | null
}
export const listLabels = ['Dream', 'Priority', 'Backup'] as const
export type ListLabel = (typeof listLabels)[number]
export interface SavedOption {
  programId: string
  label: ListLabel
}
export interface PlannedActivity {
  id: string
  templateId: string | null
  category: ActivityCategory
  title: string
  targetPeriod: string
  status: 'planned' | 'in-progress' | 'completed'
}
export interface ApplicantProfile {
  grade: 9 | 10 | 11 | 12
  entryYear: number
  interest: Interest
  city: string
  mustStay: boolean
  budget: number | null
  funding: 'self' | 'grant' | 'either'
  category: 'domestic' | 'international' | 'unknown'
  country: 'Kazakhstan'
  level: 'bachelor'
  exams: Record<ExamName, ExamResult>
  studyLanguage: 'any' | 'ru' | 'kk' | 'en'
  academicPerformance: 'unknown' | 'excellent' | 'good' | 'needs-support'
  constraints: string
  academicStrengths: AcademicStrength[]
  extracurricularInterests: ActivityCategory[]
  examGoals: Record<GoalExamName, ExamGoal>
  ieltsSectionScores: Record<(typeof ieltsSections)[number], number | null>
}
export interface University {
  id: string
  name: string
  shortName: string
  city: string
  country: 'Kazakhstan'
  sourceUrl: string
}
export interface ExamRequirement {
  exam: ExamName
  minimum: number | null
}
export interface Program {
  id: string
  universityId: string
  level: 'bachelor'
  title: SourcedFact<string>
  code: string | null
  interests: Interest[]
  primaryInterest: Interest | null
  description: string
  duration: SourcedFact<string>
  language: SourcedFact<string>
  tuition: SourcedFact<number>
  examRequirements: SourcedFact<ExamRequirement[]>
  deadline: SourcedFact<string>
  grant: SourcedFact<string>
  documents: SourcedFact<string[]>
  admissionsUrl: string
  // Suggested research topics, not confirmed entry requirements.
  researchExams: ExamName[]
}
export type MatchGroup = 'Fits your verified budget' | 'Needs verification' | 'Over budget'
export interface Recommendation {
  program: Program
  university: University
  group: MatchGroup
  reasons: string[]
  caveats: string[]
}
export interface RoadmapTask {
  id: string
  stage: 'Now' | 'Prepare' | 'Apply' | 'Confirm'
  title: string
  description: string
  timing: string
  sourceUrl: string
  sourceLabel: string
  why: string
  how: string[]
  actionPath?: string
  actionLabel?: string
  programIds: string[]
  completionCriteria: string
  deadlines: { programId: string; value: string | null; sourceUrl: string; status: FactStatus }[]
}
export type Theme = 'light' | 'dark' | 'system'
export interface SavedState {
  version: 3
  profile: ApplicantProfile | null
  draft: ApplicantProfile
  draftStep: number
  comparison: string[]
  focus: string | null
  completed: string[]
  inProgress: string[]
  theme: Theme
  isDemo: boolean
  answeredQuestions: string[]
  savedOptions: SavedOption[]
  activities: PlannedActivity[]
  demoSession: { displayName: string } | null
  demoAccount: { id: string; email: string; displayName: string; provider: 'email' | 'google' } | null
}
