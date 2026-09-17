import { useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
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

function ExamGoalCard({ exam, admission }: { exam: GoalExamName; admission: Admission }) {
  const p = admission.state.profile!
  const [status, setStatus] = useState<ExamStatus>(p.exams[exam].status)
  const [score, setScore] = useState(p.exams[exam].score === null ? '' : String(p.exams[exam].score))
  const [target, setTarget] = useState(
    p.examGoals[exam].targetScore === null ? '' : String(p.examGoals[exam].targetScore),
  )
  const [date, setDate] = useState(p.examGoals[exam].targetDate ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [min, max, step] = examLimits[exam]
  function save(event: React.FormEvent) {
    event.preventDefault()
    const goal = { targetScore: target === '' ? null : Number(target), targetDate: date || null }
    const current = score === '' || status !== 'completed' ? null : Number(score)
    if (!validGoal(exam, goal) || !validScore(exam, current)) {
      setError(
        `Use a score from ${min} to ${max} in steps of ${step} and a valid target date, or leave values unknown.`,
      )
      return
    }
    if (status === 'not-planned' && (goal.targetScore !== null || goal.targetDate !== null)) {
      setError(
        'Choose Planned to keep a target, or clear the target fields if you are not planning this exam.',
      )
      return
    }
    admission.updateProfile({
      exams: { ...p.exams, [exam]: { status, score: current } },
      examGoals: { ...p.examGoals, [exam]: goal },
    })
    setError('')
    setSaved(true)
  }
  return (
    <article className="panel exam-goal-card">
      <div className="card-top">
        <h2>{examLabel(exam)}</h2>
        <span className="pill subtle">Personal goal</span>
      </div>
      <p>{examResources[exam].guidance}</p>
      <form noValidate onSubmit={save} onChange={() => setSaved(false)}>
        <label>
          Current status
          <select
            aria-label={`${exam} current status`}
            value={status}
            onChange={(e) => {
              const next = e.target.value as ExamStatus
              setStatus(next)
              if (next !== 'completed') setScore('')
            }}
          >
            <option value="unknown">Unknown</option>
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="not-planned">Not planned</option>
          </select>
        </label>
        <div className="form-grid">
          <label>
            Current official score
            <input
              aria-label={`${exam} current score`}
              type="number"
              min={min}
              max={max}
              step={step}
              disabled={status !== 'completed'}
              placeholder="Unknown"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            <small>
              {status === 'completed'
                ? 'Leave blank if the result is unknown.'
                : 'Available when status is Completed.'}
            </small>
          </label>
          <label>
            Target score
            <input
              aria-label={`${exam} target score`}
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder="Not set"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <small>
              {min}–{max} · personal target
            </small>
          </label>
        </div>
        <label>
          Target date
          <input
            aria-label={`${exam} target date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <small>Your intended date, not a verified exam session or admission deadline.</small>
        </label>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="exam-save-row">
          <button className="button primary" type="submit">
            Save {examLabel(exam)} goal
          </button>
          {saved && (
            <span role="status">
              <Check size={14} />
              Saved
            </span>
          )}
        </div>
      </form>
      <External href={examResources[exam].url}>{examResources[exam].label}</External>
      <small className="current-goal-note">
        Saved: {statusLabels[p.exams[exam].status]} · Target {p.examGoals[exam].targetScore ?? 'not set'} ·{' '}
        {p.examGoals[exam].targetDate ?? 'no date'}
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
      <h2>IELTS diagnostic section scores</h2>
      <p>
        Optional practice estimates. These stay separate from your official IELTS result and guide the
        weak-section step in your roadmap.
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const scores = emptySectionScores()
          for (const section of ieltsSections) {
            const value = values[section] === '' ? null : Number(values[section])
            if (!validScore('IELTS', value)) {
              setMessage('Use 0–9 in half-band steps, or leave a section unknown.')
              return
            }
            scores[section] = value
          }
          admission.updateProfile({ ieltsSectionScores: scores as ApplicantProfile['ieltsSectionScores'] })
          setMessage('Section scores saved. Your practice steps have been updated.')
        }}
      >
        <div className="section-score-inputs">
          {ieltsSections.map((section) => (
            <label key={section}>
              {section}
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                placeholder="Unknown"
                value={values[section]}
                onChange={(e) => setValues((old) => ({ ...old, [section]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button className="button secondary" type="submit">
          Save section scores
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  )
}
export default function ExamGoalsPage({ admission }: { admission: Admission }) {
  if (!admission.state.profile)
    return (
      <Empty title="Set a starting point first" href="/diagnosis" action="Begin diagnosis">
        Your profile keeps exam status and personal targets together.
      </Empty>
    )
  return (
    <>
      <PageHeading
        eyebrow="EXAM GOALS"
        title="Make your preparation specific."
        description="Record your current status, choose a target, and turn it into small practice steps."
        back="/dashboard"
      >
        <Link className="button secondary" href="/roadmap">
          See preparation steps
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <Notice>
        You do not need every exam. Check each university's accepted routes before deciding what to take.
        Target scores and dates below are your own goals, not confirmed admission thresholds or scheduled test
        sessions.
      </Notice>
      <div className="exam-goals-grid">
        {goalExamNames.map((exam) => (
          <ExamGoalCard key={exam} exam={exam} admission={admission} />
        ))}
      </div>
      <SectionScores admission={admission} />
      <p className="aet-note">
        AET status is available in <Link href="/profile">Profile</Link>. Confirm AITU's module rules with its
        admissions office; this planner does not interpret AET scores.
      </p>
    </>
  )
}
