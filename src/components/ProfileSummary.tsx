import { Pencil } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { money } from '../data/universities'
import { questionIds, examLabel, statusLabels } from '../lib/profile'
import { examNames } from '../types'
import { useRouter } from '../lib/router'
import { ru } from '../lib/labels'

export default function ProfileSummary({
  admission,
  compact = false,
}: {
  admission: Admission
  compact?: boolean
}) {
  const p = admission.state.profile!
  const { go } = useRouter()
  const rows: { id: string; label: string; value: string }[] = [
    { id: 'grade', label: 'Класс', value: `${p.grade} класс` },
    { id: 'entryYear', label: 'Год поступления', value: String(p.entryYear) },
    { id: 'interest', label: 'Главное направление', value: ru(p.interest) },
    { id: 'city', label: 'Предпочтительный город', value: ru(p.city) },
    {
      id: 'studyLanguage',
      label: 'Язык обучения',
      value: { any: 'Любой', ru: 'Русский', kk: 'Казахский', en: 'Английский' }[p.studyLanguage],
    },
    {
      id: 'academicPerformance',
      label: 'Успеваемость',
      value: {
        unknown: 'Пока не оценена',
        excellent: 'Отличная',
        good: 'Хорошая',
        'needs-support': 'Нужна поддержка',
      }[p.academicPerformance],
    },
    { id: 'constraints', label: 'Ограничения и пожелания', value: p.constraints || 'Не указаны' },
    {
      id: 'mustStay',
      label: 'Возможность переезда',
      value: p.mustStay ? 'Только выбранный город' : 'Готов рассмотреть переезд',
    },
    { id: 'budget', label: 'Бюджет на год', value: p.budget === null ? 'Пока неизвестно' : money(p.budget) },
    {
      id: 'funding',
      label: 'Финансирование',
      value: { self: 'Платное обучение', grant: 'Нужен грант', either: 'Рассматриваю оба варианта' }[
        p.funding
      ],
    },
    {
      id: 'category',
      label: 'Категория абитуриента',
      value: {
        domestic: 'Гражданин Казахстана',
        international: 'Иностранный абитуриент',
        unknown: 'Пока не знаю',
      }[p.category],
    },
    {
      id: 'academicStrengths',
      label: 'Сильные стороны',
      value: p.academicStrengths.map(ru).join(', ') || 'Ещё определяюсь',
    },
    {
      id: 'extracurricularInterests',
      label: 'Внеучебные интересы',
      value: p.extracurricularInterests.map(ru).join(', ') || 'Открыт к идеям',
    },
    ...examNames.map((exam) => ({
      id: exam,
      label: examLabel(exam),
      value: `${statusLabels[p.exams[exam].status]}${p.exams[exam].score === null ? '' : ` · ${p.exams[exam].score}`}`,
    })),
  ]
  return (
    <dl className={`profile-summary ${compact ? 'compact' : ''}`}>
      {rows.map((row) => (
        <div key={row.id}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
          <button
            className="icon-button"
            aria-label={`Изменить: ${row.label}`}
            onClick={() => {
              admission.setDraft(p)
              admission.setDraftStep(questionIds.findIndex((id) => id === row.id))
              go('/diagnosis')
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
      ))}
    </dl>
  )
}
