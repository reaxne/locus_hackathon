import { useEffect, useState } from 'react'
import { programs } from '../data/universities'
import { recommend } from '../lib/matching'
import { createPlan } from '../lib/roadmap'
import {
  applyProfile,
  demoProfile,
  initialState,
  legacyStorageKey,
  parseSavedState,
  reconcile,
  storageKey,
  validateProfile,
  validActivity,
} from '../lib/persistence'
import { questionIds } from '../lib/profile'
import type { ApplicantProfile, Theme, ListLabel, PlannedActivity } from '../types'

export function useAdmission() {
  const [loaded] = useState(() => {
    try {
      return {
        ...parseSavedState(localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey)),
        unavailable: false,
      }
    } catch {
      return { state: initialState(), recovered: false, unavailable: true }
    }
  })
  const [state, setState] = useState(loaded.state)
  const [storageError, setStorageError] = useState(loaded.unavailable)
  const [notice, setNotice] = useState(
    loaded.recovered
      ? 'Saved data could not be read in full. Valid progress was retained where possible; please review your profile.'
      : '',
  )
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [state])
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
  const recommendations = state.profile ? recommend(state.profile) : []
  const focus = programs.find((p) => p.id === state.focus)
  const tasks = state.profile
    ? createPlan(state.profile, state.savedOptions, state.activities, state.focus)
    : []
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
    setNotice('Your answers, recommendations and plan are up to date.')
  }
  function updateProfile(patch: Partial<ApplicantProfile>) {
    setState((old) => (old.profile ? applyProfile(old, { ...old.profile, ...patch }) : old))
  }
  function toggleCompare(id: string) {
    if (!state.comparison.includes(id) && state.comparison.length >= 3) {
      setNotice('You can compare up to three programs. Remove one to add another.')
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
          : [...old.savedOptions, { programId: id, label: 'Considering' }],
      }),
    )
    setNotice('Your focus is saved. The plan includes your saved programs, goals and activities.')
  }
  function toggleTask(id: string) {
    setState((old) =>
      reconcile({
        ...old,
        completed: old.completed.includes(id)
          ? old.completed.filter((v) => v !== id)
          : [...old.completed, id],
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
  return {
    state,
    storageError,
    notice,
    setNotice,
    dark,
    recommendations,
    focus,
    tasks,
    saveProfile,
    updateProfile,
    toggleCompare,
    chooseFocus,
    toggleTask,
    saveOption,
    removeOption,
    answerQuestion,
    addActivity,
    updateActivity,
    removeActivity: (id: string) =>
      setState((old) =>
        reconcile({ ...old, activities: old.activities.filter((activity) => activity.id !== id) }),
      ),
    signIn: (displayName: string) =>
      setState((old) => ({
        ...old,
        demoSession: { displayName: displayName.trim().slice(0, 40) || 'Student' },
      })),
    signOut: () => setState((old) => ({ ...old, demoSession: null })),
    setTheme: (theme: Theme) => setState((old) => ({ ...old, theme })),
    setDraft: (draft: ApplicantProfile) => setState((old) => ({ ...old, draft })),
    setDraftStep: (draftStep: number) => setState((old) => ({ ...old, draftStep })),
    loadDemo: () => saveProfile(demoProfile(), true),
  }
}
export type Admission = ReturnType<typeof useAdmission>
