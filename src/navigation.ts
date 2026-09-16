import { LayoutDashboard, UserRound, GraduationCap, GitCompareArrows, Route } from 'lucide-react'

export const navigation = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { id: 'profile', label: 'Мой профиль', icon: UserRound },
  { id: 'programs', label: 'Подбор программ', icon: GraduationCap },
  { id: 'compare', label: 'Сравнение', icon: GitCompareArrows },
  { id: 'roadmap', label: 'Мой маршрут', icon: Route },
] as const
