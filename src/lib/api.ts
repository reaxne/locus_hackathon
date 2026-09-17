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
export async function request<T>(path: string, method = 'GET', body?: unknown, userId?: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Locus-Request': '1',
        ...(userId ? { 'X-Locus-User': userId } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new ApiError(0, 'Сервер недоступен. Проверьте соединение и повторите сохранение.')
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Не удалось подтвердить вход. Проверьте имя пользователя и пароль или войдите заново.',
      403: 'Сервер отклонил запрос. Проверьте адрес сайта в настройках API.',
      409: path.startsWith('/auth')
        ? 'Такое имя пользователя уже занято.'
        : 'Профиль или аккаунт изменён в другой вкладке. Загрузите актуальную версию перед редактированием.',
      422: path.startsWith('/auth')
        ? 'Имя: 3–50 латинских букв, цифр или _. Пароль: 8–128 символов.'
        : 'Сервер отклонил ответы анкеты. Проверьте значения полей.',
      429: 'Слишком много попыток. Повторите через 15 минут.',
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
    return (await response.json()) as T
  } catch {
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
  recommendations: async (userId: string) => {
    const response = await request<RecommendationResponse>('/recommendations?limit=50')
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
