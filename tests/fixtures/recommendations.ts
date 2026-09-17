import type { BackendRecommendation, RecommendationResponse } from '../../src/lib/recommendations'

// Fictional wire-format fixtures, never shipped as a frontend catalog.
export const backendMatch = (programId = 'api-only-program'): BackendRecommendation => ({
  programId,
  program: `Программа ${programId}`,
  universityId: 'test-university',
  university: 'Тестовый университет',
  isDemo: false,
  matchScore: 0.7,
  financial: { withinBudget: true, tuitionPerYear: 1234567, fundingOptions: [] },
  eligibility: { status: 'unknown', bestAdmissionRoute: null, availableRoutes: [] },
  whyRecommended: ['Причина из backend'],
  warnings: ['Требования нужно уточнить'],
  sources: {
    tuition_per_year: { url: 'https://example.com/tuition', verifiedAt: '2026-01-01', academicYear: 2027 },
  },
  roadmap: [
    {
      id: 'verify_requirements',
      title: 'Шаг из backend',
      description: 'Описание шага из backend',
      reason: 'Причина шага из backend',
      status: 'todo',
      priority: 'high',
      deadline: null,
      deadlineStatus: 'unknown',
      source: null,
      target: null,
      blocking: true,
      dependsOn: [],
    },
  ],
  nextAction: null,
})
export function backendResponse(items = [backendMatch()]): RecommendationResponse {
  return {
    recommendations: items.map((item) => ({ ...item, nextAction: item.roadmap[0] ?? null })),
    warnings: items.length ? [] : ['Нет подходящих программ'],
    evaluatedAt: '2026-09-17',
    matchingMethod: 'keyword',
    excludedPrograms: [],
  }
}
