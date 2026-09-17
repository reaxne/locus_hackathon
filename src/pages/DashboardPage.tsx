import {
  ArrowRight,
  Bookmark,
  Check,
  Flag,
  FolderCheck,
  GraduationCap,
  UserRound,
  Route,
  Search,
} from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { goalExamNames } from '../types'
import { Empty, PageHeading } from '../components/Shared'
import { Link } from '../lib/router'

export default function DashboardPage({ admission }: { admission: Admission }) {
  const { state, tasks } = admission
  if (!state.profile)
    return (
      <Empty title="Start with your diagnosis" href="/diagnosis" action="Begin diagnosis">
        Answer a few questions to build a personal starting point.
      </Empty>
    )
  if (!state.demoSession)
    return (
      <Empty title="Your dashboard is ready" href="/sign-in" action="Continue with demo sign-in">
        No real account or password is needed. Your existing answers and plans will be preserved.
      </Empty>
    )
  const next = tasks.find((task) => !state.completed.includes(task.id))
  const done = tasks.filter((task) => state.completed.includes(task.id)).length
  const goals = goalExamNames.filter(
    (exam) =>
      state.profile!.examGoals[exam].targetScore !== null ||
      state.profile!.examGoals[exam].targetDate !== null,
  ).length
  return (
    <>
      <PageHeading
        eyebrow="YOUR DASHBOARD"
        title={`Welcome, ${state.demoSession.displayName}.`}
        description={`Grade ${state.profile.grade} · ${state.profile.interest} · University entry in ${state.profile.entryYear}`}
      >
        <span className="pill subtle">Demo session · saved locally</span>
      </PageHeading>
      <div className="dashboard-top">
        <section className="dashboard-next">
          <span className="eyebrow">
            <Flag size={14} />
            YOUR NEXT ACTION
          </span>
          <h2>{next?.title ?? 'Your current checklist is complete.'}</h2>
          <p>{next?.description ?? 'Revisit your goals and official sources as your plans develop.'}</p>
          {next && (
            <>
              <span className="next-timing">{next.timing}</span>
              <div className="button-row">
                <Link className="button secondary" href={next.actionPath ?? '/roadmap'}>
                  Open task workspace
                  <ArrowRight size={16} />
                </Link>
                <button className="button primary" onClick={() => admission.toggleTask(next.id)}>
                  <Check size={16} />
                  Mark complete
                </button>
              </div>
            </>
          )}
          <Link className="text-button" href="/roadmap">
            See full roadmap
            <ArrowRight size={15} />
          </Link>
        </section>
        <section className="panel dashboard-progress">
          <span className="small-label">YOUR PREPARATION</span>
          <h2>
            {done}
            <span> / {tasks.length}</span>
          </h2>
          <p>roadmap steps completed</p>
          <progress value={done} max={Math.max(tasks.length, 1)} aria-label="Overall roadmap progress" />
          <div className="dashboard-stat">
            <span>Saved university options</span>
            <strong>{state.savedOptions.length}</strong>
          </div>
          <div className="dashboard-stat">
            <span>Portfolio activities</span>
            <strong>{state.activities.length}</strong>
          </div>
          <div className="dashboard-stat">
            <span>Personal exam targets</span>
            <strong>{goals}</strong>
          </div>
        </section>
      </div>
      <div className="section-intro">
        <div>
          <span className="eyebrow">YOUR PLANNING SPACE</span>
          <h2>Choose what to work on.</h2>
        </div>
      </div>
      <div className="dashboard-links">
        {[
          {
            href: '/universities',
            title: 'Universities',
            text: 'Explore programs and check official information.',
            icon: Search,
          },
          {
            href: '/my-list',
            title: 'My University List',
            text: 'Keep your options organised with personal labels.',
            icon: Bookmark,
          },
          {
            href: '/portfolio',
            title: 'Portfolio Plan',
            text: 'Turn your interests into useful activities and outcomes.',
            icon: FolderCheck,
          },
          {
            href: '/exam-goals',
            title: 'Exam Goals',
            text: 'Record where you are and what you want to work toward.',
            icon: GraduationCap,
          },
          {
            href: '/roadmap',
            title: 'Roadmap',
            text: 'Follow manageable steps and see why they matter.',
            icon: Route,
          },
          {
            href: '/profile',
            title: 'Profile',
            text: 'Edit your answers or export your profile as JSON.',
            icon: UserRound,
          },
        ].map(({ href, title, text, icon: Icon }) => (
          <Link className="panel dashboard-link" href={href} key={href}>
            <Icon size={23} />
            <h3>{title}</h3>
            <p>{text}</p>
            <ArrowRight className="link-arrow" size={17} />
          </Link>
        ))}
      </div>
    </>
  )
}
