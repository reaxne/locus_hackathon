import { ArrowRight, MapPin, X } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { money } from '../data/universities'
import { External, Empty, Fact, Notice, PageHeading } from '../components/Shared'
import { Link, useRouter } from '../lib/router'
import { ru } from '../lib/labels'
import { examLabel } from '../lib/profile'

export default function ComparePage({ admission }: { admission: Admission }) {
  const { programs, universityFor } = admission
  const { go } = useRouter()
  const profile = admission.state.profile
  const selected = programs.filter((program) => admission.state.comparison.includes(program.id))
  if (!profile)
    return (
      <Empty title="Сначала заполните анкету" art="survey">Сравнение учитывает год поступления, бюджет и интересы.</Empty>
    )
  return (
    <>
      <PageHeading
        eyebrow="СРАВНЕНИЕ ПРОГРАММ"
        title="Сравните и выберите."
        description="Сравните подтверждённые сведения, уточните пробелы и выберите основную программу."
        back="/matches"
      >
        <Link className="button secondary" href="/matches">
          Изменить выбор
        </Link>
      </PageHeading>
      {selected.length < 2 ? (
        <Empty title="Выберите хотя бы две программы" href="/matches" action="Выбрать программы" art="programs">
          {selected.length === 1
            ? 'Выбрана одна программа. Добавьте ещё одну для сравнения.'
            : 'Добавьте два или три варианта из каталога.'}
        </Empty>
      ) : (
        <>
          <Notice>
            «Уточните на официальном сайте» означает, что сведения не подтверждены для вашего года или
            категории. Основную программу можно изменить.
          </Notice>
          <div className="comparison-grid" style={{ '--columns': selected.length } as React.CSSProperties}>
            {selected.map((program) => {
              const uni = universityFor(program)
              return (
                <article className="panel compare-card" key={program.id}>
                  <div className="compare-card-head">
                    <div className="card-top">
                      <span className={`university-monogram ${uni.id}`}>{uni.shortName}</span>
                      <button
                        className="icon-button"
                        onClick={() => admission.toggleCompare(program.id)}
                        aria-label={`Убрать ${uni.shortName} ${program.title.value}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="university-name">{uni.name}</p>
                    <h2>{program.title.value}</h2>
                    <span className="program-meta">
                      <MapPin size={13} />
                      {ru(uni.city)}, Казахстан
                    </span>
                  </div>
                  <dl className="comparison-rows">
                    <div>
                      <dt>Направление</dt>
                      <dd>
                        {program.title.value}
                        {program.code && <small>{program.code}</small>}
                        <External href={program.title.sourceUrl}>Источник программы</External>
                        <small>Проверено {program.title.verifiedAt}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Продолжительность</dt>
                      <dd>
                        <Fact fact={program.duration} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Язык обучения</dt>
                      <dd>
                        <Fact fact={program.language} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Стоимость за год · ₸</dt>
                      <dd>
                        <Fact fact={program.tuition} profile={profile} format={money} />
                      </dd>
                    </div>
                    <div>
                      <dt>Требования к экзаменам</dt>
                      <dd>
                        <Fact
                          fact={program.examRequirements}
                          profile={profile}
                          format={(requirements) =>
                            requirements
                              .map((r) => `${examLabel(r.exam)}${r.minimum === null ? '' : `: ${r.minimum}`}`)
                              .join(', ')
                          }
                        />
                        <small>
                          Что изучить: {program.researchExams.map(examLabel).join(', ')}. Возможны
                          альтернативные пути; не все экзамены обязательны.
                        </small>
                      </dd>
                    </div>
                    <div>
                      <dt>Гранты и финансирование</dt>
                      <dd>
                        <Fact fact={program.grant} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Срок подачи заявления</dt>
                      <dd>
                        <Fact fact={program.deadline} profile={profile} />
                      </dd>
                    </div>
                    <div>
                      <dt>Перед подачей</dt>
                      <dd>
                        Уточните в университете свою категорию, экзамены, документы и даты.
                        <External href={program.admissionsUrl}>Информация о поступлении</External>
                      </dd>
                    </div>
                  </dl>
                  <button
                    className="button primary"
                    onClick={() => {
                      admission.chooseFocus(program.id)
                      go('/roadmap')
                    }}
                  >
                    Выбрать основную программу
                    <ArrowRight size={17} />
                  </button>
                </article>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
