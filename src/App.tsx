import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  UserRound,
  GraduationCap,
  GitCompareArrows,
  Route,
  Check,
  CheckCheck,
  Plus,
  X,
  Menu,
  ChevronRight,
  ChevronDown,
  MapPin,
  Clock3,
  Sparkles,
  SlidersHorizontal,
  CircleHelp,
  Globe2,
  Target,
  CircleCheck,
  Info,
  Pencil,
  Search,
  BookOpen,
  MoveUpRight,
} from 'lucide-react'
import {
  countries,
  interests,
  currentYear,
  recommend,
  createRoadmap,
  parseSavedState,
  storageKey,
  money,
  programName,
  validateProfile,
  universities,
  type Profile,
  type View,
  type Recommendation,
  type University,
} from './model'

const navigation = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { id: 'profile', label: 'Мой профиль', icon: UserRound },
  { id: 'programs', label: 'Подбор программ', icon: GraduationCap },
  { id: 'compare', label: 'Сравнение', icon: GitCompareArrows },
  { id: 'roadmap', label: 'Мой маршрут', icon: Route },
] as const
const getView = (): View => navigation.find((n) => `#${n.id}` === window.location.hash)?.id ?? 'overview'

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current!
    el.showModal()
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el.close()
      document.body.style.overflow = old
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Закрыть окно">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  )
}

