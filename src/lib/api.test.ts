import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, toSurvey, request } from './api'
import { emptyProfile } from './persistence'
afterEach(() => vi.unstubAllGlobals())
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

describe('LocusBackend transport', () => {
  it('loads server recommendations with cookies and rejects an account changed in another tab', async () => {
    const response = { recommendations: [], warnings: [] }
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(response))
      .mockResolvedValueOnce(json({ id: 1, username: 'alice' }))
      .mockResolvedValueOnce(json(response))
      .mockResolvedValueOnce(json({ id: 2, username: 'bob' }))
    vi.stubGlobal('fetch', fetch)
    expect(await api.recommendations('1')).toEqual(response)
    expect(fetch.mock.calls[0][0]).toBe('/api/recommendations?limit=50')
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'GET', credentials: 'include' })
    await expect(api.recommendations('1')).rejects.toMatchObject({ status: 409 })
  })
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

describe('AI event stream', () => {
  it('parses chunk boundaries and delivers only an actual final result', async () => {
    const encoder = new TextEncoder()
    const data =
      [
        { type: 'stage', stage: 'model' },
        { type: 'baseline', data: { recommendations: [] } },
        { type: 'result', data: { answer: 'готово' } },
      ]
        .map((e) => JSON.stringify(e))
        .join('\n') + '\n'
    const bytes = encoder.encode(data)
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                for (let offset = 0; offset < bytes.length; offset += 3)
                  controller.enqueue(bytes.slice(offset, offset + 3))
                controller.close()
              },
            }),
            { headers: { 'content-type': 'application/x-ndjson' } },
          ),
      ),
    )
    const onStage = vi.fn(),
      onBaseline = vi.fn()
    expect(
      await request('/ai/profile', 'POST', {}, '1', { requestId: 'request', onStage, onBaseline }),
    ).toEqual({ answer: 'готово' })
    expect(onStage).toHaveBeenCalledExactlyOnceWith('model')
    expect(onBaseline).toHaveBeenCalledOnce()
  })
  it('rejects interrupted streams and explicit cancellation without returning partial data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{"type":"stage","stage":"model"}\n', {
            headers: { 'content-type': 'application/x-ndjson' },
          }),
      ),
    )
    await expect(request('/ai/profile')).rejects.toThrow('Соединение прервалось')
    const controller = new AbortController()
    controller.abort()
    await expect(
      request('/ai/profile', 'POST', {}, '1', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('reports an error event even when the HTTP stream status is 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            '{"type":"error","status":503,"code":"all_free_models_failed","retryable":true,"previousPlanPreserved":true,"fallbackAvailable":true}\n',
            {
              headers: { 'content-type': 'application/x-ndjson' },
            },
          ),
      ),
    )
    await expect(request('/ai/profile', 'POST', {}, '1', { requestId: 'trace-id' })).rejects.toMatchObject({
      status: 503,
      code: 'all_free_models_failed',
      retryable: true,
      previousPlanPreserved: true,
      fallbackAvailable: true,
      message: expect.stringContaining('trace-id'),
    })
  })
})
