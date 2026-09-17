import { describe, expect, it, vi } from 'vitest'
import { ProfileSync } from './profileSync'
import { emptyProfile } from './persistence'
import type { RemoteProfile } from './api'
const remote: RemoteProfile = {
  userId: 'user-1',
  profile: null,
  draft: null,
  draftStep: 0,
  answeredQuestions: [],
  revision: 0,
  updatedAt: '',
}
const input = { profile: null, draft: emptyProfile(), draftStep: 1, answeredQuestions: ['grade'] }
describe('serialized profile saves', () => {
  it('coalesces answers and advances server revision', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ...remote, revision: 1 })
      .mockResolvedValueOnce({ ...remote, revision: 2 })
    const sync = new ProfileSync(remote, vi.fn(), save)
    sync.schedule(input)
    sync.schedule({ ...input, draftStep: 2 })
    await sync.flush()
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ ...input, draftStep: 2 }, 0, false, 'user-1')
    sync.schedule({ ...input, draftStep: 3 })
    await sync.flush()
    expect(save.mock.calls[1][1]).toBe(1)
    expect(sync.dirty).toBe(false)
  })
  it('retains newest edits on failure, retries explicitly, and stops on sign-out', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ ...remote, revision: 1 })
    const report = vi.fn()
    const sync = new ProfileSync(remote, report, save)
    sync.schedule(input)
    await expect(sync.flush()).rejects.toThrow('offline')
    expect(sync.dirty).toBe(true)
    sync.schedule({ ...input, draftStep: 2 })
    await sync.retry()
    expect(save.mock.calls[1][0].draftStep).toBe(2)
    expect(report).toHaveBeenLastCalledWith('saved')
    sync.stop()
    sync.schedule(input)
    await sync.flush()
    expect(save).toHaveBeenCalledTimes(2)
  })
})
