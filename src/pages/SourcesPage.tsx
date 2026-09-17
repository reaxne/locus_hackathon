import { CheckCircle2, CircleHelp, FlaskConical } from 'lucide-react'
import { External, Fact, PageHeading } from '../components/Shared'
import type { Admission } from '../hooks/useAdmission'
import { examResources } from '../data/exams'
import { examLabel } from '../lib/profile'

export default function SourcesPage({ admission }: { admission: Admission }) {
  const { programs, universities } = admission
  return (
    <>
      <PageHeading
        eyebrow="ПРОЗРАЧНОСТЬ ДАННЫХ"
        title="Источники и данные"
        description="Для каждого поля показаны сведения и источники из текущей подборки."
        back="/"
      />
      <div className="source-status-grid">
        <article className="panel">
          <CheckCircle2 className="teal" />
          <h2>Подтверждено</h2>
          <p>
            Поле подтверждено официальным источником. Стоимость и правила должны соответствовать вашему году и
            категории поступления.
          </p>
        </article>
        <article className="panel">
          <CircleHelp className="terracotta" />
          <h2>Пока неизвестно</h2>
          <p>
            Данные отсутствуют, не подтверждены или не относятся к вашему году. Отметка «Уточните на
            официальном сайте» не означает нулевую стоимость.
          </p>
        </article>
        <article className="panel">
          <FlaskConical className="teal" />
          <h2>Пример</h2>
          <p>
            Демонстрационная анкета — пример. Записи университетов реальные; вымышленные цены и сроки не
            используются.
          </p>
        </article>
      </div>
      <section className="panel methodology">
        <div>
          <span className="small-label">ПОНЯТНЫЕ РЕКОМЕНДАЦИИ</span>
          <h2>Как формируется подбор</h2>
        </div>
        <ol>
          <li>
            <strong>Учитываем строгие ограничения.</strong> Казахстан, бакалавриат и выбранный город при
            запрете переезда.
          </li>
          <li>
            <strong>Сортируем по предпочтениям.</strong> Учитываем интересы, город, подтверждённую стоимость и
            подготовку к экзаменам. Причины подбора и ограничения представлены вместе с каждой программой.
          </li>
          <li>
            <strong>Показываем пробелы.</strong> Неизвестные цены и требования остаются неизвестными. Отмечаем
            превышение бюджета. Желание получить грант не гарантирует его наличие.
          </li>
          <li>
            <strong>Формируем актуальные шаги.</strong> Шаги поступления приходят вместе с подборкой.
            Выбранные программы определяют, какие из этих шагов показаны в маршруте.
          </li>
        </ol>
        <p>
          Рекомендации формируются по понятным правилам. Мы не предсказываем вероятность поступления или
          получения гранта. Статус экзамена показывает подготовку, а не подтверждённое соответствие
          требованиям.
        </p>
      </section>
      <div className="section-intro">
        <div>
          <span className="eyebrow">КАТАЛОГ ИСТОЧНИКОВ</span>
          <h2>Университеты вашей подборки. Источники данных.</h2>
        </div>
      </div>
      <div className="source-records">
        {universities.map((university) => (
          <section className="panel" key={university.id}>
            <div className="source-university">
              <span className={`university-monogram ${university.id}`}>{university.shortName}</span>
              <div>
                <h2>{university.name}</h2>
                <External href={university.sourceUrl}>Официальные сведения об университете</External>
              </div>
            </div>
            {programs
              .filter((p) => p.universityId === university.id)
              .map((program) => (
                <details key={program.id}>
                  <summary>
                    {program.title.value}
                    {program.code ? ` · ${program.code}` : ''}
                  </summary>
                  <div className="source-facts">
                    {(
                      [
                        ['Название программы', program.title],
                        ['Продолжительность', program.duration],
                        ['Язык обучения', program.language],
                        ['Стоимость в ₸', program.tuition],
                        ['Срок подачи', program.deadline],
                        ['Финансирование', program.grant],
                      ] as const
                    ).map(([label, fact]) => (
                      <div key={label}>
                        <strong>{label}</strong>
                        <Fact
                          fact={fact as import('../types').SourcedFact<string | number>}
                          profile={admission.state.profile ?? undefined}
                        />
                      </div>
                    ))}
                    <div>
                      <strong>Документы</strong>
                      <Fact
                        fact={program.documents}
                        profile={admission.state.profile ?? undefined}
                        format={(items) => items.join('; ')}
                      />
                    </div>
                    <div>
                      <strong>Требования к поступлению</strong>
                      <Fact
                        fact={program.examRequirements}
                        profile={admission.state.profile ?? undefined}
                        format={(items) => items.map((item) => examLabel(item.exam)).join(', ')}
                      />
                    </div>
                  </div>
                </details>
              ))}
          </section>
        ))}
      </div>
      <section className="panel data-limitations">
        <h2>Личные цели и идеи портфолио</h2>
        <p>
          Цели экзаменов и периоды занятий задаёте вы. Это не подтверждённые требования или сроки поступления.
          Идеи портфолио — рекомендации для планирования. Подтверждённых проектов поступивших студентов в
          каталоге пока нет.
        </p>
        <p>
          Ссылки ведут к официальным организаторам экзаменов. Учебные шаги — рекомендации для подготовки, а не
          дополнительные требования университета.
        </p>
        <div className="button-row">
          {Object.entries(examResources).map(([exam, resource]) => (
            <External key={exam} href={resource.url}>
              {examLabel(exam as import('../types').GoalExamName)}: {resource.label}
            </External>
          ))}
        </div>
      </section>
      <section className="panel data-limitations">
        <h2>Охват и ограничения</h2>
        <p>
          Показаны программы из текущей подборки. Неизвестные поля нужно уточнять в университете. Полный
          каталог, язык, город и длительность обучения пока недоступны в ответе сервера.
        </p>
        <p>
          Некоторые страницы указывают язык и продолжительность без года поступления. Это описание программы,
          а не гарантия будущих условий. Перед подачей перепроверьте сведения.
        </p>
        <p>
          Государственный реестр помогает проверить названия и адреса. Он не подтверждает стоимость, гранты и
          сроки и не используется как источник этих полей.
        </p>
        <External href="https://data.egov.kz/datasets/view?index=onirler_oblystar_kalalar_boi11">
          Государственный реестр университетов
        </External>
        <p>
          Анкета и профиль хранятся в аккаунте. Список программ, активности и отметки задач доступны только в
          текущем сеансе: сервер пока не поддерживает их сохранение.
        </p>
      </section>
    </>
  )
}
