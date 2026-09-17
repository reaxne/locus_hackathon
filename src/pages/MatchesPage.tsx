import { useState } from 'react'
import { ArrowRight, GitCompareArrows, X } from 'lucide-react'
import { interests, type ApplicantProfile, type MatchGroup } from '../types'
import { programs, universities } from '../data/universities'
import type { Admission } from '../hooks/useAdmission'
import ProgramCard from '../components/ProgramCard'
import { Empty, Notice, PageHeading } from '../components/Shared'
import { Link } from '../lib/router'
import ProfileSummary from '../components/ProfileSummary'

export default function MatchesPage({ admission }: { admission: Admission }) {
  const [query, setQuery] = useState('')
  const [universityFilter, setUniversityFilter] = useState('all')
  const [budgetFilter, setBudgetFilter] = useState('all')
  const profile = admission.state.profile
  if (!profile)
    return (
      <Empty title="Your shortlist starts with you">
        Complete your profile to see reasons tailored to your answers.
      </Empty>
    )
  const visible = admission.recommendations.filter(
    (match) =>
      `${match.program.title.value} ${match.university.name} ${match.university.shortName}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (universityFilter === 'all' || match.university.id === universityFilter) &&
      (budgetFilter === 'all' || match.group === budgetFilter),
  )
  return (
    <>
      <PageHeading
        eyebrow="YOUR OPTIONS"
        title="A shortlist with context."
        description="Explore the reasons, check the unknowns, then choose two or three programs to compare."
        back={admission.state.demoSession ? '/dashboard' : '/profile'}
      >
        <Link className="button secondary" href="/profile">
          Edit profile
        </Link>
      </PageHeading>
      <details className="panel search-profile-summary">
        <summary>Your saved diagnosis · review or edit any answer</summary>
        <ProfileSummary admission={admission} compact />
      </details>
      <section className="match-controls panel" aria-label="Refine recommendations">
        <label>
          Primary interest
          <select
            aria-label="Primary interest"
            value={profile.interest}
            onChange={(e) =>
              admission.updateProfile({ interest: e.target.value as ApplicantProfile['interest'] })
            }
          >
            {interests.map((interest) => (
              <option key={interest}>{interest}</option>
            ))}
          </select>
        </label>
        <label>
          Annual budget (KZT)
          <input
            type="number"
            min="0"
            max="100000000"
            placeholder="Unknown"
            value={profile.budget ?? ''}
            onChange={(e) => {
              const budget = e.target.value === '' ? null : Number(e.target.value)
              if (budget === null || (budget >= 0 && budget <= 100000000)) admission.updateProfile({ budget })
            }}
          />
        </label>
        <label>
          Find a program
          <input
            type="search"
            placeholder="University or program"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </section>
      <div className="search-filters">
        <label>
          University
          <select
            aria-label="University"
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
          >
            <option value="all">All universities</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Budget verification
          <select
            aria-label="Budget verification"
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
          >
            <option value="all">All budget groups</option>
            {(['Fits your verified budget', 'Needs verification', 'Over budget'] as const).map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
        </label>
        <button
          className="text-button"
          onClick={() => {
            setQuery('')
            setUniversityFilter('all')
            setBudgetFilter('all')
          }}
        >
          Reset search filters
        </button>
      </div>
      <Notice>
        These are options to investigate, not admission decisions. Prices and rules must apply to your{' '}
        {profile.entryYear} intake. <Link href="/sources">How matching works</Link>
      </Notice>
      <div className="section-meta">
        <span>
          {visible.length} programs · {new Set(visible.map((m) => m.university.id)).size} universities
        </span>
        <span>Ordered by your preferences within each budget group</span>
      </div>
      {visible.length > 0 ? (
        (['Fits your verified budget', 'Needs verification', 'Over budget'] as MatchGroup[]).map((group) => {
          const members = visible.filter((match) => match.group === group)
          if (!members.length) return null
          return (
            <section className="match-group" key={group} aria-label={group}>
              <div className="group-heading">
                <h2>{group}</h2>
                <span>{members.length} options</span>
              </div>
              <div className="program-grid">
                {members.map((match) => (
                  <ProgramCard key={match.program.id} match={match} admission={admission} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <section className="empty panel">
          <h2>No options within these filters</h2>
          <p>
            {query || universityFilter !== 'all' || budgetFilter !== 'all'
              ? 'No programs match these search filters. Try another university, search term or budget group.'
              : `Our curated collection currently covers Astana. Your strict city preference is ${profile.city}. We have not included programs outside that constraint.`}
          </p>
          <div className="button-row">
            {query || universityFilter !== 'all' || budgetFilter !== 'all' ? (
              <button
                className="button secondary"
                onClick={() => {
                  setQuery('')
                  setUniversityFilter('all')
                  setBudgetFilter('all')
                }}
              >
                Clear search
              </button>
            ) : (
              <button
                className="button secondary"
                onClick={() => admission.updateProfile({ city: 'Any city', mustStay: false })}
              >
                Explore all verified options · relax city limit
              </button>
            )}
            <Link className="button primary" href="/profile">
              Edit profile
            </Link>
          </div>
        </section>
      )}
      {visible.length > 0 && !visible.some((m) => m.group === 'Fits your verified budget') && (
        <Notice>
          No program has a confirmed price within your budget for this intake and category. Unknown costs need
          checking; a larger budget alone cannot verify them.{' '}
          <Link href="/profile">Review or increase your budget</Link>.
        </Notice>
      )}
      <section className="dashboard-invitation">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>Turn your options into a personal plan.</h2>
          <p>Your answers and saved options carry over. Demo sign-in accepts everyone, with no password.</p>
        </div>
        <Link className="button primary" href={admission.state.demoSession ? '/dashboard' : '/sign-in'}>
          Continue to my dashboard
          <ArrowRight size={17} />
        </Link>
      </section>
      <div className="comparison-tray">
        <div className="tray-summary">
          <GitCompareArrows size={22} />
          <div>
            <strong>{admission.state.comparison.length} selected</strong>
            <small>Choose 2–3 to compare</small>
          </div>
        </div>
        <div className="tray-chips">
          {admission.state.comparison.map((id) => {
            const program = programs.find((p) => p.id === id)!
            const uni = universities.find((u) => u.id === program.universityId)!
            return (
              <button
                key={id}
                onClick={() => admission.toggleCompare(id)}
                title={`Remove ${uni.shortName} ${program.title.value}`}
                aria-label={`Remove ${uni.shortName} ${program.title.value} from tray`}
              >
                {uni.shortName} · {program.code ?? 'CS'}
                <X size={13} />
              </button>
            )
          })}
        </div>
        <Link className="button primary" href="/compare">
          Compare programs
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  )
}
