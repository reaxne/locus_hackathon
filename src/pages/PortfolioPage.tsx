import { useState } from 'react'
import { Plus, Check, Trash2, ArrowRight } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { activityCategories, type ActivityCategory, type PlannedActivity } from '../types'
import { categoryOutcomes } from '../lib/portfolio'
import { Empty, Notice, PageHeading } from '../components/Shared'
import { Link } from '../lib/router'
import { ru } from '../lib/labels'

export default function PortfolioPage({ admission }: { admission: Admission }) {
  const [category, setCategory] = useState<ActivityCategory>('Personal Projects')
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All categories')
  const p = admission.state.profile
  if (!p)
    return (
      <Empty title="Определите направление для занятий" href="/diagnosis" action="Пройти анкету">
        Ваш класс и интересы помогают подобрать посильные проекты и занятия.
      </Empty>
    )
  const ideas = admission.ideas.filter((idea) => filter === 'All categories' || idea.category === filter)
  const full = admission.state.activities.length >= 100
  return (
    <>
      <PageHeading
        eyebrow="ПЛАН ПОРТФОЛИО"
        title="От идеи — к результату."
        description={`Идеи для ${p.grade} класса: ${ru(p.interest).toLowerCase()}. Выбирайте занятия по своим интересам и возможностям.`}
        back="/roadmap"
      >
        <Link className="button secondary" href="/roadmap">
          Мой маршрут
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <Notice>
        Это идеи для портфолио, а не подтверждённые проекты поступивших студентов или гарантия преимуществ.
        Проверьте условия участия и даты каждого мероприятия. Добавленные занятия доступны только в текущем
        сеансе.
      </Notice>
      <section className="panel portfolio-preferences">
        <h2>Что вы хотите попробовать?</h2>
        <p>
          Предпочтительные категории появляются первыми. Выбор категории не добавляет занятие в план
          автоматически.
        </p>
        <fieldset className="category-chips">
          <legend className="sr-only">Предпочтительные категории портфолио</legend>
          {activityCategories.map((item) => (
            <label key={item} className={p.extracurricularInterests.includes(item) ? 'selected' : ''}>
              <input
                type="checkbox"
                checked={p.extracurricularInterests.includes(item)}
                onChange={(e) =>
                  admission.updateProfile({
                    extracurricularInterests: e.target.checked
                      ? [...p.extracurricularInterests, item]
                      : p.extracurricularInterests.filter((c) => c !== item),
                  })
                }
              />
              {ru(item)}
            </label>
          ))}
        </fieldset>
      </section>
      <div className="section-intro">
        <div>
          <span className="eyebrow">ПОПРОБУЙТЕ НОВОЕ</span>
          <h2>Идеи занятий</h2>
        </div>
        <label>
          Фильтр по категории
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All categories">Все категории</option>
            {activityCategories.map((item) => (
              <option key={item} value={item}>
                {ru(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="activity-ideas">
        {ideas.map((idea) => {
          const added = admission.state.activities.some((activity) => activity.templateId === idea.id)
          return (
            <article className="panel activity-idea" key={idea.id}>
              <span className="pill subtle">{ru(idea.category)}</span>
              <h3>{idea.title}</h3>
              <p>{idea.description}</p>
              <div className="activity-outcome">
                <span className="small-label">ВОЗМОЖНЫЙ РЕЗУЛЬТАТ</span>
                <p>{idea.outcome}</p>
              </div>
              <small>Примерный период: {idea.suggestedPeriod}</small>
              <button
                className={`button ${added ? 'secondary' : 'primary'}`}
                disabled={added || full}
                onClick={() =>
                  admission.addActivity({
                    templateId: idea.id,
                    category: idea.category,
                    title: idea.title,
                    targetPeriod: idea.suggestedPeriod,
                    status: 'planned',
                  })
                }
              >
                {added ? (
                  <>
                    <Check size={15} />
                    Добавлено в план
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Добавить занятие
                  </>
                )}
              </button>
            </article>
          )
        })}
      </div>
      <section className="panel custom-activity">
        <h2>Добавить своё занятие</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!title.trim()) {
              setError('Напишите короткое название занятия.')
              return
            }
            admission.addActivity({
              templateId: null,
              title: title.trim(),
              category,
              targetPeriod: period.trim(),
              status: 'planned',
            })
            setTitle('')
            setPeriod('')
            setError('')
          }}
        >
          <div className="custom-activity-fields">
            <label>
              Название занятия
              <input
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, школьный кружок программирования"
              />
            </label>
            <label>
              Категория занятия
              <select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)}>
                {activityCategories.map((item) => (
                  <option key={item} value={item}>
                    {ru(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Целевой период
              <input
                maxLength={80}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Например, октябрь 2026"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button className="button primary" disabled={full} type="submit">
            <Plus size={16} />
            Добавить в мой план
          </button>
        </form>
        {full && <p role="status">В плане 100 занятий. Удалите одно, чтобы добавить новое.</p>}
      </section>
      <div className="section-intro">
        <div>
          <span className="eyebrow">ВАШИ ПЛАНЫ</span>
          <h2>Мои занятия · {admission.state.activities.length}</h2>
        </div>
      </div>
      {!admission.state.activities.length ? (
        <div className="empty panel">
          <h2>Начните с небольшого занятия.</h2>
          <p>Добавьте идею из списка или опишите свою. Укажите период и отслеживайте прогресс.</p>
        </div>
      ) : (
        <div className="planned-activities">
          {admission.state.activities.map((activity) => (
            <article
              className={`panel planned-activity ${activity.status === 'completed' ? 'completed' : ''}`}
              key={activity.id}
            >
              <div className="card-top">
                <span className="pill">{ru(activity.category)}</span>
                <button
                  className="icon-button"
                  aria-label={`Удалить занятие: ${activity.title}`}
                  onClick={() => admission.removeActivity(activity.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3>{activity.title}</h3>
              <p>{categoryOutcomes[activity.category]}</p>
              <div className="form-grid">
                <label>
                  Целевой период
                  <input
                    maxLength={80}
                    value={activity.targetPeriod}
                    placeholder="Выберите период"
                    onChange={(e) => admission.updateActivity(activity.id, { targetPeriod: e.target.value })}
                  />
                  <small>Ваша цель, а не официальный срок</small>
                </label>
                <label>
                  Прогресс
                  <select
                    aria-label="Прогресс"
                    value={activity.status}
                    onChange={(e) =>
                      admission.updateActivity(activity.id, {
                        status: e.target.value as PlannedActivity['status'],
                      })
                    }
                  >
                    <option value="planned">Запланировано</option>
                    <option value="in-progress">В процессе</option>
                    <option value="completed">Завершено</option>
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
