import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, toSurvey } from './api'
import { emptyProfile } from './persistence'
afterEach(() => vi.unstubAllGlobals())
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

describe('LocusBackend transport', () => {
  it('registers then logs in through existing username routes', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ id: 1, username: 'alice' }))
      .mockResolvedValueOnce(json({ access_token: 'secret', token_type: 'bearer' }))
      .mockResolvedValueOnce(json({ id: 1, username: 'alice' }))
    vi.stubGlobal('fetch', fetch)
    expect(await api.register('alice', 'password-123')).toMatchObject({ id: '1', displayName: 'alice' })
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
    ])
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ username: 'alice', password: 'password-123' })
    expect(fetch.mock.calls[1][1].credentials).toBe('include')
  })
  it('uses POST /survey for both completion and edits, retaining all profile fields', async () => {
    const profile = { ...emptyProfile(), constraints: 'Accessible housing', studyLanguage: 'en' as const }
    const input = { profile, draft: profile, draftStep: 17, answeredQuestions: [] }
    const fetch = vi.fn().mockImplementation((_url, options) => {
      const body = JSON.parse(options.body)
      return Promise.resolve(json({ ...body, state: { ...body.state, revision: body.state.revision + 1 } }))
    })
    vi.stubGlobal('fetch', fetch)
    const saved = await api.save(input, 2, false, '1')
    expect(saved.profile?.constraints).toBe('Accessible housing')
    await api.save({ ...input, profile: { ...profile, grade: 12 } }, 3, true, '1')
    for (const call of fetch.mock.calls) {
      expect(call[0]).toBe('/api/survey')
      expect(call[1]).toMatchObject({ method: 'POST', headers: { 'X-Locus-User': '1' } })
    }
    const payload = JSON.parse(fetch.mock.calls[0][1].body)
    expect(payload.survey).toEqual(toSurvey(profile))
    expect(payload.survey.SAT).toBeNull()
    expect(payload.survey.exams).toBeUndefined()
    expect(payload.state.profile.studyLanguage).toBe('en')
    expect(saved.revision).toBe(3)
  })
  it('treats missing survey as an unfinished new profile and reports failures', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ id: 2, username: 'bob' }))
      .mockResolvedValueOnce(json({}, 404))
    vi.stubGlobal('fetch', fetch)
    await api.me()
    expect(await api.profile()).toMatchObject({ userId: '2', profile: null, revision: 0 })
    fetch.mockResolvedValueOnce(json({}, 409))
    await expect(api.profile()).rejects.toMatchObject({ status: 409 })
    fetch.mockRejectedValueOnce(new Error('offline'))
    await expect(api.profile()).rejects.toBeInstanceOf(ApiError)
  })
})
