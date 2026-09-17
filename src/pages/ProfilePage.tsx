import { ArrowRight, Download } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { Empty, Notice, PageHeading } from '../components/Shared'
import ProfileSummary from '../components/ProfileSummary'
import { exportProfile, examLabel } from '../lib/profile'
import { goalExamNames } from '../types'
import { Link } from '../lib/router'

export default function ProfilePage({ admission }: { admission: Admission }) {
  const p = admission.state.profile
  if (!p)
    return (
      <Empty title="Start with one question" href="/diagnosis" action="Begin diagnosis">
        Tell us about your interests and plans. Your answers save automatically as you go.
      </Empty>
    )
  return (
    <>
      <PageHeading
        eyebrow="YOUR PROFILE"
        title="Your starting point, in one place."
        description="Edit any answer. Your university matches and roadmap update with your plans."
        back={admission.state.demoSession ? '/dashboard' : '/universities'}
      >
        <button className="button secondary" onClick={() => exportProfile(p)}>
          <Download size={16} />
          Export my profile as JSON
        </button>
      </PageHeading>
      {admission.state.isDemo && (
        <Notice>This is an illustrative sample profile. Edit any answer to make it yours.</Notice>
      )}
      <section className="panel summary-panel">
        <div className="section-intro">
          <div>
            <span className="eyebrow">YOUR ANSWERS</span>
            <h2>Goals, strengths and preferences</h2>
          </div>
          <span className="pill">Saved on this device</span>
        </div>
        <ProfileSummary admission={admission} />
      </section>
      <section className="panel summary-panel">
        <div className="section-intro">
          <div>
            <span className="eyebrow">YOUR EXAM GOALS</span>
            <h2>Personal targets</h2>
          </div>
          <Link className="button secondary" href="/exam-goals">
            Edit exam goals
          </Link>
        </div>
        <div className="profile-goals">
          {goalExamNames.map((exam) => (
            <article key={exam}>
              <strong>{examLabel(exam)}</strong>
              <span>Current: {p.exams[exam].score ?? 'Unknown'}</span>
              <span>Target: {p.examGoals[exam].targetScore ?? 'Not set'}</span>
              <small>{p.examGoals[exam].targetDate ?? 'No target date'} · personal goal</small>
            </article>
          ))}
        </div>
        <p className="muted">
          These targets are yours. They do not mean every university requires these exams.
        </p>
      </section>
      <div className="page-action">
        <p>Official requirements, fees and deadlines still need checking for your intake.</p>
        <Link className="button primary" href="/universities">
          See universities
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  )
}
