import { useEffect, useRef, useState } from 'react'
import { api, type RequestOptions } from '../lib/api'

export function useOperation() {
  const active = useRef<{ controller: AbortController; requestId: string } | null>(null)
  const [stage, setStage] = useState('preparing')
  const [requestId, setRequestId] = useState<string>()
  function cancel() {
    const job = active.current
    if (!job) return
    active.current = null
    job.controller.abort()
    void api.cancel(job.requestId).catch(() => {})
  }
  function start(): RequestOptions {
    cancel()
    const job = { controller: new AbortController(), requestId: crypto.randomUUID() }
    active.current = job
    setRequestId(job.requestId)
    setStage('saving')
    return {
      signal: job.controller.signal,
      requestId: job.requestId,
      onStage: (value) => {
        if (active.current === job) setStage(value)
      },
    }
  }
  function finish(id?: string) {
    if (active.current?.requestId === id) active.current = null
  }
  useEffect(() => cancel, [])
  return { start, cancel, finish, stage, requestId }
}
