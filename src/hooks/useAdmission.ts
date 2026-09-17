import { useEffect, useRef, useState } from 'react'
import { adaptRecommendations, type ServerMatch } from '../lib/recommendations'
import { applyProfile, initialState, reconcile, validateProfile, validActivity } from '../lib/persistence'
import { questionIds } from '../lib/profile'
import { api, ApiError, type Identity, type RemoteProfile } from '../lib/api'
import { ProfileSync, type SaveStatus } from '../lib/profileSync'
import type { ApplicantProfile, Theme, ListLabel, PlannedActivity } from '../types'

export function useAdmission() {
  const [state, setState] = useState(initialState)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [saveError, setSaveError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const sync = useRef<ProfileSync | null>(null)
  const baseline = useRef('')
  const alive = useRef(true)
  function restore(identity: Identity, remote: RemoteProfile) {
    if (identity.id !== remote.userId) throw new Error('Аккаунт изменился. Обновите страницу.')
    if (
      (remote.profile && !validateProfile(remote.profile)) ||
      (remote.draft && !validateProfile(remote.draft))
    )
      throw new Error('Сохранённый профиль имеет неверный формат. Обратитесь к администратору.')
    sync.current?.stop()
    const restored = {
      ...initialState(),
      profile: remote.profile,
      draft: remote.draft ?? initialState().draft,
      draftStep: remote.draftStep,
      answeredQuestions: remote.answeredQuestions,
      demoAccount: identity,
      demoSession: { displayName: identity.displayName },
    }
    baseline.current = JSON.stringify({
      profile: restored.profile,
      draft: restored.draft,
      draftStep: restored.draftStep,
      answeredQuestions: restored.answeredQuestions,
    })
    sync.current = new ProfileSync(remote, (status, error) => {
      if (!alive.current) return
      setSaveStatus(status)
      setSaveError(error?.message ?? '')
      setConflict(error instanceof ApiError && error.status === 409)
    })
    setSaveStatus('saved')
    setSaveError('')
    setConflict(false)
    setState((old) => ({ ...restored, theme: old.theme }))
    return !!remote.profile
  }
  useEffect(() => {
    alive.current = true
    let cancelled = false
    void (async () => {
      try {
        const identity = await api.me()
        const remote = await api.profile()
        if (!cancelled) restore(identity, remote)
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.status === 401))
          setNotice(error instanceof Error ? error.message : 'Не удалось загрузить профиль.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      alive.current = false
      sync.current?.stop()
    }
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    if (!state.demoAccount || !sync.current) return
    const input = {
      profile: state.profile,
      draft: state.draft,
      draftStep: state.draftStep,
      answeredQuestions: state.answeredQuestions,
    }
    const serialized = JSON.stringify(input)
    if (baseline.current === serialized) return
    baseline.current = serialized
    sync.current.schedule(input)
  }, [state.profile, state.draft, state.draftStep, state.answeredQuestions, state.demoAccount])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (sync.current?.dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const change = () => setSystemDark(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  const dark = state.theme === 'dark' || (state.theme === 'system' && systemDark)
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  const [remoteMatches, setRemoteMatches] = useState<{ key: string; matches: ServerMatch[] } | null>(null)
  const [recommendationError, setRecommendationError] = useState('')
  const [recommendationWarnings, setRecommendationWarnings] = useState<string[]>([])
  const [recommendationAttempt, setRecommendationAttempt] = useState(0)
  const recommendationKey = JSON.stringify([state.demoAccount, state.profile])
  useEffect(() => {
    let cancelled = false
    setRemoteMatches(null)
    setRecommendationError('')
    setRecommendationWarnings([])
    if (!state.demoAccount || !state.profile) return
    // Session marks cannot establish completion for a changed server plan.
    setState((old) => ({ ...old, completed: [], inProgress: [] }))
    void (async () => {
      try {
        // The autosave effect above schedules this profile before we flush it.
        // GET recommendations must only see a successfully committed survey.
        await sync.current?.flush()
        if (cancelled) return
        const response = await api.recommendations(state.demoAccount!.id)
        const matches = adaptRecommendations(response)
        if (cancelled) return
        setRemoteMatches({ key: recommendationKey, matches })
        setRecommendationWarnings(response.warnings)
        const allowed = new Set(matches.map((match) => match.program.id))
        setState((old) => ({
          ...old,
          comparison: old.comparison.filter((id) => allowed.has(id)),
          focus: old.focus && allowed.has(old.focus) ? old.focus : null,
        }))
      } catch (error) {
        if (!cancelled)
          setRecommendationError(
            error instanceof Error ? error.message : 'Не удалось загрузить рекомендации.',
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [recommendationKey, recommendationAttempt])
  const recommendations = remoteMatches?.key === recommendationKey ? remoteMatches.matches : []
  const recommendationsLoading =
    !!state.profile && !!state.demoAccount && remoteMatches?.key !== recommendationKey && !recommendationError
  const programs = recommendations.map((match) => match.program)
  const universities = [
    ...new Map(recommendations.map((match) => [match.university.id, match.university])).values(),
  ]
  const universityFor = (program: (typeof programs)[number]) =>
    universities.find((uni) => uni.id === program.universityId)!
  const focus = programs.find((p) => p.id === state.focus)
  const selectedMatches = recommendations.filter(
    (match) =>
      state.focus === match.program.id ||
      state.savedOptions.some((option) => option.programId === match.program.id),
  )
  const planMatches = selectedMatches.length ? selectedMatches : recommendations
  const tasks = planMatches.flatMap((match) => match.tasks)
  const serverCompleted = planMatches.flatMap((match) => match.completed)
  const nextTask = planMatches
    .map((match) =>
      tasks.find((task) => task.id === match.nextActionId && !state.completed.includes(task.id)),
    )
    .find(Boolean)
  const ideas = recommendations.flatMap((match) => match.ideas)
  function saveProfile(profile: ApplicantProfile, isDemo = false) {
    if (!validateProfile(profile)) return
    setState((old) =>
      reconcile({
        ...old,
        profile,
        draft: profile,
        draftStep: 0,
        isDemo,
        answeredQuestions: [...questionIds],
      }),
    )
    setNotice('Сохраняем профиль и загружаем рекомендации.')
  }
  function updateProfile(patch: Partial<ApplicantProfile>) {
    setState((old) => (old.profile ? applyProfile(old, { ...old.profile, ...patch }) : old))
  }
  function toggleCompare(id: string) {
    if (!state.comparison.includes(id) && state.comparison.length >= 3) {
      setNotice('Можно сравнить до трёх программ. Уберите одну, чтобы добавить другую.')
      return
    }
    setState((old) =>
      reconcile({
        ...old,
        comparison: old.comparison.includes(id)
          ? old.comparison.filter((p) => p !== id)
          : [...old.comparison, id],
      }),
    )
  }
  function chooseFocus(id: string) {
    if (!programs.some((program) => program.id === id)) return
    setState((old) =>
      reconcile({
        ...old,
        focus: id,
        savedOptions: old.savedOptions.some((option) => option.programId === id)
          ? old.savedOptions
          : [...old.savedOptions, { programId: id, label: 'Priority' }],
      }),
    )
    setNotice('Приоритетная программа выбрана на текущий сеанс.')
  }
  function toggleTask(id: string) {
    setTaskStatus(id, state.completed.includes(id) ? 'planned' : 'completed')
  }
  function setTaskStatus(id: string, status: 'planned' | 'in-progress' | 'completed') {
    setState((old) =>
      reconcile({
        ...old,
        completed: [...old.completed.filter((v) => v !== id), ...(status === 'completed' ? [id] : [])],
        inProgress: [...old.inProgress.filter((v) => v !== id), ...(status === 'in-progress' ? [id] : [])],
      }),
    )
  }
  function saveOption(programId: string, label: ListLabel) {
    if (!programs.some((program) => program.id === programId)) return
    setState((old) =>
      reconcile({
        ...old,
        savedOptions: [
          ...old.savedOptions.filter((option) => option.programId !== programId),
          { programId, label },
        ],
      }),
    )
  }
  function removeOption(programId: string) {
    setState((old) =>
      reconcile({
        ...old,
        savedOptions: old.savedOptions.filter((option) => option.programId !== programId),
        focus: old.focus === programId ? null : old.focus,
      }),
    )
  }
  function answerQuestion(patch: Partial<ApplicantProfile>, id: string, nextStep: number) {
    setState((old) => {
      const draft = { ...old.draft, ...patch }
      if (!validateProfile(draft)) return old
      const next = {
        ...old,
        draft,
        draftStep: Math.min(nextStep, questionIds.length - 1),
        answeredQuestions: [...new Set([...old.answeredQuestions, id])],
      }
      return nextStep >= questionIds.length || old.profile
        ? reconcile({ ...next, profile: draft, isDemo: false })
        : next
    })
  }
  function addActivity(activity: Omit<PlannedActivity, 'id'>) {
    const entry = { ...activity, id: crypto.randomUUID() }
    if (!validActivity(entry)) return
    setState((old) =>
      old.activities.length >= 100 ||
      (entry.templateId && old.activities.some((item) => item.templateId === entry.templateId))
        ? old
        : reconcile({ ...old, activities: [...old.activities, entry] }),
    )
  }
  function updateActivity(id: string, patch: Partial<Omit<PlannedActivity, 'id'>>) {
    setState((old) =>
      reconcile({
        ...old,
        activities: old.activities.map((activity) => {
          const updated = { ...activity, ...patch }
          return activity.id === id && validActivity(updated) ? updated : activity
        }),
      }),
    )
  }
  async function activateAccount(identity: Identity) {
    return restore(identity, await api.profile())
  }
  async function signOut(discardUnsaved = false) {
    try {
      if (!discardUnsaved) await sync.current?.flush()
      await api.logout()
      sync.current?.stop()
      sync.current = null
      setSaveError('')
      setSaveStatus('saved')
      setState((old) => ({ ...initialState(), theme: old.theme }))
      return true
    } catch (error) {
      setNotice((error as Error).message)
      return false
    }
  }
  return {
    state,
    loading,
    saveStatus,
    saveError,
    conflict,
    retrySave: () => {
      void sync.current
        ?.retry()
        .then(() => setRecommendationAttempt((attempt) => attempt + 1))
        .catch(() => {})
    },
    reloadProfile: async () => {
      try {
        restore(await api.me(), await api.profile())
        setRecommendationAttempt((attempt) => attempt + 1)
      } catch (error) {
        setNotice((error as Error).message)
      }
    },
    notice,
    setNotice,
    dark,
    recommendations,
    recommendationsLoading,
    recommendationError,
    recommendationWarnings,
    retryRecommendations: () => setRecommendationAttempt((attempt) => attempt + 1),
    programs,
    universities,
    universityFor,
    ideas,
    nextTask,
    serverCompleted,
    focus,
    tasks,
    saveProfile,
    updateProfile,
    toggleCompare,
    chooseFocus,
    toggleTask,
    setTaskStatus,
    activateAccount,
    saveOption,
    removeOption,
    answerQuestion,
    addActivity,
    updateActivity,
    removeActivity: (id: string) =>
      setState((old) =>
        reconcile({ ...old, activities: old.activities.filter((activity) => activity.id !== id) }),
      ),
    signOut,
    setTheme: (theme: Theme) => setState((old) => ({ ...old, theme })),
    setDraft: (draft: ApplicantProfile) => setState((old) => ({ ...old, draft })),
    setDraftStep: (draftStep: number) => setState((old) => ({ ...old, draftStep })),
  }
}
export type Admission = ReturnType<typeof useAdmission>
