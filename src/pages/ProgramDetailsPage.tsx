import { ArrowRight, MapPin } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { money } from '../data/universities'
import { Empty, External, Fact, Notice, PageHeading } from '../components/Shared'
import SaveOption from '../components/SaveOption'
import { Link } from '../lib/router'
import { ru } from '../lib/labels'
import { examLabel } from '../lib/profile'

export default function ProgramDetailsPage({
  admission,
  programId,
}: {
  admission: Admission
  programId: string
}) {
  const { programs, universityFor } = admission
  const program = programs.find((p) => p.id === programId)
  if (!program)
    return (
      <Empty title="Программа не найдена" href="/universities" action="Найти университет" art="programs">
        Выберите программу из каталога.
      </Empty>
    )
  const uni = universityFor(program)
  const profile = admission.state.profile ?? undefined
  const match = admission.recommendations.find((result) => result.program.id === program.id)
  const ideas = match?.ideas ?? []
  return (
    <>
      <PageHeading
        eyebrow={uni.name.toUpperCase()}
        title={program.title.value ?? 'О программе'}
        description={program.description}
        back="/universities"
      />
      <div className="details-layout">
        <div>
          <section className="panel details-intro">
            <div className="card-top">
              <span className={`university-monogram ${uni.id}`}>{uni.shortName}</span>
              <span className="pill subtle">Бакалавриат · {program.code ?? 'Компьютерные науки'}</span>
            </div>
            <h2>{uni.name}</h2>
            <p className="program-meta">
              <MapPin size={14} />
              {ru(uni.city)}, Казахстан
            </p>
            <External href={program.title.sourceUrl}>Официальная страница программы</External>
            <small className="muted">Программа проверена {program.title.verifiedAt}</small>
          </section>
          {match ? (
            <div className="detail-reasons">
              <section className="panel">
                <h2>Почему стоит рассмотреть</h2>
                <ul className="plain-list">
                  {match.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </section>
              <section className="panel">
                <h2>Что нужно уточнить</h2>
                <ul className="plain-list">
                  {match.caveats.map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            profile && (
              <Notice>
                Программа не соответствует строгим ограничениям. Её можно сохранить, но задачи по ней появятся
                в маршруте после изменения ограничений.
              </Notice>
            )
          )}
          <section className="panel details-facts">
            <h2>Программа и поступление</h2>
            <div className="details-fact-grid">
              <article>
                <h3>Продолжительность</h3>
                <Fact fact={program.duration} profile={profile} />
              </article>
              <article>
                <h3>Язык обучения</h3>
                <Fact fact={program.language} profile={profile} />
              </article>
              <article>
                <h3>Стоимость за год</h3>
                <Fact fact={program.tuition} profile={profile} format={money} />
              </article>
              <article>
                <h3>Гранты и финансирование</h3>
                <Fact fact={program.grant} profile={profile} />
              </article>
              <article>
                <h3>Требования и экзамены</h3>
                <Fact
                  fact={program.examRequirements}
                  profile={profile}
                  format={(items) =>
                    items
                      .map((item) => `${examLabel(item.exam)}: ${item.minimum ?? 'порог не подтверждён'}`)
                      .join('; ')
                  }
                />
                <p>
                  Что изучить: {program.researchExams.map(examLabel).join(', ')}. Уточните путь поступления;
                  не все экзамены обязательны.
                </p>
              </article>
              <article>
                <h3>Необходимые документы</h3>
                <Fact fact={program.documents} profile={profile} format={(items) => items.join('; ')} />
              </article>
              <article>
                <h3>Срок подачи заявления</h3>
                <Fact fact={program.deadline} profile={profile} />
              </article>
              <article>
                <h3>Как подать заявление</h3>
                <p>
                  Уточните категорию и год поступления, затем следуйте действующим инструкциям университета.
                </p>
                <External href={program.admissionsUrl}>Официальные этапы поступления</External>
              </article>
            </div>
          </section>
          <section className="panel portfolio-examples">
            <span className="pill warning">Идеи для портфолио</span>
            <h2>Как попробовать себя в направлении</h2>
            <p>
              У нас нет подтверждённых публичных проектов поступивших студентов этой программы. Ниже — идеи
              для практики, а не обязательные проекты.
            </p>
            {ideas.map((idea) => (
              <article key={idea.id}>
                <h3>{idea.title}</h3>
                <p>{idea.description}</p>
                <small>Возможный результат: {idea.outcome}</small>
              </article>
            ))}
            <Link className="text-button" href="/portfolio">
              Составить план портфолио
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
        <aside className="panel details-save">
          <span className="small-label">ВАШ ВЫБОР</span>
          <h2>Сохраните программу.</h2>
          <p>«Мечта», «Цель» и «Запасной вариант» — личные метки. Они не описывают шансы поступления.</p>
          {profile ? (
            <>
              <SaveOption admission={admission} programId={program.id} />
              <button
                className="button secondary"
                disabled={!match}
                aria-pressed={admission.state.comparison.includes(program.id)}
                onClick={() => admission.toggleCompare(program.id)}
              >
                {admission.state.comparison.includes(program.id)
                  ? 'Убрать из сравнения'
                  : 'Добавить к сравнению'}
              </button>
              <Link className="text-button" href="/compare">
                Открыть сравнение
                <ArrowRight size={16} />
              </Link>
              <Link href="/my-list">Мои университеты</Link>
            </>
          ) : (
            <Link className="button primary" href="/diagnosis">
              Заполнить анкету
            </Link>
          )}
        </aside>
      </div>
    </>
  )
}
