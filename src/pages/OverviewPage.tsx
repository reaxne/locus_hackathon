import {
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  Route,
  Check,
  CheckCheck,
  Clock3,
  Sparkles,
  SlidersHorizontal,
  Globe2,
  Target,
  Pencil,
  BookOpen,
} from 'lucide-react'
import { money } from '../model'
import type { AdmissionController } from '../hooks/useAdmission'
import DemoDataNote from '../components/DemoDataNote'
import ProgramGrid from '../components/ProgramGrid'

type Props = Pick<
  AdmissionController,
  | 'setProfileOpen'
  | 'setDetails'
  | 'profile'
  | 'comparison'
  | 'isDemo'
  | 'recommendations'
  | 'tasks'
  | 'completedCount'
  | 'progress'
  | 'nextTask'
  | 'journeyStage'
  | 'navigate'
  | 'toggleCompare'
>

export default function OverviewPage({
  setProfileOpen,
  setDetails,
  profile,
  comparison,
  isDemo,
  recommendations,
  tasks,
  completedCount,
  progress,
  nextTask,
  journeyStage,
  navigate,
  toggleCompare,
}: Props) {
  return (
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
            {isDemo ? '3 коротких шага · Без регистрации' : `${profile.interest} · Набор ${profile.year}`}
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
            <ProgramGrid
              items={recommendations.slice(0, 3)}
              profile={profile}
              comparison={comparison}
              toggleCompare={toggleCompare}
              setDetails={setDetails}
            />
            <DemoDataNote />
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
              {['Определить цель', 'Выбрать программу', 'Подготовиться', 'Подать заявку'].map((label, i) => (
                <div key={label} className={i < journeyStage ? 'done' : i === journeyStage ? 'current' : ''}>
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
              ))}
            </div>
          </section>
        </div>
        <aside className="overview-secondary">
          <section className="next-card">
            <span className="card-eyebrow">
              <span className="little-dot" />
              БЛИЖАЙШИЙ ШАГ
            </span>
            <div className="next-icon">{nextTask ? <Target size={25} /> : <CheckCheck size={25} />}</div>
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
  )
}
