import { ArrowRight, CheckCircle, Search } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { ru } from '../lib/labels'
import { Link } from '../lib/router'
import ProgramCard from '../components/ProgramCard'
import { PageHeading, Notice } from '../components/Shared'

export default function AnalysisPage({ admission }: { admission: Admission }) {
  const p = admission.state.profile!
  const matches = admission.recommendations
  const selected = new Set(admission.state.savedOptions.map((item) => item.programId))
  const relevant = matches.filter((match) => selected.has(match.program.id))
  const gaps = [
    ...new Set([
      ...admission.recommendationWarnings,
      ...(relevant.length ? relevant : matches).flatMap((match) => match.caveats),
    ]),
  ]
  return (
    <>
      <PageHeading
        eyebrow="ДИАГНОСТИКА ПРОФИЛЯ"
        title="От цели — к вашим возможностям."
        description="Резюме ответов и прозрачные правила подбора. Без вымышленных шансов поступления."
        back="/profile"
      >
        <Link className="button secondary" href="/profile">
          Изменить ответы
        </Link>
      </PageHeading>
      <section className="analysis-grid">
        <article className="panel analysis-panel">
          <span className="eyebrow">ВАША ЦЕЛЬ</span>
          <h2>{ru(p.interest)}</h2>
          <p>
            {p.grade} класс · поступление в {p.entryYear} году · {ru(p.city)}
          </p>
          <p>
            Язык:{' '}
            {({ any: 'любой', ru: 'русский', kk: 'казахский', en: 'английский' } as const)[p.studyLanguage]}
          </p>
        </article>
        <article className="panel analysis-panel">
          <CheckCircle size={24} />
          <h2>На что можно опереться</h2>
          <p>
            {p.academicStrengths.length
              ? p.academicStrengths.map(ru).join(', ')
              : 'Ваш интерес к направлению — отправная точка. Сильные стороны можно уточнить в профиле.'}
          </p>
          <p>
            {p.academicPerformance === 'excellent'
              ? 'По вашей оценке, вы учитесь преимущественно на отлично.'
              : p.academicPerformance === 'good'
                ? 'По вашей оценке, вы учитесь преимущественно на хорошие оценки.'
                : 'Оценки не используются как прогноз поступления.'}
          </p>
        </article>
        <article className="panel analysis-panel">
          <Search size={24} />
          <h2>Что уточнить и подготовить</h2>
          <ul>
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          <p>Отсутствие необязательного экзамена не считается слабой стороной.</p>
        </article>
      </section>
      {p.constraints && (
        <Notice>
          Ваши условия: {p.constraints}. Их нужно обсудить с университетами; автоматический подбор не
          подтверждает доступность этих условий.
        </Notice>
      )}
      <div className="section-intro">
        <div>
          <span className="eyebrow">РЕКОМЕНДАЦИИ ПО ВАШИМ ОТВЕТАМ</span>
          <h2>Программы для изучения</h2>
          <p>
            Сравните причины подбора и неизвестные требования. Добавьте подходящие варианты в свой список.
          </p>
        </div>
        <Link className="text-button" href="/universities">
          Поиск и фильтры
          <ArrowRight size={18} />
        </Link>
      </div>
      {matches.length ? (
        <div className="program-grid">
          {matches.map((match) => (
            <ProgramCard key={match.program.id} match={match} admission={admission} />
          ))}
        </div>
      ) : (
        <section className="panel empty">
          <h2>В подборке нет программ с такими ограничениями</h2>
          <p>Сервер не вернул подходящих программ для вашей анкеты.</p>
          <Link className="button secondary" href="/profile">
            Изменить условия
          </Link>
        </section>
      )}
      <section className="panel analysis-continue">
        <p>Добавлено программ: {selected.size}. Общие шаги подготовки сохранятся при изменении списка.</p>
        <div className="button-row">
          <Link className="button primary" href="/roadmap">
            Открыть мой маршрут
            <ArrowRight size={18} />
          </Link>
          {admission.state.comparison.length >= 2 && (
            <Link className="button secondary" href="/compare">
              Сравнить выбранные программы
            </Link>
          )}
        </div>
      </section>
    </>
  )
}
