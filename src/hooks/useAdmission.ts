import { useEffect, useState } from 'react'
import {
  recommend,
  createRoadmap,
  parseSavedState,
  storageKey,
  universities,
  type Profile,
  type View,
  type University,
} from '../model'
import { navigation } from '../navigation'

const getView = (): View => navigation.find((n) => `#${n.id}` === window.location.hash)?.id ?? 'overview'

export function useAdmission() {
  const [state, setState] = useState(() => {
    try {
      return parseSavedState(localStorage.getItem(storageKey))
    } catch {
      return parseSavedState(null)
    }
  })
  const [view, setView] = useState<View>(getView)
  const [profileOpen, setProfileOpen] = useState(false)
  const [details, setDetails] = useState<University | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [query, setQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('Все страны')
  const { profile, completed, comparison, isDemo } = state
  const recommendations = recommend(profile)
  const target = universities.find((u) => u.id === state.target) ?? recommendations[0].university
  const tasks = createRoadmap(profile, target)
  const completedCount = tasks.filter((t) => completed.includes(t.id)).length
  const progress = Math.round((completedCount / tasks.length) * 100)
  const nextTask = tasks.find((t) => !completed.includes(t.id))
  const journeyStage = completedCount === tasks.length ? 4 : state.target ? 2 : 1
  const title = navigation.find((n) => n.id === view)!.label
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [state])
  useEffect(() => {
    const change = () => setView(getView())
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  function navigate(next: View) {
    window.location.hash = next
    setView(next)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function toggleCompare(id: string) {
    if (!comparison.includes(id) && comparison.length >= 3) {
      setToast('Можно сравнить до трёх программ. Убери одну, чтобы добавить другую.')
      return
    }
    setState((s) => ({
      ...s,
      comparison: s.comparison.includes(id) ? s.comparison.filter((v) => v !== id) : [...s.comparison, id],
    }))
  }
  function toggleTask(id: string) {
    setState((s) => ({
      ...s,
      completed: s.completed.includes(id) ? s.completed.filter((t) => t !== id) : [...s.completed, id],
    }))
  }
  function saveProfile(p: Profile) {
    setState((s) => ({ ...s, profile: p, isDemo: false, completed: [], target: null }))
    setProfileOpen(false)
    navigate('profile')
    setToast('Профиль сохранён. Подбор и маршрут обновлены.')
  }
  function chooseTarget(u: University) {
    setState((s) => ({ ...s, target: u.id }))
    setDetails(null)
    navigate('roadmap')
    setToast(`Маршрут построен для ${u.name}`)
  }
  return {
    view,
    profileOpen,
    setProfileOpen,
    details,
    setDetails,
    helpOpen,
    setHelpOpen,
    mobileOpen,
    setMobileOpen,
    toast,
    setToast,
    storageError,
    query,
    setQuery,
    countryFilter,
    setCountryFilter,
    profile,
    completed,
    comparison,
    isDemo,
    recommendations,
    target,
    tasks,
    completedCount,
    progress,
    nextTask,
    journeyStage,
    title,
    navigate,
    toggleCompare,
    toggleTask,
    saveProfile,
    chooseTarget,
  }
}

export type AdmissionController = ReturnType<typeof useAdmission>