function ProfileForm({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile
  onSave: (p: Profile) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState({ ...profile, countries: [...profile.countries] })
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((p) => ({ ...p, [key]: value }))
    setError('')
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 2 && !draft.countries.length) {
      setError('Выбери хотя бы одну страну.')
      return
    }
    if (step < 2) {
      setStep(step + 1)
      return
    }
    const clean = { ...draft, name: draft.name.trim() }
    if (!validateProfile(clean)) {
      setError('Проверь данные анкеты. Имя обязательно, средний балл — от 2 до 5, IELTS — от 0 до 9.')
      return
    }
    onSave(clean)
  }
  return (
    <Modal title="Давай найдём твой вектор" onClose={onClose}>
      <p className="modal-intro">Три коротких шага — и у тебя будет свой маршрут.</p>
      <div className="form-steps">
        {['О тебе', 'Подготовка', 'Твоя цель'].map((label, i) => (
          <div key={label} className={i <= step ? 'active' : ''}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            {label}
          </div>
        ))}
      </div>
      <form onSubmit={submit}>
        <div className="form-content" key={step}>
          {step === 0 && (
            <>
              <label>
                Как тебя зовут?
                <input
                  autoFocus
                  required
                  maxLength={40}
                  value={draft.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Твоё имя"
                  autoComplete="given-name"
                />
              </label>
              <label>
                Где ты сейчас учишься?
                <select value={draft.grade} onChange={(e) => update('grade', e.target.value)}>
                  {['9 класс', '10 класс', '11 класс', 'Выпускник'].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Что тебе интересно?</legend>
                <div className="choice-stack">
                  {interests.map((field, i) => (
                    <button
                      type="button"
                      className={`choice ${draft.interest === field ? 'selected' : ''}`}
                      key={field}
                      aria-pressed={draft.interest === field}
                      onClick={() => update('interest', field)}
                    >
                      <span>{['01', '02', '03'][i]}</span>
                      {field}
                      {draft.interest === field && <Check size={18} />}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          {step === 1 && (
            <>
              <div className="field-note">
                <BookOpen size={23} />
                <p>Не нужно быть идеальным кандидатом. Ответы помогут понять, к чему подготовиться.</p>
              </div>
              <label>
                Средний балл по 5-балльной шкале
                <input
                  autoFocus
                  type="number"
                  required
                  min={2}
                  max={5}
                  step={0.1}
                  value={draft.gpa}
                  onChange={(e) => update('gpa', e.target.valueAsNumber)}
                />
              </label>
              <label>
                Текущий результат IELTS
                <select value={draft.ielts} onChange={(e) => update('ielts', Number(e.target.value))}>
                  <option value={0}>Пока не сдавал(а)</option>
                  {Array.from({ length: 18 }, (_, i) => (i + 1) / 2).map((n) => (
                    <option key={n} value={n}>
                      {n.toFixed(1)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted small">
                В этой версии рассматриваем англоязычные программы бакалавриата. Другие экзамены можно
                добавить позже.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <fieldset>
                <legend>Где хочешь учиться?</legend>
                <div className="country-choices">
                  {countries.map((country) => (
                    <button
                      type="button"
                      className={`chip ${draft.countries.includes(country) ? 'selected' : ''}`}
                      key={country}
                      aria-pressed={draft.countries.includes(country)}
                      onClick={() =>
                        update(
                          'countries',
                          draft.countries.includes(country)
                            ? draft.countries.filter((c) => c !== country)
                            : [...draft.countries, country],
                        )
                      }
                    >
                      {country}
                      {draft.countries.includes(country) ? <Check size={15} /> : <Plus size={15} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Бюджет на обучение в год, €
                <input
                  type="number"
                  required
                  min={0}
                  max={100000}
                  step={100}
                  value={draft.budget}
                  onChange={(e) => update('budget', e.target.valueAsNumber)}
                />
              </label>
              <p className="muted small tight">Без проживания, перелётов и визы.</p>
              <label>
                Год поступления
                <select value={draft.year} onChange={(e) => update('year', Number(e.target.value))}>
                  {Array.from({ length: 6 }, (_, i) => currentYear + i).map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
              <div className="field-note">
                <Info size={20} />
                <p>Профиль сохранится только в этом браузере. Подбор построен на демонстрационных данных.</p>
              </div>
            </>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-footer">
          <span className="muted small">Шаг {step + 1} из 3</span>
          <div>
            {step > 0 && (
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setStep(step - 1)
                  setError('')
                }}
              >
                <ArrowLeft size={16} />
                Назад
              </button>
            )}
            <button className="button primary" type="submit">
              {step === 2 ? 'Построить маршрут' : 'Продолжить'}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ProgramCard({
  item,
  profile,
  selected,
  toggle,
  details,
}: {
  item: Recommendation
  profile: Profile
  selected: boolean
  toggle: () => void
  details: () => void
}) {
  const u = item.university
  return (
    <article className="program-card">
      <div className="program-top">
        <span className={`uni-monogram ${u.color}`}>{u.short}</span>
        <button
          className={`compare-toggle ${selected ? 'selected' : ''}`}
          onClick={toggle}
          aria-label={`${selected ? 'Убрать из сравнения' : 'Сравнить'} ${u.name}`}
          aria-pressed={selected}
        >
          {selected ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </div>
      <div className="location">
        <MapPin size={13} />
        {u.city}, {u.country}
      </div>
      <h3>
        <button onClick={details}>{u.name}</button>
      </h3>
      <p className="program-name">
        {programName(u.fields.includes(profile.interest) ? profile.interest : u.fields[0])}
      </p>
      <div className="match">
        <span className="match-dots" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={i < item.matches ? 'filled' : ''} />
          ))}
        </span>
        {item.matches} из 5 критериев
      </div>
      <div className="program-facts">
        <div>
          <span>Обучение в год</span>
          <strong>{money(u.fee)}</strong>
        </div>
        <div>
          <span>Английский</span>
          <strong>IELTS {u.ielts.toFixed(1)}</strong>
        </div>
      </div>
      <div className="program-reason">
        <Check size={14} />
        <span>{item.reasons[0] ?? 'Вариант для сравнения'}</span>
      </div>
      <button className="card-link" onClick={details}>
        Почему подходит
        <ArrowUpRight size={16} />
      </button>
    </article>
  )
}

export default function App() {
  const [state, setState] = useState(() => {
    try {
      return parseSavedState(localStorage.getItem(storageKey))
    } catch {
      return parseSavedState(null)
    }
  })
  const [view, setView] = useState<View>(getView)
  const [profileOpen, setProfileOpen] = useState(false)
  const [details, setDetails] = useState<University | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [query, setQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('Все страны')
  const { profile, completed, comparison, isDemo } = state
  const recommendations = recommend(profile)
  const target = universities.find((u) => u.id === state.target) ?? recommendations[0].university
  const tasks = createRoadmap(profile, target)
  const completedCount = tasks.filter((t) => completed.includes(t.id)).length
  const progress = Math.round((completedCount / tasks.length) * 100)
  const nextTask = tasks.find((t) => !completed.includes(t.id))
  const journeyStage = completedCount === tasks.length ? 4 : state.target ? 2 : 1
  const title = navigation.find((n) => n.id === view)!.label
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [state])
  useEffect(() => {
    const change = () => setView(getView())
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  function navigate(next: View) {
    window.location.hash = next
    setView(next)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function toggleCompare(id: string) {
    if (!comparison.includes(id) && comparison.length >= 3) {
      setToast('Можно сравнить до трёх программ. Убери одну, чтобы добавить другую.')
      return
    }
    setState((s) => ({
      ...s,
      comparison: s.comparison.includes(id) ? s.comparison.filter((v) => v !== id) : [...s.comparison, id],
    }))
  }
  function toggleTask(id: string) {
    setState((s) => ({
      ...s,
      completed: s.completed.includes(id) ? s.completed.filter((t) => t !== id) : [...s.completed, id],
    }))
  }
  function saveProfile(p: Profile) {
    setState((s) => ({ ...s, profile: p, isDemo: false, completed: [], target: null }))
    setProfileOpen(false)
    navigate('profile')
    setToast('Профиль сохранён. Подбор и маршрут обновлены.')
  }
  function chooseTarget(u: University) {
    setState((s) => ({ ...s, target: u.id }))
    setDetails(null)
    navigate('roadmap')
    setToast(`Маршрут построен для ${u.name}`)
  }
  const renderCards = (items: Recommendation[]) => (
    <div className="program-grid">
      {items.map((item) => (
        <ProgramCard
          key={item.university.id}
          item={item}
          profile={profile}
          selected={comparison.includes(item.university.id)}
          toggle={() => toggleCompare(item.university.id)}
          details={() => setDetails(item.university)}
        />
      ))}
    </div>
  )
  const demoNote = (
    <p className="data-note">
      <Info size={15} />
      Учебный каталог: вузы, стоимость и требования вымышлены. Совпадение критериев не означает вероятность
      поступления.
    </p>
  )
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      {mobileOpen && (
        <button className="sidebar-overlay" aria-label="Закрыть меню" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Основная навигация">
        <a href="#overview" className="brand" onClick={() => navigate('overview')}>
          <span className="brand-symbol">
            <ArrowUpRight size={30} strokeWidth={2.8} />
          </span>
          вектор<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <GraduationCap size={20} />
          </span>
          <div>
            <strong>Моё поступление</strong>
            <span>Бакалавриат · {profile.year}</span>
          </div>
        </div>
        <div className="nav-label">ТВОЁ ПРОСТРАНСТВО</div>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault()
                navigate(id)
              }}
              className={`nav-item ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={19} />
              {label}
              {id === 'compare' && comparison.length > 0 && (
                <span className="nav-count">{comparison.length}</span>
              )}
              {id === 'roadmap' && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-symbol">
              <MoveUpRight size={23} />
            </div>
            <strong>
              Твоё будущее начинается
              <br />с одного шага.
            </strong>
            <p>
              Не обязательно знать весь путь.
              <br />
              Достаточно начать.
            </p>
            <button onClick={() => navigate('roadmap')}>
              К моему маршруту
              <ArrowRight size={16} />
            </button>
          </div>
          <button className="help-button" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={18} />
            Как работает Вектор
            <ArrowUpRight size={15} />
          </button>
          <button className="sidebar-profile" onClick={() => setProfileOpen(true)}>
            <span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{profile.name}</strong>
              <small>{isDemo ? 'Демо-профиль' : 'Личный профиль'}</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Открыть меню"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb-root">Моё пространство</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="intake">
              <span />
              Набор {profile.year}
            </span>
            <span className="topbar-divider" />
            <button
              className="avatar small-avatar"
              onClick={() => setProfileOpen(true)}
              aria-label="Редактировать профиль"
            >
              {profile.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {storageError && (
            <div role="alert" className="storage-warning">
              Браузер не разрешает сохранение. Можно продолжить, но после перезагрузки изменения будут
              потеряны.
            </div>
          )}
          {view === 'overview' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ТВОЙ ПУТЬ К НОВОЙ ГЛАВЕ</div>
                  <h1>
                    Всё начинается с тебя<span className="lime-period">.</span>
                  </h1>
                  <p>От первого «куда поступать?» до понятного плана действий.</p>
                </div>
                <button className="button secondary edit-profile" onClick={() => setProfileOpen(true)}>
                  <SlidersHorizontal size={16} />
                  {isDemo ? 'Создать мой профиль' : 'Изменить профиль'}
                </button>
              </div>
              <section className="journey-banner" aria-label="Обзор твоего маршрута">
                <div className="banner-content">
                  <span className="banner-label">
                    <Sparkles size={15} />
                    {isDemo ? 'ПОПРОБУЙ НА ПРИМЕРЕ' : 'ТВОЙ ПЕРСОНАЛЬНЫЙ ВЕКТОР'}
                  </span>
                  <h2>
                    Большое будущее.
                    <br />
                    Понятный маршрут.
                  </h2>
                  <p>
                    {isDemo
                      ? 'Посмотри, как выглядит путь поступления. А затем создай свой — под твои интересы и цели.'
                      : `${profile.name}, мы учли твои интересы, подготовку и бюджет. Теперь двигайся к поступлению шаг за шагом.`}
                  </p>
                  <button
                    className="button dark"
                    onClick={() => (isDemo ? setProfileOpen(true) : navigate('roadmap'))}
                  >
                    {isDemo ? 'Построить мой маршрут' : 'Продолжить маршрут'}
                    <ArrowUpRight size={19} />
                  </button>
                  <span className="banner-footnote">
                    {isDemo
                      ? '3 коротких шага · Без регистрации'
                      : `${profile.interest} · Набор ${profile.year}`}
                  </span>
                </div>
                <div className="banner-progress">
                  <div className="progress-orbit">
                    <svg viewBox="0 0 180 180" aria-hidden="true">
                      <circle cx="90" cy="90" r="78" className="orbit-track" />
                      <circle
                        cx="90"
                        cy="90"
                        r="78"
                        className="orbit-value"
                        style={{ strokeDasharray: `${progress * 4.901} 490.1` }}
                      />
                    </svg>
                    <div className="orbit-center">
                      <Route size={27} />
                      <strong>
                        {progress}
                        <span>%</span>
                      </strong>
                      <small>маршрута пройдено</small>
                    </div>
                    <span className="orbit-star">
                      <Sparkles size={21} />
                    </span>
                  </div>
                  <div className="progress-caption">
                    <span className="little-dot" />
                    {completedCount} из {tasks.length} шагов завершено
                  </div>
                </div>
              </section>
              <div className="overview-columns">
                <div className="overview-primary">
                  <section className="recommendations-section">
                    <div className="section-heading">
                      <div>
                        <h2>
                          Твои возможные направления<span className="count-pill">3</span>
                        </h2>
                        <p>Подборка с учётом твоего профиля</p>
                      </div>
                      <button className="text-link" onClick={() => navigate('programs')}>
                        Все программы
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                    {renderCards(recommendations.slice(0, 3))}
                    {demoNote}
                  </section>
                  <section className="route-preview">
                    <div className="section-heading">
                      <div>
                        <h2>Шаг за шагом</h2>
                        <p>Сегодня — маленький шаг. Завтра — больше возможностей.</p>
                      </div>
                      <button className="text-link" onClick={() => navigate('roadmap')}>
                        Весь маршрут
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <div className="route-milestones">
                      {['Определить цель', 'Выбрать программу', 'Подготовиться', 'Подать заявку'].map(
                        (label, i) => (
                          <div
                            key={label}
                            className={i < journeyStage ? 'done' : i === journeyStage ? 'current' : ''}
                          >
                            <span>{i < journeyStage ? <Check size={17} /> : `0${i + 1}`}</span>
                            <strong>{label}</strong>
                            <small>
                              {i < journeyStage
                                ? 'Этап пройден'
                                : i === journeyStage
                                  ? 'Ты на этом этапе'
                                  : [
                                      'Твои интересы и цели',
                                      'Сравнить варианты',
                                      'Экзамены и документы',
                                      `Набор ${profile.year}`,
                                    ][i]}
                            </small>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                </div>
                <aside className="overview-secondary">
                  <section className="next-card">
                    <span className="card-eyebrow">
                      <span className="little-dot" />
                      БЛИЖАЙШИЙ ШАГ
                    </span>
                    <div className="next-icon">
                      {nextTask ? <Target size={25} /> : <CheckCheck size={25} />}
                    </div>
                    <h2>{nextTask?.title ?? 'Все шаги завершены!'}</h2>
                    <p>
                      {nextTask
                        ? 'Открой задачу, посмотри рекомендации и отметь её, когда закончишь.'
                        : 'Отличная работа. Проверь актуальные требования перед отправкой заявки.'}
                    </p>
                    <span className="task-time">
                      <Clock3 size={14} />
                      {nextTask?.timing ?? 'Ты на финишной прямой'}
                    </span>
                    <button className="button primary full" onClick={() => navigate('roadmap')}>
                      {nextTask ? 'Перейти к шагу' : 'Посмотреть маршрут'}
                      <ArrowRight size={17} />
                    </button>
                  </section>
                  <section className="profile-snapshot">
                    <div>
                      <h3>Твой ориентир</h3>
                      <button
                        className="icon-button"
                        onClick={() => setProfileOpen(true)}
                        aria-label="Изменить ориентир"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>
                          <BookOpen size={15} />
                          Направление
                        </dt>
                        <dd>{profile.interest}</dd>
                      </div>
                      <div>
                        <dt>
                          <Globe2 size={15} />
                          Страны
                        </dt>
                        <dd>{profile.countries.join(', ')}</dd>
                      </div>
                      <div>
                        <dt>
                          <GraduationCap size={15} />
                          Бюджет в год
                        </dt>
                        <dd>до {money(profile.budget)}</dd>
                      </div>
                    </dl>
                    <span className="snapshot-footer">
                      {isDemo ? 'Показан пример профиля' : 'Сохранено в этом браузере'}
                    </span>
                  </section>
                </aside>
              </div>
            </>
          )}
          {view === 'profile' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">НАЧНЁМ С ГЛАВНОГО</div>
                  <h1>
                    Твой профиль<span className="lime-period">.</span>
                  </h1>
                  <p>Основа рекомендаций и твоего маршрута поступления.</p>
                </div>
                <button className="button primary" onClick={() => setProfileOpen(true)}>
                  <Pencil size={16} />
                  {isDemo ? 'Создать свой профиль' : 'Редактировать'}
                </button>
              </div>
              {isDemo && (
                <div className="info-banner">
                  <Info size={20} />
                  <span>
                    Сейчас показан демо-профиль Алекса. Заполни анкету, чтобы построить свой маршрут.
                  </span>
                </div>
              )}
              <div className="diagnosis-grid">
                <section className="panel profile-panel">
                  <span className="large-avatar">{profile.name.slice(0, 1).toUpperCase()}</span>
                  <h2>{profile.name}</h2>
                  <p>
                    {profile.grade} · Бакалавриат {profile.year}
                  </p>
                  <div className="profile-stat-grid">
                    <div>
                      <small>Средний балл</small>
                      <strong>
                        {profile.gpa}
                        <em> / 5</em>
                      </strong>
                    </div>
                    <div>
                      <small>Английский</small>
                      <strong>{profile.ielts ? `IELTS ${profile.ielts}` : 'Не сдавал(а)'}</strong>
                    </div>
                  </div>
                  <dl className="profile-details">
                    <div>
                      <dt>Направление</dt>
                      <dd>{profile.interest}</dd>
                    </div>
                    <div>
                      <dt>Страны</dt>
                      <dd>{profile.countries.join(', ')}</dd>
                    </div>
                    <div>
                      <dt>Обучение в год</dt>
                      <dd>до {money(profile.budget)}</dd>
                    </div>
                  </dl>
                </section>
                <section className="panel diagnosis">
                  <span className="tag">
                    <Sparkles size={15} />
                    Диагностика профиля
                  </span>
                  <h2>У тебя есть отправная точка.</h2>
                  <p>
                    Цель — {programName(profile.interest)}, набор {profile.year}. Начни с{' '}
                    {recommendations[0].university.name}: этот пример соответствует{' '}
                    {recommendations[0].matches} из 5 критериев.
                  </p>
                  <h3>
                    <CircleCheck size={18} />
                    На что можно опереться
                  </h3>
                  <ul>
                    {recommendations[0].reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <h3>
                    <Target size={18} />
                    На что обратить внимание
                  </h3>
                  <ul>
                    {(recommendations[0].gaps.length
                      ? recommendations[0].gaps
                      : [
                          'Уточнить реальные вступительные требования',
                          'Учесть проживание, перелёты и визовые расходы',
                        ]
                    ).map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                  <button className="button dark" onClick={() => navigate('programs')}>
                    Посмотреть подборку
                    <ArrowRight size={17} />
                  </button>
                </section>
              </div>
              {demoNote}
            </>
          )}
          {view === 'programs' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">МЕСТО ДЛЯ ТВОИХ АМБИЦИЙ</div>
                  <h1>
                    Найди своё направление<span className="lime-period">.</span>
                  </h1>
                  <p>Объяснимый подбор по интересам, стране, бюджету, оценкам и языку.</p>
                </div>
                <button className="button secondary" onClick={() => setProfileOpen(true)}>
                  <SlidersHorizontal size={17} />
                  Настроить профиль
                </button>
              </div>
              <div className="filters">
                <label className="search-field">
                  <Search size={19} />
                  <input
                    aria-label="Поиск программ"
                    placeholder="Университет, город или направление"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Фильтр по стране"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option>Все страны</option>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <span className="muted small">По совпадению с профилем</span>
              </div>
              {(() => {
                const filtered = recommendations.filter(
                  (r) =>
                    (countryFilter === 'Все страны' || r.university.country === countryFilter) &&
                    `${r.university.name} ${r.university.city} ${r.university.fields.join(' ')} ${r.university.fields.map(programName).join(' ')}`
                      .toLowerCase()
                      .includes(query.toLowerCase().trim()),
                )
                return filtered.length ? (
                  renderCards(filtered)
                ) : (
                  <div className="empty-state">
                    <Search size={32} />
                    <h2>Пока ничего не нашлось</h2>
                    <p>Попробуй другой запрос или выбери все страны.</p>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setQuery('')
                        setCountryFilter('Все страны')
                      }}
                    >
                      Сбросить фильтры
                    </button>
                  </div>
                )
              })()}
              {demoNote}
              {comparison.length > 0 && (
                <div className="compare-bar">
                  <span>
                    <GitCompareArrows size={20} />В сравнении: <strong>{comparison.length} из 3</strong>
                  </span>
                  <button className="button dark" onClick={() => navigate('compare')}>
                    Сравнить программы
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </>
          )}
          {view === 'compare' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">РЕШЕНИЕ С ОТКРЫТЫМИ ГЛАЗАМИ</div>
                  <h1>
                    Сравни свои варианты<span className="lime-period">.</span>
                  </h1>
                  <p>Самое важное — рядом, чтобы выбрать свой путь.</p>
                </div>
                <button className="button secondary" onClick={() => navigate('programs')}>
                  <Plus size={17} />
                  Добавить программу
                </button>
              </div>
              {comparison.length < 2 ? (
                <div className="empty-state">
                  <GitCompareArrows size={38} />
                  <h2>Выбери минимум две программы</h2>
                  <p>Нажми «+» на карточках программ. Можно сравнить до трёх вариантов.</p>
                  {comparison.length === 1 && (
                    <p>
                      Уже выбрана: {universities.find((u) => u.id === comparison[0])?.name}{' '}
                      <button className="text-link" onClick={() => toggleCompare(comparison[0])}>
                        Убрать
                      </button>
                    </p>
                  )}
                  <button className="button primary" onClick={() => navigate('programs')}>
                    К подборке
                    <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Таблица сравнения программ"
                  tabIndex={0}
                >
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th scope="col">Твои критерии</th>
                        {comparison.map((id) => {
                          const u = universities.find((v) => v.id === id)!
                          return (
                            <th scope="col" key={id}>
                              <button
                                className="remove-compare"
                                aria-label={`Убрать ${u.name}`}
                                onClick={() => toggleCompare(id)}
                              >
                                <X size={16} />
                              </button>
                              <span className={`uni-monogram ${u.color}`}>{u.short}</span>
                              <h3>{u.name}</h3>
                              <small>
                                {u.city}, {u.country}
                              </small>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          'Направление',
                          (u: University) =>
                            u.fields.includes(profile.interest)
                              ? programName(profile.interest)
                              : `Другое: ${programName(u.fields[0])}`,
                        ],
                        [
                          'Совпадение критериев',
                          (u: University) =>
                            `${recommendations.find((r) => r.university.id === u.id)!.matches} из 5`,
                        ],
                        ['Обучение в год', (u: University) => money(u.fee)],
                        [
                          'В рамках бюджета',
                          (u: University) =>
                            u.fee <= profile.budget ? 'Да' : `Не хватает ${money(u.fee - profile.budget)}`,
                        ],
                        ['Язык обучения', () => 'Английский'],
                        [
                          'IELTS',
                          (u: University) =>
                            `${u.ielts} ${u.ielts > profile.ielts ? '· нужна подготовка' : '· соответствует'}`,
                        ],
                        ['Средний балл', (u: University) => `${u.gpa} / 5`],
                        ['Длительность', (u: University) => `${u.duration} года`],
                        ['Дедлайн', () => 'Нужно проверить в реальном вузе'],
                      ].map(([label, value]) => (
                        <tr key={label as string}>
                          <th scope="row">{label as string}</th>
                          {comparison.map((id) => (
                            <td key={id}>
                              {(value as (u: University) => string)(universities.find((u) => u.id === id)!)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <th scope="row">Следующий шаг</th>
                        {comparison.map((id) => (
                          <td key={id}>
                            <button
                              className="button primary"
                              onClick={() => chooseTarget(universities.find((u) => u.id === id)!)}
                            >
                              Выбрать программу
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {demoNote}
            </>
          )}
          {view === 'roadmap' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">НЕ ВСЁ СРАЗУ. ШАГ ЗА ШАГОМ.</div>
                  <h1>
                    Твой маршрут поступления<span className="lime-period">.</span>
                  </h1>
                  <p>Один следующий шаг, чтобы не потеряться среди десятков задач.</p>
                </div>
                <span className="tag">Набор {profile.year}</span>
              </div>
              <div className="roadmap-layout">
                <div>
                  <div className="roadmap-target">
                    <span className={`uni-monogram ${target.color}`}>{target.short}</span>
                    <div>
                      <small>ТВОЯ ЦЕЛЬ</small>
                      <h3>{target.name}</h3>
                      <span>
                        {programName(
                          target.fields.includes(profile.interest) ? profile.interest : target.fields[0],
                        )}{' '}
                        · {target.country}
                      </span>
                    </div>
                    <button className="text-link" onClick={() => navigate('programs')}>
                      Изменить
                    </button>
                  </div>
                  <div className="task-list">
                    {tasks.map((task, i) => {
                      const done = completed.includes(task.id)
                      return (
                        <article
                          key={task.id}
                          className={`task-row ${done ? 'completed' : ''} ${task.id === nextTask?.id ? 'next' : ''}`}
                        >
                          <button
                            className="task-check"
                            aria-label={`${done ? 'Отменить выполнение' : 'Завершить'}: ${task.title}`}
                            aria-pressed={done}
                            onClick={() => toggleTask(task.id)}
                          >
                            {done ? <Check size={19} /> : <span>{String(i + 1).padStart(2, '0')}</span>}
                          </button>
                          <div>
                            <div className="task-meta">
                              <span>{task.category}</span>
                              {task.id === nextTask?.id && <b>Следующий шаг</b>}
                            </div>
                            <h3>{task.title}</h3>
                            <p>{task.description}</p>
                            <span className="task-time">
                              <Clock3 size={14} />
                              {task.timing}
                            </span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
                <aside>
                  <section className="panel progress-panel">
                    <span className="eyebrow">ТВОЙ ПРОГРЕСС</span>
                    <strong>
                      {progress}
                      <span>%</span>
                    </strong>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label="Прогресс маршрута"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <i style={{ width: `${progress}%` }} />
                    </div>
                    <p>
                      {completedCount} из {tasks.length} шагов завершено
                    </p>
                    <hr />
                    <p>Отмечай выполненные задачи. Твой прогресс сохранится в этом браузере.</p>
                  </section>
                  <div className="roadmap-note">
                    <Info size={20} />
                    <p>
                      Сроки в плане — ориентиры для подготовки. Официальные дедлайны и условия нужно проверить
                      у реального университета.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>
              вектор<span>↗</span> <small>Твоё будущее. Твоё направление.</small>
            </span>
            <button onClick={() => setHelpOpen(true)}>
              О проекте
              <ArrowUpRight size={14} />
            </button>
          </footer>
        </main>
      </div>
      {profileOpen && (
        <ProfileForm profile={profile} onSave={saveProfile} onClose={() => setProfileOpen(false)} />
      )}
      {details && (
        <Modal title="Ближе к твоей цели" onClose={() => setDetails(null)}>
          <div className="detail-heading">
            <span className={`uni-monogram ${details.color}`}>{details.short}</span>
            <div>
              <h3>{details.name}</h3>
              <p>
                {details.city}, {details.country}
              </p>
            </div>
          </div>
          <div className="detail-facts">
            <span>{money(details.fee)} / год</span>
            <span>IELTS {details.ielts}</span>
            <span>{details.duration} года</span>
          </div>
          <div className="detail-reasons">
            <h3>Почему этот вариант в подборке</h3>
            {recommendations
              .find((r) => r.university.id === details.id)!
              .reasons.map((r) => (
                <p key={r}>
                  <CircleCheck size={17} />
                  {r}
                </p>
              ))}
            {recommendations
              .find((r) => r.university.id === details.id)!
              .gaps.map((r) => (
                <p className="gap" key={r}>
                  <Info size={17} />
                  {r}
                </p>
              ))}
          </div>
          <div className="field-note">
            <Info size={19} />
            <p>
              Это вымышленный университет для демонстрации. Все требования и цены — примеры, а не фактические
              условия поступления.
            </p>
          </div>
          <div className="detail-actions">
            <button className="button secondary" onClick={() => toggleCompare(details.id)}>
              {comparison.includes(details.id) ? <Check size={17} /> : <Plus size={17} />}
              {comparison.includes(details.id) ? 'В сравнении' : 'Сравнить'}
            </button>
            <button className="button primary" onClick={() => chooseTarget(details)}>
              Выбрать и построить план
              <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
      {helpOpen && (
        <Modal title="Каждой цели нужен вектор" onClose={() => setHelpOpen(false)}>
          <div className="help-content">
            <p>
              Вектор помогает старшеклассникам пройти путь от выбора направления до плана поступления на
              бакалавриат.
            </p>
            <ol>
              <li>Расскажи о себе в короткой анкете.</li>
              <li>Посмотри, какие программы подходят и почему.</li>
              <li>Сравни варианты и выбери цель.</li>
              <li>Двигайся по маршруту и отмечай прогресс.</li>
            </ol>
            <h3>Как работает подбор</h3>
            <p>
              Используем понятные правила: направление, страна, бюджет, IELTS и средний балл. Наибольший вес
              имеют направление, бюджет и страна. Совпадение — не оценка шансов поступления.
            </p>
            <h3>Что важно знать</h3>
            <p>
              Это начальный проект по кейсу LOCUS Hackathon 2026. Каталог вымышленный, внешняя AI-модель не
              подключена. Данные сохраняются только в этом браузере и не отправляются на сервер. Изменение
              профиля пересчитывает подбор и начинает новый план.
            </p>
          </div>
          <button className="button dark full" onClick={() => setHelpOpen(false)}>
            Понятно, идём дальше
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={19} />
          {toast}
          <button aria-label="Закрыть уведомление" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
