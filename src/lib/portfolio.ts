import type { ActivityCategory } from '../types'
export const categoryOutcomes: Record<ActivityCategory, string> = {
  Hackathons: 'Работающий прототип, описание личного вклада и короткая демонстрация.',
  Volunteering: 'Полезный результат для сообщества, обратная связь и описание своей роли.',
  Research: 'Конкретный вопрос, воспроизводимый анализ или отчёт и ограничения исследования.',
  'Personal Projects': 'Приложение или анализ, документация и история улучшений.',
  Competitions: 'Решения тренировочных задач, разбор ошибок и подтверждение участия, если оно получено.',
}
export interface ActivityIdea {
  id: string
  category: ActivityCategory
  title: string
  description: string
  outcome: string
  suggestedPeriod: string
}
