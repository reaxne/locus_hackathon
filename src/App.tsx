import { useEffect } from 'react'
import { ArrowUpRight, Check, ChevronRight, Moon, Sun, X, BookOpen, Database, Laptop } from 'lucide-react'
import { useAdmission } from './hooks/useAdmission'
import { Link, useRouter } from './lib/router'
import { Empty } from './components/Shared'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import DiagnosisPage from './pages/DiagnosisPage'
import MatchesPage from './pages/MatchesPage'
import ComparePage from './pages/ComparePage'
import RoadmapPage from './pages/RoadmapPage'
import SourcesPage from './pages/SourcesPage'
import DashboardPage from './pages/DashboardPage'
import SignInPage from './pages/SignInPage'
import ProgramDetailsPage from './pages/ProgramDetailsPage'
import UniversityListPage from './pages/UniversityListPage'
import PortfolioPage from './pages/PortfolioPage'
import ExamGoalsPage from './pages/ExamGoalsPage'

const titles: Record<string, string> = {
  '/': 'Undergraduate admission planning',
  '/profile': 'Your profile',
  '/diagnosis': 'Your progressive diagnosis',
  '/matches': 'Your matches',
  '/compare': 'Compare programs',
  '/roadmap': 'Your roadmap',
  '/sources': 'Sources & data',
  '/universities': 'Universities',
  '/sign-in': 'Demo sign-in',
  '/dashboard': 'Dashboard',
  '/my-list': 'My University List',
  '/portfolio': 'Portfolio Plan',
  '/exam-goals': 'Exam Goals',
}
export default function App() {
  const admission = useAdmission()
  const { path } = useRouter()
  const { state } = admission
  useEffect(() => {
    document.title = `${titles[path] ?? (path.startsWith('/universities/') ? 'Program details' : 'Page not found')} · Kazakhstan`
  }, [path])
  const steps = [
    {
      path: state.profile ? '/profile' : '/diagnosis',
      label: 'Diagnosis',
      detail: 'Your starting point',
      complete: !!state.profile,
      active: ['/profile', '/diagnosis'].includes(path),
    },
    {
      path: '/universities',
      label: 'Universities',
      detail: 'Explore your options',
      complete: state.comparison.length >= 2,
      active: path === '/matches' || path.startsWith('/universities'),
    },
    {
      path: '/compare',
      label: 'Compare',
      detail: 'Find your focus',
      complete: !!state.focus,
      active: path === '/compare',
    },
    {
      path: '/roadmap',
      label: 'Plan',
      detail: 'Take the next step',
      complete: admission.tasks.length > 0 && admission.tasks.every((t) => state.completed.includes(t.id)),
      active: path === '/roadmap',
    },
  ]
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="home-link" href="/" aria-label="Admission planning home">
            <BookOpen size={24} />
            <span>
              Undergraduate
              <br />
              <strong>admission planning</strong>
            </span>
          </Link>
          <div className="header-actions">
            <Link href="/sources" className="source-nav">
              <Database size={15} />
              Sources & data
            </Link>
            <div className="theme-control">
              <button
                className="icon-button"
                aria-label={`Switch to ${admission.dark ? 'light' : 'dark'} theme`}
                onClick={() => admission.setTheme(admission.dark ? 'light' : 'dark')}
              >
                {admission.dark ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              {state.theme !== 'system' && (
                <button
                  className="icon-button system-theme"
                  aria-label="Use system theme"
                  title="Use system theme"
                  onClick={() => admission.setTheme('system')}
                >
                  <Laptop size={16} />
                </button>
              )}
            </div>
            <span className="header-location">
              KAZAKHSTAN <ArrowUpRight size={13} />
            </span>
            {state.demoSession && (
              <Link className="header-dashboard" href="/dashboard">
                My dashboard
              </Link>
            )}
          </div>
        </div>
      </header>
      <nav className="journey-nav" aria-label="Admission journey">
        <ol>
          {steps.map((step, i) => (
            <li
              key={step.path}
              className={`${step.active ? 'active' : ''} ${step.complete ? 'complete' : ''}`}
            >
              <Link href={step.path} aria-current={step.active ? 'step' : undefined}>
                <span className="nav-number">
                  {step.complete && !step.active ? <Check size={16} /> : `0${i + 1}`}
                </span>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </span>
              </Link>
              {i < 3 && <ChevronRight className="nav-chevron" size={16} />}
            </li>
          ))}
        </ol>
      </nav>
      {state.demoSession && (
        <nav className="workspace-nav" aria-label="Dashboard navigation">
          {[
            ['/dashboard', 'Dashboard'],
            ['/universities', 'Universities'],
            ['/my-list', 'My University List'],
            ['/portfolio', 'Portfolio Plan'],
            ['/exam-goals', 'Exam Goals'],
            ['/roadmap', 'Roadmap'],
            ['/profile', 'Profile'],
          ].map(([href, label]) => (
            <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
              {label}
            </Link>
          ))}
          <button
            onClick={() => {
              admission.signOut()
              admission.setNotice('Demo session ended. Your answers and plans remain saved on this device.')
            }}
          >
            End demo session
          </button>
        </nav>
      )}
      <main id="main" className="main-content" tabIndex={-1}>
        {admission.storageError && (
          <div className="storage-warning" role="alert">
            Browser storage is unavailable. You can continue in this session, but changes will not survive a
            reload.
          </div>
        )}
        {path === '/' ? (
          <HomePage admission={admission} />
        ) : path === '/profile' ? (
          <ProfilePage admission={admission} />
        ) : path === '/diagnosis' ? (
          <DiagnosisPage admission={admission} />
        ) : path === '/matches' || path === '/universities' ? (
          <MatchesPage admission={admission} />
        ) : path.startsWith('/universities/') ? (
          <ProgramDetailsPage admission={admission} programId={path.slice('/universities/'.length)} />
        ) : path === '/sign-in' ? (
          <SignInPage admission={admission} />
        ) : path === '/dashboard' ? (
          <DashboardPage admission={admission} />
        ) : path === '/my-list' ? (
          <UniversityListPage admission={admission} />
        ) : path === '/portfolio' ? (
          <PortfolioPage admission={admission} />
        ) : path === '/exam-goals' ? (
          <ExamGoalsPage admission={admission} />
        ) : path === '/compare' ? (
          <ComparePage admission={admission} />
        ) : path === '/roadmap' ? (
          <RoadmapPage admission={admission} />
        ) : path === '/sources' ? (
          <SourcesPage admission={admission} />
        ) : (
          <Empty title="This page could not be found" href="/" action="Back to home">
            Your saved progress is still available from the journey navigation.
          </Empty>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <span>IT bachelor's pathways · Kazakhstan</span>
          <span>Grades 9–12 · No account required</span>
        </div>
        <div>
          <span>
            <span className="status-dot" />
            {admission.storageError ? 'Session only' : 'Saved on this device'}
          </span>
          <Link href="/sources">
            Data & methodology
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
      {admission.notice && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{admission.notice}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => admission.setNotice('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
