import { ArrowRight, MapPin } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { programs, universityFor, money } from '../data/universities'
import { Empty, External, Fact, Notice, PageHeading } from '../components/Shared'
import SaveOption from '../components/SaveOption'
import { portfolioIdeas } from '../lib/portfolio'
import { emptyProfile } from '../lib/persistence'
import { Link } from '../lib/router'

export default function ProgramDetailsPage({
  admission,
  programId,
}: {
  admission: Admission
  programId: string
}) {
  const program = programs.find((p) => p.id === programId)
  if (!program)
    return (
      <Empty title="Program not found" href="/universities" action="Explore universities">
        Choose an option from the current curated collection.
      </Empty>
    )
  const uni = universityFor(program)
  const profile = admission.state.profile ?? undefined
  const match = admission.recommendations.find((result) => result.program.id === program.id)
  const ideas = portfolioIdeas({ ...(profile ?? emptyProfile()), interest: program.primaryInterest }).filter(
    (idea) => ['Personal Projects', 'Research'].includes(idea.category),
  )
  return (
    <>
      <PageHeading
        eyebrow={uni.name.toUpperCase()}
        title={program.title.value ?? 'Program details'}
        description={program.description}
        back="/universities"
      />
      <div className="details-layout">
        <div>
          <section className="panel details-intro">
            <div className="card-top">
              <span className={`university-monogram ${uni.id}`}>{uni.shortName}</span>
              <span className="pill subtle">Bachelor's · {program.code ?? 'Computer Science'}</span>
            </div>
            <h2>{uni.name}</h2>
            <p className="program-meta">
              <MapPin size={14} />
              {uni.city}, Kazakhstan
            </p>
            <External href={program.title.sourceUrl}>Official program page</External>
            <small className="muted">Program checked {program.title.verifiedAt}</small>
          </section>
          {match ? (
            <div className="detail-reasons">
              <section className="panel">
                <h2>Why consider it</h2>
                <ul className="plain-list">
                  {match.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </section>
              <section className="panel">
                <h2>What to verify</h2>
                <ul className="plain-list">
                  {match.caveats.map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            profile && (
              <Notice>
                This program is outside your current hard search constraints. You can keep it in your personal
                list, but it will not generate university-specific roadmap tasks unless those constraints
                change.
              </Notice>
            )
          )}
          <section className="panel details-facts">
            <h2>Program & admission information</h2>
            <div className="details-fact-grid">
              <article>
                <h3>Duration</h3>
                <Fact fact={program.duration} profile={profile} />
              </article>
              <article>
                <h3>Teaching language</h3>
                <Fact fact={program.language} profile={profile} />
              </article>
              <article>
                <h3>Annual tuition</h3>
                <Fact fact={program.tuition} profile={profile} format={money} />
              </article>
              <article>
                <h3>Grants & funding</h3>
                <Fact fact={program.grant} profile={profile} />
              </article>
              <article>
                <h3>Admission requirements & exams</h3>
                <Fact
                  fact={program.examRequirements}
                  profile={profile}
                  format={(items) =>
                    items.map((item) => `${item.exam}: ${item.minimum ?? 'threshold unknown'}`).join('; ')
                  }
                />
                <p>
                  Research topics: {program.researchExams.join(', ')}. Confirm the route; these are not all
                  compulsory.
                </p>
              </article>
              <article>
                <h3>Required documents</h3>
                <Fact fact={program.documents} profile={profile} format={(items) => items.join('; ')} />
              </article>
              <article>
                <h3>Application deadline</h3>
                <Fact fact={program.deadline} profile={profile} />
              </article>
              <article>
                <h3>Application process</h3>
                <p>
                  Confirm your category and intake, then follow the university's current exam, document and
                  application instructions.
                </p>
                <External href={program.admissionsUrl}>Official admissions steps</External>
              </article>
            </div>
          </section>
          <section className="panel portfolio-examples">
            <span className="pill warning">Portfolio project ideas</span>
            <h2>Ways to explore this field</h2>
            <p>
              We have no verified public examples from admitted students for this program. The ideas below are
              suggestions, not admission evidence or required projects.
            </p>
            {ideas.map((idea) => (
              <article key={idea.id}>
                <h3>{idea.title}</h3>
                <p>{idea.description}</p>
                <small>Possible outcome: {idea.outcome}</small>
              </article>
            ))}
            <Link className="text-button" href="/portfolio">
              Build a portfolio plan
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
        <aside className="panel details-save">
          <span className="small-label">YOUR OPTIONS</span>
          <h2>Keep this on your list.</h2>
          <p>
            Dream, Priority, Backup and Considering are your own labels. They do not describe admission
            chances.
          </p>
          {profile ? (
            <>
              <SaveOption admission={admission} programId={program.id} />
              <button
                className="button secondary"
                disabled={!match}
                aria-pressed={admission.state.comparison.includes(program.id)}
                onClick={() => admission.toggleCompare(program.id)}
              >
                {admission.state.comparison.includes(program.id)
                  ? 'Remove from comparison'
                  : 'Add to comparison'}
              </button>
              <Link className="text-button" href="/compare">
                Open comparison
                <ArrowRight size={16} />
              </Link>
              <Link href="/my-list">My University List</Link>
            </>
          ) : (
            <Link className="button primary" href="/diagnosis">
              Build my profile
            </Link>
          )}
        </aside>
      </div>
    </>
  )
}
