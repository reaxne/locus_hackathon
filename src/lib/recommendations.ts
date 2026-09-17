import type { ExamName, Program, Recommendation, RoadmapTask, SourcedFact, University } from '../types'
import type { ActivityIdea } from './portfolio'

// FastAPI serializes recommendation.models with camelCase aliases.
export interface BackendSource {
  url: string
  verifiedAt: string
  academicYear: number
}
export interface BackendRequirement {
  exam: ExamName
  studentValue: number | null
  requiredValue: number | null
  status: 'passed' | 'missing' | 'failed' | 'unknown'
  source: BackendSource | null
}
export interface BackendTask {
  id: string
  title: string
  description: string
  reason: string
  status: 'todo' | 'completed'
  priority: 'high' | 'medium' | 'low'
  deadline: string | null
  deadlineStatus: 'verified' | 'unknown'
  source: BackendSource | null
  target: number | null
  blocking: boolean
  dependsOn: string[]
}
export interface BackendRecommendation {
  universityId: string
  university: string
  programId: string
  program: string
  isDemo: boolean
  matchScore: number
  financial: { withinBudget: boolean | null; tuitionPerYear: number | null; fundingOptions: string[] }
  eligibility: {
    status: string
    bestAdmissionRoute: string | null
    availableRoutes: {
      route: string
      status: string
      requirements: BackendRequirement[]
    }[]
  }
  whyRecommended: string[]
  warnings: string[]
  roadmap: BackendTask[]
  nextAction: BackendTask | null
  sources: Record<string, BackendSource>
}
export interface RecommendationResponse {
  recommendations: BackendRecommendation[]
  warnings: string[]
  evaluatedAt: string
  matchingMethod: string
  excludedPrograms: { programId: string; reasons: string[] }[]
}
const taskId = (programId: string, id: string) => JSON.stringify([programId, id])
export interface ServerMatch extends Recommendation {
  tasks: RoadmapTask[]
  completed: string[]
  nextActionId: string | null
  ideas: ActivityIdea[]
}

// This adapter only changes representation. Ranking, eligibility, budget decisions,
// requirements and task generation are owned by LocusBackend.
export function adaptRecommendations(response: RecommendationResponse): ServerMatch[] {
  if (!Array.isArray(response.recommendations) || !Array.isArray(response.warnings))
    throw new Error('Сервер вернул неверный формат рекомендаций.')
  return response.recommendations.map((item) => {
    const fact = <T>(value: T | null, source?: BackendSource | null, verified = false): SourcedFact<T> => ({
      value,
      status: item.isDemo ? 'demo' : verified && value !== null ? 'verified' : 'unknown',
      sourceUrl: source?.url ?? '',
      verifiedAt: source?.verifiedAt ?? null,
      admissionCycle: source ? `${source.academicYear}–${source.academicYear + 1}` : null,
    })
    const route = item.eligibility.availableRoutes.find(
      (route) => route.route === item.eligibility.bestAdmissionRoute,
    )
    const requirements = route?.requirements ?? []
    const application = item.roadmap.find((task) => task.id === 'apply_university')
    const url =
      item.sources.name?.url ?? Object.values(item.sources)[0]?.url ?? application?.source?.url ?? ''
    const university: University = {
      id: item.universityId,
      name: item.university,
      shortName: item.university,
      city: 'Не указан',
      country: 'Kazakhstan',
      sourceUrl: url,
    }
    const program: Program = {
      id: item.programId,
      universityId: item.universityId,
      level: 'bachelor',
      title: fact(item.program, item.sources.name),
      code: null,
      interests: [],
      primaryInterest: null,
      description: item.whyRecommended.join(' '),
      admissionsUrl: url,
      duration: fact<string>(null),
      language: fact<string>(null),
      documents: fact<string[]>(null),
      tuition: fact(
        item.financial.tuitionPerYear,
        item.sources.tuition_per_year,
        item.financial.tuitionPerYear !== null,
      ),
      // The API returns only the best route, never combine alternative routes.
      examRequirements: fact(
        requirements.map((r) => ({ exam: r.exam, minimum: r.requiredValue })),
        requirements[0]?.source,
        !!route && route.status !== 'unknown' && requirements.every((r) => r.status !== 'unknown'),
      ),
      deadline: fact(
        application?.deadline ?? null,
        application?.source,
        application?.deadlineStatus === 'verified',
      ),
      grant: fact(
        item.financial.fundingOptions.length ? item.financial.fundingOptions.join(', ') : null,
        undefined,
        item.financial.fundingOptions.length > 0,
      ),
      researchExams: requirements.map((r) => r.exam),
    }
    const tasks: RoadmapTask[] = item.roadmap.map((task) => ({
      id: taskId(item.programId, task.id),
      stage: task.id.startsWith('apply_') ? 'Apply' : 'Prepare',
      title: task.title,
      description: task.description,
      why: task.reason,
      timing: task.deadlineStatus === 'verified' && task.deadline ? task.deadline : 'Срок не указан',
      sourceUrl: task.source?.url ?? '',
      sourceLabel: 'Источник',
      how: [task.description],
      completionCriteria: task.target === null ? task.description : `Целевой результат: ${task.target}`,
      programIds: [item.programId],
      deadlines: [
        {
          programId: item.programId,
          value: task.deadline,
          status: task.deadlineStatus,
          sourceUrl: task.source?.url ?? '',
        },
      ],
    }))
    return {
      program,
      university,
      tasks,
      group:
        item.financial.withinBudget === true
          ? 'Fits your verified budget'
          : item.financial.withinBudget === false
            ? 'Over budget'
            : 'Needs verification',
      reasons: item.whyRecommended,
      caveats: item.warnings,
      completed: item.roadmap
        .filter((task) => task.status === 'completed')
        .map((task) => taskId(item.programId, task.id)),
      nextActionId: item.nextAction ? taskId(item.programId, item.nextAction.id) : null,
      ideas: item.roadmap
        .filter((task) => task.id === 'portfolio_activity')
        .map((task) => ({
          id: taskId(item.programId, task.id),
          category: 'Personal Projects',
          title: task.title,
          description: task.description,
          outcome: task.reason,
          suggestedPeriod: task.deadline ?? '',
        })),
    }
  })
}
