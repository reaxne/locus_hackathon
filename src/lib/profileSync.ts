import { api, type ProfileInput, type RemoteProfile } from './api'

export type SaveStatus = 'saved' | 'saving' | 'error'
// One writer per signed-in account. Coalesce edits while a request is in flight.
export class ProfileSync {
  private pending: ProfileInput | null = null
  private running: Promise<void> | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private stopped = false
  private failed = false
  private revision: number
  private submitted: boolean
  private userId: string
  constructor(
    remote: RemoteProfile,
    private report: (status: SaveStatus, error?: Error) => void,
    private save = api.save,
  ) {
    this.revision = remote.revision
    this.userId = remote.userId
    this.submitted = !!remote.profile
  }
  schedule(input: ProfileInput) {
    this.pending = input
    if (this.failed || this.stopped) return
    this.report('saving')
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      void this.flush().catch(() => {})
    }, 350)
  }
  get dirty() {
    return !!this.pending || !!this.running
  }
  stop() {
    this.stopped = true
    clearTimeout(this.timer)
  }
  async retry() {
    this.failed = false
    return this.flush()
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer)
    if (this.running) {
      await this.running
      if (this.pending) return this.flush()
      return
    }
    if (this.stopped) return
    if (this.failed) throw new Error('Сначала повторите сохранение или загрузите актуальную версию.')
    this.running = (async () => {
      while (this.pending && !this.stopped) {
        const input = this.pending
        this.pending = null
        this.report('saving')
        try {
          const remote = await this.save(input, this.revision, this.submitted, this.userId)
          this.revision = remote.revision
          this.submitted = !!remote.profile
        } catch (cause) {
          this.pending ??= input
          this.failed = true
          if (!this.stopped) this.report('error', cause as Error)
          throw cause
        }
      }
      if (!this.stopped) this.report('saved')
    })()
    try {
      await this.running
    } finally {
      this.running = null
    }
  }
}
