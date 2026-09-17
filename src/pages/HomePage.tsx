import {
  ArrowRight,
  Check,
  CheckCheck,
  GitCompareArrows,
  ListChecks,
  MapPin,
  SlidersHorizontal,
  BookOpen,
  ShieldCheck,
} from 'lucide-react'
import { Link, useRouter } from '../lib/router'
import type { Admission } from '../hooks/useAdmission'

export default function HomePage({ admission }: { admission: Admission }) {
  const { go } = useRouter()
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> UNDERGRADUATE STUDY IN KAZAKHSTAN
          </div>
          <h1>
            Build your personal
            <br />
            <span>admission plan.</span>
          </h1>
          <p className="hero-description">
            Find IT programs that fit your interests. Understand your options, compare the details, and know
            what to do next.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" href={admission.state.profile ? '/profile' : '/diagnosis'}>
              {admission.state.profile ? 'Continue my path' : 'Build my path'}
              <ArrowRight size={19} />
            </Link>
            <button
              className="text-button"
              onClick={() => {
                admission.loadDemo()
                go('/universities')
              }}
            >
              Explore a sample path <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-assurance">
            <span>
              <Check size={15} /> No account needed
            </span>
            <span>
              <Check size={15} /> Your progress stays on this device
            </span>
          </div>
        </div>
        <div className="path-preview" aria-label="Illustrative admission journey">
          <div className="preview-top">
            <span className="eyebrow">A LOOK AT YOUR JOURNEY</span>
            <span className="pill subtle">Example</span>
          </div>
          <div className="preview-title">
            <span className="preview-icon">
              <BookOpen size={23} />
            </span>
            <div>
              <h2>From interests to a plan</h2>
              <p>Grade 11 · IT bachelor's · Kazakhstan</p>
            </div>
          </div>
          <div className="preview-route">
            <div className="preview-step">
              <span className="step-node done">
                <Check size={15} />
              </span>
              <div>
                <strong>Your starting point</strong>
                <p>Interests, budget and exam plans</p>
              </div>
              <CheckCheck className="muted" size={18} />
            </div>
            <div className="preview-step">
              <span className="step-node">2</span>
              <div>
                <strong>A shortlist with reasons</strong>
                <p>Real programs. Clear uncertainties.</p>
                <div className="university-chips">
                  <span>NU</span>
                  <span>AITU</span>
                  <span>ENU</span>
                </div>
              </div>
            </div>
            <div className="preview-step">
              <span className="step-node">3</span>
              <div>
                <strong>A choice you understand</strong>
                <p>Compare the details that matter to you</p>
              </div>
            </div>
            <div className="preview-next">
              <span className="small-label">YOUR NEXT ACTION</span>
              <strong>Check your admissions route</strong>
              <span>
                One manageable step at a time <ArrowRight size={16} />
              </span>
            </div>
          </div>
          <div className="preview-foot">
            <ShieldCheck size={15} /> Official sources, with unknowns clearly marked
          </div>
        </div>
      </section>
      <section className="journey-overview" aria-labelledby="journey-title">
        <div className="section-intro">
          <div>
            <div className="eyebrow">A CLEAR WAY FORWARD</div>
            <h2 id="journey-title">Four steps. Your own direction.</h2>
          </div>
          <p>
            Made for students in grades 9–12.
            <br />
            Start where you are today.
          </p>
        </div>
        <div className="feature-grid">
          {[
            {
              icon: SlidersHorizontal,
              title: 'Tell us about you',
              text: 'A short profile of your interests, plans and priorities.',
              label: '01 / PROFILE',
            },
            {
              icon: MapPin,
              title: 'Find your options',
              text: 'A curated shortlist with a reason and a caveat for every option.',
              label: '02 / MATCHES',
            },
            {
              icon: GitCompareArrows,
              title: 'See the differences',
              text: 'Put programs side by side before choosing your focus.',
              label: '03 / COMPARE',
            },
            {
              icon: ListChecks,
              title: 'Take the next step',
              text: 'A personal checklist that grows with your preparation.',
              label: '04 / PLAN',
            },
          ].map(({ icon: Icon, title, text, label }) => (
            <article className="feature" key={title}>
              <div className="feature-top">
                <Icon size={22} />
                <span>{label}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="transparency-strip">
        <div>
          <ShieldCheck size={22} />
          <div>
            <strong>Know what is verified. See what still needs checking.</strong>
            <p>Program details link to official sources. Recommendations follow explainable rules.</p>
          </div>
        </div>
        <Link href="/sources">
          About our data <ArrowRight size={16} />
        </Link>
      </section>
    </>
  )
}
