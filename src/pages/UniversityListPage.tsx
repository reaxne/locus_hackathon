import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import type { Admission } from '../hooks/useAdmission'
import { programs, universityFor } from '../data/universities'
import { listLabels } from '../types'
import { meetsHardConstraints } from '../lib/matching'
import { Link, useRouter } from '../lib/router'
import { Empty, Notice, PageHeading } from '../components/Shared'
import SaveOption from '../components/SaveOption'

export default function UniversityListPage({ admission }: { admission: Admission }) {
  const [filter, setFilter] = useState('All labels')
  const { go } = useRouter()
  const p = admission.state.profile
  if (!p)
    return (
      <Empty title="Your list starts with your profile" href="/diagnosis" action="Begin diagnosis">
        Tell us what matters to you, then save programs to investigate.
      </Empty>
    )
  const visible = admission.state.savedOptions.filter(
    (option) => filter === 'All labels' || option.label === filter,
  )
  return (
    <>
      <PageHeading
        eyebrow="MY UNIVERSITY LIST"
        title="Keep your options in view."
        description="Save programs, organise your thinking, and choose a focus when you are ready."
        back="/dashboard"
      >
        <Link className="button primary" href="/universities">
          Find universities
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <Notice>
        Dream, Priority, Backup and Considering are personal labels, not admission probabilities. Even a
        Backup option requires confirmed eligibility and funding.
      </Notice>
      <label className="list-filter">
        Filter by personal label
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All labels</option>
          {listLabels.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
      </label>
      {!visible.length ? (
        <section className="empty panel">
          <h2>
            {admission.state.savedOptions.length
              ? 'No programs with this label'
              : 'Your list is ready for its first option'}
          </h2>
          <p>Open a program and choose a personal label to save it here.</p>
          {admission.state.savedOptions.length ? (
            <button className="button secondary" onClick={() => setFilter('All labels')}>
              Show all saved options
            </button>
          ) : (
            <Link className="button primary" href="/universities">
              Explore universities
            </Link>
          )}
        </section>
      ) : (
        <div className="saved-program-grid">
          {visible.map((option) => {
            const program = programs.find((item) => item.id === option.programId)!
            const uni = universityFor(program)
            const allowed = meetsHardConstraints(p, program)
            return (
              <article className="panel saved-program" key={option.programId}>
                <div className="card-top">
                  <span className={`university-monogram ${uni.id}`}>{uni.shortName}</span>
                  <span className="pill">{option.label}</span>
                </div>
                <p className="university-name">{uni.name}</p>
                <h2>
                  <Link href={`/universities/${program.id}`}>{program.title.value}</Link>
                </h2>
                <p className="muted">
                  {uni.city} · {p.entryYear} intended entry
                </p>
                {!allowed && (
                  <Notice>
                    Outside your current hard city constraint. Kept as a bookmark; excluded from your active
                    roadmap.
                  </Notice>
                )}
                <SaveOption admission={admission} programId={program.id} />
                <div className="button-row">
                  <button
                    className="button secondary"
                    disabled={!allowed}
                    aria-pressed={admission.state.comparison.includes(program.id)}
                    onClick={() => admission.toggleCompare(program.id)}
                  >
                    {admission.state.comparison.includes(program.id) ? 'Remove comparison' : 'Compare'}
                  </button>
                  <button
                    className="button primary"
                    disabled={!allowed}
                    onClick={() => {
                      admission.chooseFocus(program.id)
                      go('/roadmap')
                    }}
                  >
                    {admission.state.focus === program.id ? (
                      <>
                        <Check size={15} />
                        Current focus
                      </>
                    ) : (
                      'Focus my plan'
                    )}
                  </button>
                </div>
                <Link className="text-button" href={`/universities/${program.id}`}>
                  View details
                  <ArrowRight size={15} />
                </Link>
              </article>
            )
          })}
        </div>
      )}
      {admission.state.comparison.length > 0 && (
        <div className="page-action">
          <p>{admission.state.comparison.length} programs selected for comparison.</p>
          <Link className="button secondary" href="/compare">
            Open comparison
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </>
  )
}
