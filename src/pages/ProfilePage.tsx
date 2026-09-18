import { ArrowRight } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { Empty, Notice, PageHeading } from '../components/Shared'
import ProfileSummary from '../components/ProfileSummary'
import { examLabel } from '../lib/profile'
import { goalExamNames } from '../types'
import { Link } from '../lib/router'
import ProfileInsights from '../components/ProfileInsights'

export default function ProfilePage({ admission }: { admission: Admission }) {
  const p = admission.state.profile
  if (!p)
    return (
      <Empty title="Начните с одного вопроса" href="/diagnosis" action="Пройти анкету">
        Расскажите об интересах и планах. Ответы сохраняются автоматически.
      </Empty>
    )
  return (
    <>
      <PageHeading
        eyebrow="МОЙ ПРОФИЛЬ"
        title="Мой профиль"
        description="Ответы сохраняются автоматически. Маршрут обновится в фоне, а подбор вузов — по кнопке «Обновить подбор»."
        back="/roadmap"
      />
      {admission.state.isDemo && <Notice>Это пример анкеты. Измените ответы под свои планы.</Notice>}
      <ProfileInsights admission={admission} />
      <section className="panel summary-panel">
        <div className="section-intro">
          <div>
            <span className="eyebrow">ВАШИ ОТВЕТЫ</span>
            <h2>Цели, сильные стороны и предпочтения</h2>
          </div>
          <span className="pill">
            {admission.saveStatus === 'saved' ? 'Сохранено в аккаунте' : 'Есть несохранённые изменения'}
          </span>
        </div>
        <ProfileSummary admission={admission} />
      </section>
      <section className="panel summary-panel">
        <div className="section-intro">
          <div>
            <span className="eyebrow">ВАШИ ЦЕЛИ ПО ЭКЗАМЕНАМ</span>
            <h2>Личные цели</h2>
          </div>
          <Link className="button secondary" href="/exam-goals">
            Изменить цели
          </Link>
        </div>
        <div className="profile-goals">
          {goalExamNames.map((exam) => (
            <article key={exam}>
              <strong>{examLabel(exam)}</strong>
              <span>Сейчас: {p.exams[exam].score ?? 'Пока неизвестно'}</span>
              <span>Цель: {p.examGoals[exam].targetScore ?? 'Не задана'}</span>
              <small>{p.examGoals[exam].targetDate ?? 'Дата не задана'} · личная цель</small>
            </article>
          ))}
        </div>
        <p className="muted">Это ваши цели. Не все университеты требуют каждый из экзаменов.</p>
      </section>
      <div className="page-action">
        <p>Требования, стоимость и сроки нужно уточнить для вашего года поступления.</p>
        <Link className="button primary" href="/universities">
          Найти университет
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  )
}
