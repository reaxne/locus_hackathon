import { CheckCircle2, CircleHelp, FlaskConical } from 'lucide-react'
import { checkedAt, programs, sourceUrls, universities } from '../data/universities'
import { External, Fact, PageHeading } from '../components/Shared'
import type { Admission } from '../hooks/useAdmission'
import { examResources } from '../data/exams'

export default function SourcesPage({ admission }: { admission: Admission }) {
  return (
    <>
      <PageHeading
        eyebrow="TRANSPARENCY BY DESIGN"
        title="Sources & data."
        description={`Official program pages last checked on ${checkedAt}. We show the limits of what we know.`}
        back="/"
      />
      <div className="source-status-grid">
        <article className="panel">
          <CheckCircle2 className="teal" />
          <h2>Verified</h2>
          <p>
            An official source supports this field. Fees and admissions rules also need to match your intake
            and applicant category.
          </p>
        </article>
        <article className="panel">
          <CircleHelp className="terracotta" />
          <h2>Unknown</h2>
          <p>
            Missing, unconfirmed or not applicable to your intake. Displayed as “Check official site”. Unknown
            never means zero or free.
          </p>
        </article>
        <article className="panel">
          <FlaskConical className="teal" />
          <h2>Illustrative only</h2>
          <p>
            The sample student profile and home preview are examples. The university records are real; no
            fictional fee or deadline is used.
          </p>
        </article>
      </div>
      <section className="panel methodology">
        <div>
          <span className="small-label">EXPLAINABLE RECOMMENDATIONS</span>
          <h2>How your shortlist is made</h2>
        </div>
        <ol>
          <li>
            <strong>Apply hard constraints.</strong> Kazakhstan, bachelor's study, and your city if “Must
            stay” is selected.
          </li>
          <li>
            <strong>Order by preferences.</strong> Program interests come first, with city, verified
            affordability and recorded exam preparation as additional signals. Interest tags are editorial
            mappings of official program descriptions, not entry criteria.
          </li>
          <li>
            <strong>Make gaps visible.</strong> Unknown prices and requirements stay unknown. Over-budget
            options are labeled. Grant preferences never turn an unknown award into available funding.
          </li>
          <li>
            <strong>Build relevant actions.</strong> Grade, entry year, saved programs, activities and exam
            goals determine the checklist. A changed plan retains only tasks with IDs that are still relevant.
          </li>
        </ol>
        <p>
          These are deterministic, rule-based recommendations. No AI model, admissions probability or
          scholarship prediction is used. Completed or planned exams are preparation signals only; the current
          records do not establish exam eligibility.
        </p>
      </section>
      <div className="section-intro">
        <div>
          <span className="eyebrow">THE CURATED COLLECTION</span>
          <h2>Three universities. Field-level sources.</h2>
        </div>
      </div>
      <div className="source-records">
        {universities.map((university) => (
          <section className="panel" key={university.id}>
            <div className="source-university">
              <span className={`university-monogram ${university.id}`}>{university.shortName}</span>
              <div>
                <h2>{university.name}</h2>
                <External href={university.sourceUrl}>Official university reference</External>
              </div>
            </div>
            {programs
              .filter((p) => p.universityId === university.id)
              .map((program) => (
                <details key={program.id}>
                  <summary>
                    {program.title.value}
                    {program.code ? ` · ${program.code}` : ''}
                  </summary>
                  <div className="source-facts">
                    {(
                      [
                        ['Program title', program.title],
                        ['Duration', program.duration],
                        ['Language', program.language],
                        ['Tuition in KZT', program.tuition],
                        ['Deadline', program.deadline],
                        ['Funding', program.grant],
                      ] as const
                    ).map(([label, fact]) => (
                      <div key={label}>
                        <strong>{label}</strong>
                        <Fact
                          fact={fact as import('../types').SourcedFact<string | number>}
                          profile={admission.state.profile ?? undefined}
                        />
                      </div>
                    ))}
                    <div>
                      <strong>Documents</strong>
                      <Fact
                        fact={program.documents}
                        profile={admission.state.profile ?? undefined}
                        format={(items) => items.join('; ')}
                      />
                    </div>
                    <div>
                      <strong>Entry requirements</strong>
                      <Fact
                        fact={program.examRequirements}
                        profile={admission.state.profile ?? undefined}
                        format={(items) => items.map((item) => item.exam).join(', ')}
                      />
                    </div>
                  </div>
                </details>
              ))}
          </section>
        ))}
      </div>
      <section className="panel data-limitations">
        <h2>Personal goals and portfolio ideas</h2>
        <p>
          Exam targets and activity periods are entered by you. They are not verified admission thresholds or
          deadlines. Portfolio suggestions are editorial planning ideas, not public evidence of what admitted
          students did. We have no verified admitted-student project records in this collection.
        </p>
        <p>
          Exam preparation links below point to official providers. The step-by-step study tasks are our
          planning suggestions, not additional university requirements.
        </p>
        <div className="button-row">
          {Object.entries(examResources).map(([exam, resource]) => (
            <External key={exam} href={resource.url}>
              {exam}: {resource.label}
            </External>
          ))}
        </div>
      </section>
      <section className="panel data-limitations">
        <h2>Coverage & limitations</h2>
        <p>
          All seeded universities are in Astana. This is a small curated collection, not a complete national
          catalog. NU and ENU tuition, intake-specific exam thresholds, grants and deadlines are unverified.
          AITU's 2,500,000 KZT price is recorded only for 2026–2027 and domestic applicants; it is not carried
          into later years or international routes. Its admissions page lists UNT and AET steps, but the
          page's dates and thresholds are not attached to a sufficiently clear intake in this dataset, so they
          remain unknown.
        </p>
        <p>
          Some program pages describe current teaching language and duration without a specific admission
          cycle. Those are program descriptions, not a guarantee of future intake conditions. Recheck all
          fields before an application.
        </p>
        <p>
          The government university registry can help verify names and addresses; it does not establish fees,
          grants or deadlines. It was not used as evidence for admission fields here.
        </p>
        <External href={sourceUrls.registry}>Government university registry</External>
        <p>
          Records are maintained in the project's source files. Changes saved in your browser affect only your
          own profile and progress.
        </p>
      </section>
    </>
  )
}
