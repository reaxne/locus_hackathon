import { useState } from 'react'
import { Plus, Check, Trash2, ArrowRight } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { activityCategories, type ActivityCategory, type PlannedActivity } from '../types'
import { portfolioIdeas, categoryOutcomes } from '../lib/portfolio'
import { Empty, Notice, PageHeading } from '../components/Shared'
import { Link } from '../lib/router'

export default function PortfolioPage({ admission }: { admission: Admission }) {
  const [category, setCategory] = useState<ActivityCategory>('Personal Projects')
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All categories')
  const p = admission.state.profile
  if (!p)
    return (
      <Empty title="Give your activities a direction" href="/diagnosis" action="Begin diagnosis">
        Your grade and interests help us suggest achievable projects and activities.
      </Empty>
    )
  const ideas = portfolioIdeas(p).filter((idea) => filter === 'All categories' || idea.category === filter)
  const full = admission.state.activities.length >= 100
  return (
    <>
      <PageHeading
        eyebrow="PORTFOLIO PLAN"
        title="Build something you can reflect on."
        description={`Ideas for grade ${p.grade} and ${p.interest.toLowerCase()}. Choose activities that fit your time and interests.`}
        back="/dashboard"
      >
        <Link className="button secondary" href="/roadmap">
          View roadmap
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <Notice>
        These are portfolio ideas, not verified projects by admitted students or guaranteed admission
        advantages. Participation and outcomes depend on your own work. Check any event's eligibility and
        dates yourself.
      </Notice>
      <section className="panel portfolio-preferences">
        <h2>What would you like to explore?</h2>
        <p>
          Preferred categories move to the top of your suggestions. Choosing a category does not add an
          activity automatically.
        </p>
        <fieldset className="category-chips">
          <legend className="sr-only">Preferred portfolio categories</legend>
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
              {item}
            </label>
          ))}
        </fieldset>
      </section>
      <div className="section-intro">
        <div>
          <span className="eyebrow">EXPLORE THE POSSIBILITIES</span>
          <h2>Suggested activities</h2>
        </div>
        <label>
          Category filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All categories</option>
            {activityCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="activity-ideas">
        {ideas.map((idea) => {
          const added = admission.state.activities.some((activity) => activity.templateId === idea.id)
          return (
            <article className="panel activity-idea" key={idea.id}>
              <span className="pill subtle">{idea.category}</span>
              <h3>{idea.title}</h3>
              <p>{idea.description}</p>
              <div className="activity-outcome">
                <span className="small-label">POSSIBLE OUTCOME</span>
                <p>{idea.outcome}</p>
              </div>
              <small>Suggested period: {idea.suggestedPeriod}</small>
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
                    Added to plan
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Add activity
                  </>
                )}
              </button>
            </article>
          )
        })}
      </div>
      <section className="panel custom-activity">
        <h2>Add your own activity</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!title.trim()) {
              setError('Give your activity a short title.')
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
              Activity title
              <input
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="For example, a school coding workshop"
              />
            </label>
            <label>
              Activity category
              <select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)}>
                {activityCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Target period
              <input
                maxLength={80}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="For example, October 2026"
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
            Add to my plan
          </button>
        </form>
        {full && <p role="status">Your plan contains 100 activities. Remove one before adding another.</p>}
      </section>
      <div className="section-intro">
        <div>
          <span className="eyebrow">YOUR OWN COMMITMENTS</span>
          <h2>My activities · {admission.state.activities.length}</h2>
        </div>
      </div>
      {!admission.state.activities.length ? (
        <div className="empty panel">
          <h2>Start with one small activity.</h2>
          <p>
            Add a suggestion above or describe your own idea. You can set a target period and track progress
            here.
          </p>
        </div>
      ) : (
        <div className="planned-activities">
          {admission.state.activities.map((activity) => (
            <article
              className={`panel planned-activity ${activity.status === 'completed' ? 'completed' : ''}`}
              key={activity.id}
            >
              <div className="card-top">
                <span className="pill">{activity.category}</span>
                <button
                  className="icon-button"
                  aria-label={`Remove activity: ${activity.title}`}
                  onClick={() => admission.removeActivity(activity.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3>{activity.title}</h3>
              <p>{categoryOutcomes[activity.category]}</p>
              <div className="form-grid">
                <label>
                  Target period
                  <input
                    maxLength={80}
                    value={activity.targetPeriod}
                    placeholder="Choose a period"
                    onChange={(e) => admission.updateActivity(activity.id, { targetPeriod: e.target.value })}
                  />
                  <small>Your own target, not an official deadline</small>
                </label>
                <label>
                  Progress
                  <select
                    aria-label="Progress"
                    value={activity.status}
                    onChange={(e) =>
                      admission.updateActivity(activity.id, {
                        status: e.target.value as PlannedActivity['status'],
                      })
                    }
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
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
