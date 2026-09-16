import { ArrowRight, Sparkles, Target, CircleCheck, Info, Pencil } from 'lucide-react'
import { money, programName } from '../model'
import type { AdmissionController } from '../hooks/useAdmission'
import DemoDataNote from '../components/DemoDataNote'

type Props = Pick<
  AdmissionController,
  'setProfileOpen' | 'profile' | 'isDemo' | 'recommendations' | 'navigate'
>

export default function ProfilePage({ setProfileOpen, profile, isDemo, recommendations, navigate }: Props) {
  return (
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
          <span>Сейчас показан демо-профиль Алекса. Заполни анкету, чтобы построить свой маршрут.</span>
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
            {recommendations[0].university.name}: этот пример соответствует {recommendations[0].matches} из 5
            критериев.
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
      <DemoDataNote />
    </>
  )
}
