import type { RecommendationResponse } from './recommendations'
import type { ApplicantProfile } from '../types'
import { emptyProfile, validateProfile } from './persistence'
import { questionIds } from './profile'

export interface Identity {
  id: string
  email: string
  displayName: string
  provider: 'email'
}
export interface ProfileAnalysisResponse {
  ai: { status: 'generated' | 'unavailable'; model: string | null; cached: boolean; reason?: string }
  analysis: {
    strengths: ProfileInsight[]
    weaknesses: ProfileInsight[]
    unknowns: string[]
  } | null
}
export interface ProfileInsight {
  title: string
  evidence: string
  evidence_fields: string[]
  why: string
  actions: string[]
}
export interface RemoteProfile {
  userId: string
  profile: ApplicantProfile | null
  draft: ApplicantProfile | null
  draftStep: number
  answeredQuestions: string[]
  revision: number
  updatedAt: string
}
export type ProfileInput = Pick<RemoteProfile, 'profile' | 'draft' | 'draftStep' | 'answeredQuestions'>
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export interface RequestOptions {
  signal?: AbortSignal
  requestId?: string
  onStage?: (stage: string) => void
  onBaseline?: (data: RecommendationResponse) => void
}
export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  userId?: string,
  options: RequestOptions = {},
): Promise<T> {
  const started = performance.now()
  const diagnostic = (stage: string) => {
    if (import.meta.env.DEV && options.requestId)
      console.debug('locus.ai', {
        requestId: options.requestId,
        stage,
        elapsedMs: Math.round(performance.now() - started),
      })
  }
  diagnostic('request_started')
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Locus-Request': '1',
        ...(userId ? { 'X-Locus-User': userId } : {}),
        ...(options.requestId ? { 'X-Request-ID': options.requestId, Accept: 'application/x-ndjson' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.any([
        AbortSignal.timeout(path.startsWith('/ai/') ? 70000 : 15000),
        ...(options.signal ? [options.signal] : []),
      ]),
    })
  } catch {
    diagnostic(options.signal?.aborted ? 'cancelled' : 'network_error')
    options.signal?.throwIfAborted()
    throw new ApiError(0, 'Сервер недоступен. Проверьте соединение и повторите сохранение.')
  }
  if (!response.ok) {
    if (response.status === 401 && !['/auth/login', '/auth/register', '/auth/logout'].includes(path))
      window.dispatchEvent(new Event('locus:session-expired'))
    const messages: Record<number, string> = {
      401: 'Не удалось подтвердить вход. Проверьте имя пользователя и пароль или войдите заново.',
      403: 'Сервер отклонил запрос. Проверьте адрес сайта в настройках API.',
      409: path.startsWith('/auth')
        ? 'Такое имя пользователя уже занято.'
        : 'Профиль или аккаунт изменён в другой вкладке. Загрузите актуальную версию перед редактированием.',
      422: path.startsWith('/auth')
        ? 'Имя: 3–50 латинских букв, цифр или _. Пароль: 8–128 символов.'
        : 'Сервер отклонил ответы анкеты. Проверьте значения полей.',
      429: 'Запрос уже выполняется или действует ограничение. Повторите через 20 секунд.',
    }
    throw new ApiError(
      response.status,
      messages[response.status] ??
        (method === 'GET'
          ? 'Не удалось загрузить данные с сервера. Повторите попытку.'
          : 'Не удалось сохранить данные на сервере. Повторите попытку.'),
    )
  }
  if (response.status === 204) return undefined as T
  try {
    if (response.headers.get('content-type')?.includes('application/x-ndjson') && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let pending = ''
      try {
        while (true) {
          const { value, done } = await reader.read()
          options.signal?.throwIfAborted()
          pending += decoder.decode(value, { stream: !done })
          const lines = pending.split('\n')
          pending = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            const event = JSON.parse(line)
            if (event.type === 'stage') {
              diagnostic(event.stage)
              options.onStage?.(event.stage)
            }
            if (event.type === 'baseline') options.onBaseline?.(event.data)
            if (event.type === 'error')
              throw new ApiError(
                event.status,
                `Не удалось завершить обработку. Повторите попытку. Код запроса: ${options.requestId}`,
              )
            if (event.type === 'result') {
              diagnostic('render_ready')
              return event.data as T
            }
          }
          if (done) throw new ApiError(0, 'Соединение прервалось. Повторите попытку.')
        }
      } finally {
        await reader.cancel().catch(() => {})
        reader.releaseLock()
      }
    }
    const data = (await response.json()) as T
    options.signal?.throwIfAborted()
    return data
  } catch (error) {
    options.signal?.throwIfAborted()
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'API вернул неверный ответ. Проверьте подключение Python backend.')
  }
}
interface BackendUser {
  id: number
  username: string
}
interface SurveyEnvelope {
  survey: Record<string, unknown>
  state?: ProfileInput & { revision: number }
  userId?: string
  revision?: number
  updatedAt?: string
}
let identity: Identity | null = null
async function me(): Promise<Identity> {
  const user = await request<BackendUser>('/auth/me')
  // email is a legacy UI-state field; LocusBackend authenticates by username.
  identity = { id: String(user.id), email: user.username, displayName: user.username, provider: 'email' }
  return identity
}
async function login(username: string, password: string) {
  // LocusBackend keeps its Bearer response; the browser uses its HttpOnly session cookie.
  await request<{ access_token: string }>('/auth/login', 'POST', { username, password })
  return me()
}
export function toSurvey(profile: ApplicantProfile): Record<string, unknown> {
  return {
    grade: profile.grade,
    entryYear: profile.entryYear,
    interest: profile.interest,
    city: profile.city === 'Any city' ? [] : profile.city,
    mustStay: profile.mustStay,
    budget: profile.budget,
    funding:
      profile.funding === 'self'
        ? ['self_funded']
        : profile.funding === 'grant'
          ? ['state_grant', 'university_scholarship']
          : ['self_funded', 'state_grant', 'university_scholarship'],
    category: profile.category,
    academicStrengths: profile.academicStrengths,
    extracurricularInterests: profile.extracurricularInterests,
    ...Object.fromEntries(Object.entries(profile.exams).map(([exam, result]) => [exam, result.score])),
  }
}
function decode(data: SurveyEnvelope, userId: string): RemoteProfile {
  if (data.state) return { ...data.state, userId: data.userId ?? userId, updatedAt: data.updatedAt ?? '' }
  // Read older fifteen-field surveys without silently dropping unrecognized values.
  const { SAT, IELTS, NUET, UNT, AET, ...fields } = data.survey
  const draft = { ...emptyProfile(), ...fields } as ApplicantProfile
  if (Array.isArray(fields.city) && fields.city.length === 0) draft.city = 'Any city'
  if (Array.isArray(fields.interest) && fields.interest.length === 1) draft.interest = fields.interest[0]
  if (Array.isArray(fields.funding))
    draft.funding = fields.funding.includes('self_funded')
      ? fields.funding.length === 1
        ? 'self'
        : 'either'
      : 'grant'
  for (const [exam, score] of Object.entries({ SAT, IELTS, NUET, UNT, AET })) {
    draft.exams[exam as keyof ApplicantProfile['exams']] = {
      status: score === null ? 'unknown' : 'completed',
      score: score as number | null,
    }
  }
  if (!validateProfile(draft))
    throw new Error(
      'Старая анкета имеет неподдерживаемый формат. Обратитесь к администратору; исходные ответы сохранены.',
    )
  return {
    userId: data.userId ?? userId,
    profile: draft,
    draft,
    draftStep: 0,
    answeredQuestions: [...questionIds],
    revision: data.revision ?? 0,
    updatedAt: data.updatedAt ?? '',
  }
}
export const api = {
  cancel: (requestId: string) => request<void>(`/ai/requests/${requestId}/cancel`, 'POST'),
  analyzeProfile: async (userId: string, options?: RequestOptions) => {
    const response = await request<ProfileAnalysisResponse>('/ai/profile', 'POST', {}, userId, options)
    if ((await me()).id !== userId) throw new ApiError(409, 'Аккаунт изменился. Войдите заново.')
    options?.signal?.throwIfAborted()
    return response
  },
  aiSearch: (userId: string, programIds: string[], options?: RequestOptions) =>
    request<RecommendationResponse>('/ai/recommendations', 'POST', { programIds, limit: 6 }, userId, options),
  plan: async (userId: string, programIds: string[], generateAI = false, options?: RequestOptions) => {
    const response = await request<RecommendationResponse>(
      '/ai/roadmap',
      'POST',
      { programIds, limit: 3, generateAI },
      userId,
      options,
    )
    if ((await me()).id !== userId) throw new ApiError(409, 'Аккаунт изменился. Войдите заново.')
    options?.signal?.throwIfAborted()
    return response
  },
  recommendations: async (userId: string, options?: RequestOptions) => {
    const response = await request<RecommendationResponse>(
      '/recommendations?limit=50',
      'GET',
      undefined,
      userId,
      options,
    )
    // Cookies are shared across tabs. Do not render another account's results.
    if ((await me()).id !== userId)
      throw new ApiError(409, 'Аккаунт изменился. Загрузите профиль заново перед просмотром рекомендаций.')
    return response
  },
  me,
  login,
  register: async (username: string, password: string) => {
    await request<BackendUser>('/auth/register', 'POST', { username, password })
    return login(username, password)
  },
  logout: async () => {
    try {
      await request<void>('/auth/logout', 'POST')
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error
    }
    identity = null
  },
  profile: async (): Promise<RemoteProfile> => {
    const user = identity ?? (await me())
    try {
      return decode(await request<SurveyEnvelope>('/survey'), user.id)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error
      return {
        userId: user.id,
        profile: null,
        draft: null,
        draftStep: 0,
        answeredQuestions: [],
        revision: 0,
        updatedAt: '',
      }
    }
  },
  save: async (
    input: ProfileInput,
    revision: number,
    _submitted: boolean,
    userId: string,
  ): Promise<RemoteProfile> => {
    if (!input.draft) throw new Error('Нет ответов для сохранения.')
    const data = await request<SurveyEnvelope>(
      '/survey',
      'POST',
      {
        survey: toSurvey(input.profile ?? input.draft),
        state: { ...input, revision },
      },
      userId,
    )
    return decode(data, userId)
  },
}
