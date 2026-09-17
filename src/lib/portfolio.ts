import { activityCategories, type ActivityCategory, type ApplicantProfile } from '../types'
import { ru } from './labels'
export const categoryOutcomes: Record<ActivityCategory, string> = {
  Hackathons: 'Работающий прототип, описание личного вклада и короткая демонстрация.',
  Volunteering: 'Полезный результат для сообщества, обратная связь и описание своей роли.',
  Research: 'Конкретный вопрос, воспроизводимый анализ или отчёт и ограничения исследования.',
  'Personal Projects': 'Приложение или анализ, документация и история улучшений.',
  Competitions: 'Решения тренировочных задач, разбор ошибок и подтверждение участия, если оно получено.',
  Leadership: 'План командной работы, заметки о встречах и обратная связь участников.',
}
export interface ActivityIdea {
  id: string
  category: ActivityCategory
  title: string
  description: string
  outcome: string
  suggestedPeriod: string
}
export function portfolioIdeas(profile: ApplicantProfile): ActivityIdea[] {
  const early = profile.grade <= 10
  const titles: Record<ActivityCategory, string> = {
    Hackathons: early ? 'Попробуйте школьный хакатон' : 'Создайте прототип вместе с командой',
    Volunteering: 'Помогите местному сообществу с цифровой задачей',
    Research: early ? 'Исследуйте небольшой вопрос' : 'Проведите воспроизводимое исследование',
    'Personal Projects':
      profile.interest === 'AI & data'
        ? 'Изучите открытый набор данных'
        : profile.interest === 'Cybersecurity'
          ? 'Создайте пособие по цифровой безопасности'
          : 'Создайте полезное приложение для школы',
    Competitions: early
      ? 'Решите несколько начальных задач по информатике'
      : 'Потренируйтесь решать задачи на время',
    Leadership: early
      ? 'Организуйте небольшую учебную группу'
      : 'Проведите короткий проект взаимного обучения',
  }
  return activityCategories
    .map((category) => ({
      id: `${category}:${profile.interest}:${early ? 'explore' : 'develop'}`,
      category,
      title: titles[category],
      outcome: categoryOutcomes[category],
      description: `${early ? 'Начните с небольшой задачи и попросите отзыв учителя.' : 'Определите результат и сохраните доказательства личного вклада.'} Свяжите работу с направлением «${ru(profile.interest)}».${profile.interest === 'Cybersecurity' ? ' Используйте собственные примеры, учебные стенды или системы, на изучение которых у вас есть разрешение.' : ''}`,
      suggestedPeriod: early ? 'Эта учебная четверть' : 'Ближайшие 6–8 недель',
    }))
    .sort(
      (a, b) =>
        Number(profile.extracurricularInterests.includes(b.category)) -
        Number(profile.extracurricularInterests.includes(a.category)),
    )
}
