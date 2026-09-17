import { useEffect } from 'react'
import { BookOpen, Moon, Sun, X, Check } from 'lucide-react'
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
import SignInPage from './pages/SignInPage'
import ProgramDetailsPage from './pages/ProgramDetailsPage'
import UniversityListPage from './pages/UniversityListPage'
import PortfolioPage from './pages/PortfolioPage'
import ExamGoalsPage from './pages/ExamGoalsPage'
import AnalysisPage from './pages/AnalysisPage'

const titles: Record<string, string> = {
  '/': 'План поступления',
  '/register': 'Создать аккаунт',
  '/sign-in': 'Войти',
  '/diagnosis': 'Анкета',
  '/analysis': 'Диагностика профиля',
  '/recommendations': 'Рекомендации',
  '/profile': 'Мой профиль',
  '/universities': 'Найти университет',
  '/matches': 'Найти университет',
  '/my-list': 'Мои университеты',
  '/compare': 'Сравнение программ',
  '/roadmap': 'Мой маршрут',
  '/dashboard': 'Мой маршрут',
  '/exam-goals': 'Экзамены',
  '/portfolio': 'План портфолио',
  '/sources': 'Источники и данные',
}
export default function App() {
  const admission = useAdmission()
  const { state } = admission
  const { path, go } = useRouter()
  const publicPage = ['/', '/register', '/sign-in', '/sources'].includes(path)
  const authenticated = !!state.demoSession && !!state.demoAccount
  useEffect(() => {
    document.title = `${titles[path] ?? (path.startsWith('/universities/') ? 'Программа обучения' : 'Страница не найдена')} · Казахстан`
  }, [path])
  const content = () => {
    if (admission.loading) return <p role="status">Загружаем аккаунт…</p>
    if (path === '/') return <HomePage admission={admission} />
    if (path === '/sources') return <SourcesPage admission={admission} />
    if (path === '/register' || path === '/sign-in')
      return <SignInPage key={path} register={path === '/register'} admission={admission} />
    if (!publicPage && !authenticated)
      return (
        <Empty title="Продолжите после входа" href="/sign-in" action="Войти">
          Создайте аккаунт или войдите, чтобы открыть анкету и личный маршрут.
        </Empty>
      )
    if (path === '/diagnosis') return <DiagnosisPage admission={admission} />
    if (!state.profile)
      return (
        <Empty title="Закончим знакомство?" href="/diagnosis" action="Продолжить анкету">
          Ваши ответы и текущий шаг сохранены. Завершите анкету, чтобы увидеть рекомендации.
        </Empty>
      )
    const needsRecommendations = !['/profile', '/exam-goals'].includes(path)
    if (needsRecommendations && admission.recommendationsLoading)
      return <p role="status">Загружаем рекомендации и маршрут…</p>
    if (needsRecommendations && admission.recommendationError)
      return (
        <div className="storage-warning" role="alert">
          {admission.recommendationError}
          <button onClick={admission.retryRecommendations}>Повторить загрузку</button>
        </div>
      )
    if (path === '/analysis' || path === '/recommendations') return <AnalysisPage admission={admission} />
    if (path === '/profile') return <ProfilePage admission={admission} />
    if (path === '/universities' || path === '/matches') return <MatchesPage admission={admission} />
    if (path.startsWith('/universities/'))
      return <ProgramDetailsPage admission={admission} programId={path.slice('/universities/'.length)} />
    if (path === '/my-list') return <UniversityListPage admission={admission} />
    if (path === '/compare') return <ComparePage admission={admission} />
    if (path === '/roadmap' || path === '/dashboard') return <RoadmapPage admission={admission} />
    if (path === '/exam-goals') return <ExamGoalsPage admission={admission} />
    if (path === '/portfolio') return <PortfolioPage admission={admission} />
    return (
      <Empty title="Страница не найдена" href="/roadmap" action="Мой маршрут">
        Сохранённые данные доступны в вашем профиле.
      </Empty>
    )
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="home-link" href="/" aria-label="На главную">
            <BookOpen size={26} />
            <span>
              Поступление
              <br />
              <strong>в Казахстане</strong>
            </span>
          </Link>
          <div className="header-actions">
            <Link className="source-nav" href="/sources">
              Источники
            </Link>
            <button
              className="icon-button"
              aria-label={admission.dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
              onClick={() => admission.setTheme(admission.dark ? 'light' : 'dark')}
            >
              {admission.dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {authenticated ? (
              <Link href={state.profile ? '/roadmap' : '/diagnosis'}>
                {state.profile ? 'Мой маршрут' : 'Продолжить анкету'}
              </Link>
            ) : (
              <Link href="/sign-in">Войти</Link>
            )}
          </div>
        </div>
      </header>
      {authenticated && (
        <nav className="workspace-nav" aria-label="Личный кабинет">
          {(state.profile
            ? [
                ['/roadmap', 'Мой маршрут'],
                ['/universities', 'Найти университет'],
                ['/my-list', 'Мои университеты'],
                ['/compare', 'Сравнение'],
                ['/exam-goals', 'Экзамены'],
                ['/portfolio', 'Портфолио'],
                ['/profile', 'Профиль'],
              ]
            : [['/diagnosis', 'Анкета']]
          ).map(([href, label]) => (
            <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
              {label}
            </Link>
          ))}
          <button
            onClick={async () => {
              if (await admission.signOut()) {
                go('/')
                admission.setNotice('Вы вышли. Анкета и профиль сохранены в аккаунте.')
              }
            }}
          >
            Выйти
          </button>
        </nav>
      )}
      <main id="main" className="main-content" tabIndex={-1}>
        {authenticated && (
          <p role="status">
            {admission.saveStatus === 'saving'
              ? 'Сохраняем ответы…'
              : admission.saveStatus === 'saved'
                ? 'Ответы сохранены в аккаунте'
                : 'Есть несохранённые изменения'}
          </p>
        )}
        {admission.saveError && (
          <div className="storage-warning" role="alert">
            {admission.saveError}
            <button
              onClick={async () => {
                if (await admission.signOut(true)) go('/sign-in')
              }}
            >
              Выйти без сохранения последних изменений
            </button>
            {admission.conflict ? (
              <button onClick={() => void admission.reloadProfile()}>
                Загрузить серверную версию (заменит несохранённые ответы)
              </button>
            ) : (
              <button onClick={admission.retrySave}>Повторить сохранение</button>
            )}
          </div>
        )}
        {content()}
      </main>
      <footer className="site-footer">
        <div>
          <span>Поступление в Казахстане · 9–12 классы</span>
          <span>Анкета и профиль сохраняются в аккаунте</span>
        </div>
        <Link href="/sources">Источники и методика</Link>
      </footer>
      {admission.notice && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{admission.notice}</span>
          <button
            className="icon-button"
            aria-label="Закрыть уведомление"
            onClick={() => admission.setNotice('')}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
