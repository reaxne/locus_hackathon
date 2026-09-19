import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import {
  goalExamNames,
  ieltsSections,
  type GoalExamName,
  type ExamStatus,
  type ApplicantProfile,
} from '../types'
import {
  examLimits,
  examLabel,
  statusLabels,
  validGoal,
  validScore,
  emptySectionScores,
} from '../lib/profile'
import { examResources } from '../data/exams'
import { Empty, External, Notice, PageHeading } from '../components/Shared'
import { Link } from '../lib/router'
import { ru } from '../lib/labels'

function ExamGoalCard({ exam, admission }: { exam: GoalExamName; admission: Admission }) {
  const p = admission.state.profile!
  const [status, setStatus] = useState<ExamStatus>(p.exams[exam].status)
  const [score, setScore] = useState(p.exams[exam].score === null ? '' : String(p.exams[exam].score))
  const [target, setTarget] = useState(
    p.examGoals[exam].targetScore === null ? '' : String(p.examGoals[exam].targetScore),
  )
  const [date, setDate] = useState(p.examGoals[exam].targetDate ?? '')
  const [error, setError] = useState('')
  const [min, max, step] = examLimits[exam]
  function save(event: React.FormEvent) {
    event.preventDefault()
    const goal = { targetScore: target === '' ? null : Number(target), targetDate: date || null }
    const current = score === '' || status !== 'completed' ? null : Number(score)
    if (!validGoal(exam, goal) || !validScore(exam, current)) {
      setError(
        `Укажите балл от ${min} до ${max} с шагом ${step} и корректную дату или оставьте поля пустыми.`,
      )
      return
    }
    if (status === 'not-planned' && (goal.targetScore !== null || goal.targetDate !== null)) {
      setError('Выберите «Запланировано», чтобы сохранить цель, или очистите её, если не планируете экзамен.')
      return
    }
    admission.updateProfile({
      exams: { ...p.exams, [exam]: { status, score: current } },
      examGoals: { ...p.examGoals, [exam]: goal },
    })
    setError('')
  }
  return (
    <article className="panel exam-goal-card">
      <div className="card-top">
        <h2>{examLabel(exam)}</h2>
        <span className="pill subtle">Личная цель</span>
      </div>
      <p>{examResources[exam].guidance}</p>
      <form noValidate onSubmit={save}>
        <label>
          Текущий статус
          <select
            aria-label={`${examLabel(exam)}: текущий статус`}
            value={status}
            onChange={(e) => {
              const next = e.target.value as ExamStatus
              setStatus(next)
              if (next !== 'completed') setScore('')
            }}
          >
            <option value="unknown">Пока неизвестно</option>
            <option value="planned">Запланировано</option>
            <option value="completed">Завершено</option>
            <option value="not-planned">Не планирую</option>
          </select>
        </label>
        <div className="form-grid">
          <label>
            Текущий официальный балл
            <input
              aria-label={`${examLabel(exam)}: текущий балл`}
              type="number"
              min={min}
              max={max}
              step={step}
              disabled={status !== 'completed'}
              placeholder="Пока неизвестно"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            <small>
              {status === 'completed'
                ? 'Оставьте пустым, если результат неизвестен.'
                : 'Доступно для статуса «Завершено».'}
            </small>
          </label>
          <label>
            Целевой балл
            <input
              aria-label={`${examLabel(exam)}: целевой балл`}
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder="Не задан"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <small>
              {min}–{max} · личная цель
            </small>
          </label>
        </div>
        <label>
          Целевая дата
          <input
            aria-label={`${examLabel(exam)}: целевая дата`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <small>Ваша планируемая дата, а не подтверждённая дата экзамена или поступления.</small>
        </label>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="exam-save-row">
          <button className="button primary" type="submit">
            Сохранить цель {examLabel(exam)}
          </button>
        </div>
      </form>
      <External href={examResources[exam].url}>{examResources[exam].label}</External>
      <small className="current-goal-note">
        Текущий план: {statusLabels[p.exams[exam].status]} · Цель{' '}
        {p.examGoals[exam].targetScore ?? 'не задана'} · {p.examGoals[exam].targetDate ?? 'дата не задана'}
      </small>
    </article>
  )
}
function SectionScores({ admission }: { admission: Admission }) {
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(
        ieltsSections.map((section) => [
          section,
          admission.state.profile!.ieltsSectionScores[section] === null
            ? ''
            : String(admission.state.profile!.ieltsSectionScores[section]),
        ]),
      ) as Record<(typeof ieltsSections)[number], string>,
  )
  const [message, setMessage] = useState('')
  return (
    <section className="panel section-scores">
      <h2>Диагностика IELTS по разделам</h2>
      <p>
        Необязательные результаты пробного теста. Они хранятся отдельно от официального результата и помогают
        выбрать слабый раздел в маршруте.
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const scores = emptySectionScores()
          for (const section of ieltsSections) {
            const value = values[section] === '' ? null : Number(values[section])
            if (!validScore('IELTS', value)) {
              setMessage('Укажите от 0 до 9 с шагом 0,5 или оставьте поле пустым.')
              return
            }
            scores[section] = value
          }
          admission.updateProfile({ ieltsSectionScores: scores as ApplicantProfile['ieltsSectionScores'] })
          setMessage('Баллы по разделам сохранены. Шаги подготовки обновлены.')
        }}
      >
        <div className="section-score-inputs">
          {ieltsSections.map((section) => (
            <label key={section}>
              {ru(section)}
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                placeholder="Пока неизвестно"
                value={values[section]}
                onChange={(e) => setValues((old) => ({ ...old, [section]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button className="button secondary" type="submit">
          Сохранить баллы по разделам
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  )
}
export default function ExamGoalsPage({ admission }: { admission: Admission }) {
  if (!admission.state.profile)
    return (
      <Empty title="Сначала заполните анкету" href="/diagnosis" action="Пройти анкету" art="survey">
        Статусы экзаменов и личные цели сохраняются в профиле.
      </Empty>
    )
  return (
    <>
      <PageHeading
        eyebrow="ЦЕЛИ ПО ЭКЗАМЕНАМ"
        title="Подготовка с понятной целью."
        description="Укажите текущий статус, выберите цель и разбейте подготовку на небольшие шаги."
        back="/roadmap"
      >
        <Link className="button secondary" href="/roadmap">
          Мой маршрут
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <Notice>
        Не все экзамены нужны каждому абитуриенту. Сначала проверьте пути поступления в выбранный университет.
        Баллы и даты ниже — ваши личные цели, а не подтверждённые требования и расписание.
      </Notice>
      <div className="exam-goals-grid">
        {goalExamNames.map((exam) => (
          <ExamGoalCard key={exam} exam={exam} admission={admission} />
        ))}
      </div>
      <SectionScores admission={admission} />
      <p className="aet-note">
        Статус AET доступен в <Link href="/profile">профиле</Link>. Правила модулей уточните в приёмной
        комиссии AITU; планировщик не интерпретирует баллы AET.
      </p>
    </>
  )
}
