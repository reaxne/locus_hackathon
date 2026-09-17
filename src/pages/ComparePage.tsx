import { ArrowRight, MapPin, X } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { programs, universityFor, money } from '../data/universities'
import { External, Empty, Fact, Notice, PageHeading } from '../components/Shared'
import { Link, useRouter } from '../lib/router'

export default function ComparePage({ admission }: { admission: Admission }) {
  const { go } = useRouter()
  const profile = admission.state.profile
  const selected = programs.filter((program) => admission.state.comparison.includes(program.id))
  if (!profile)
    return (
      <Empty title="Build a profile first">Your comparison will use your intake, budget and interests.</Empty>
    )
  return (
    <>
      <PageHeading
        eyebrow="THE DETAILS, SIDE BY SIDE"
        title="Make an informed choice."
        description="Compare what is known, keep track of what is missing, and choose one program to plan around."
        back="/matches"
      >
        <Link className="button secondary" href="/matches">
          Change selection
        </Link>
      </PageHeading>
      {selected.length < 2 ? (
        <Empty title="Choose at least two programs" href="/matches" action="Choose programs">
          {selected.length === 1
            ? 'One program is selected. Add another to see the differences.'
            : 'Add two or three options from your shortlist.'}
        </Empty>
      ) : (
        <>
          <Notice>
            “Check official site” means we have no verified value for your intake or applicant category. A
            focus choice is provisional and can be changed.
          </Notice>
          <div className="comparison-grid" style={{ '--columns': selected.length } as React.CSSProperties}>
            {selected.map((program) => {
              const uni = universityFor(program)
              return (
                <article className="panel compare-card" key={program.id}>
                  <div className="compare-card-head">
                    <div className="card-top">
                      <span className={`university-monogram ${uni.id}`}>{uni.shortName}</span>
                      <button
                        className="icon-button"
                        onClick={() => admission.toggleCompare(program.id)}
                        aria-label={`Remove ${uni.shortName} ${program.title.value}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="university-name">{uni.name}</p>
                    <h2>{program.title.value}</h2>
                    <span className="program-meta">
                      <MapPin size={13} />
                      {uni.city}, Kazakhstan
                    </span>
                  </div>
                  <dl className="comparison-rows">
                    <div>
                      <dt>Discipline</dt>
                      <dd>
                        {program.title.value}
                        {program.code && <small>{program.code}</small>}
                        <External href={program.title.sourceUrl}>Program source</External>
                        <small>Checked {program.title.verifiedAt}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>
                        <Fact fact={program.duration} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Teaching language</dt>
                      <dd>
                        <Fact fact={program.language} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Annual tuition · KZT</dt>
                      <dd>
                        <Fact fact={program.tuition} profile={profile} format={money} />
                      </dd>
                    </div>
                    <div>
                      <dt>Exam requirements</dt>
                      <dd>
                        <Fact
                          fact={program.examRequirements}
                          profile={profile}
                          format={(requirements) =>
                            requirements
                              .map((r) => `${r.exam}${r.minimum === null ? '' : `: ${r.minimum}`}`)
                              .join(', ')
                          }
                        />
                        <small>
                          Research topics: {program.researchExams.join(', ')}. These may be alternative
                          routes; they are not all compulsory.
                        </small>
                      </dd>
                    </div>
                    <div>
                      <dt>Grants & funding</dt>
                      <dd>
                        <Fact fact={program.grant} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Application deadline</dt>
                      <dd>
                        <Fact fact={program.deadline} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Before applying</dt>
                      <dd>
                        Verify your applicant category, exam route, documents and dates with the university.
                        <External href={program.admissionsUrl}>Admissions information</External>
                      </dd>
                    </div>
                  </dl>
                  <button
                    className="button primary"
                    onClick={() => {
                      admission.chooseFocus(program.id)
                      go('/roadmap')
                    }}
                  >
                    Choose a focus
                    <ArrowRight size={17} />
                  </button>
                </article>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
