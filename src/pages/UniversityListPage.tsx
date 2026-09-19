import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import type { Admission } from '../hooks/useAdmission'
import { listLabels } from '../types'
import { Link, useRouter } from '../lib/router'
import { Empty, Notice, PageHeading } from '../components/Shared'
import SaveOption from '../components/SaveOption'
import { ru } from '../lib/labels'

export default function UniversityListPage({ admission }: { admission: Admission }) {
  const { programs, universityFor } = admission
  const [filter, setFilter] = useState('All labels')
  const { go } = useRouter()
  const p = admission.state.profile
  if (!p)
    return (
      <Empty title="Список начинается с анкеты" href="/diagnosis" action="Пройти анкету" art="list">
        Расскажите о планах и сохраняйте интересующие программы.
      </Empty>
    )
  const visible = admission.state.savedOptions.filter(
    (option) =>
      programs.some((program) => program.id === option.programId) &&
      (filter === 'All labels' || option.label === filter),
  )
  return (
    <>
      <PageHeading
        eyebrow="МОИ УНИВЕРСИТЕТЫ"
        title="Мои университеты"
        description="Сохраняйте программы, расставляйте приоритеты и выбирайте основную цель."
        back="/roadmap"
      >
        <Link className="button primary" href="/universities">
          Найти университет
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <Notice>
        «Мечта», «Цель» и «Запасной вариант» — личные метки, а не вероятность поступления. Для каждого
        варианта нужно проверить требования и финансирование. Список доступен только в текущем сеансе.
      </Notice>
      <label className="list-filter">
        Фильтр по метке
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All labels">Все метки</option>
          {listLabels.map((label) => (
            <option key={label} value={label}>
              {ru(label)}
            </option>
          ))}
        </select>
      </label>
      {!visible.length ? (
        <section className="empty panel">
          <h2>
            {admission.state.savedOptions.length
              ? 'Нет программ с этой меткой'
              : 'Добавьте первый университет'}
          </h2>
          <p>Откройте программу и добавьте её в список.</p>
          {admission.state.savedOptions.length ? (
            <button className="button secondary" onClick={() => setFilter('All labels')}>
              Показать все варианты
            </button>
          ) : (
            <Link className="button primary" href="/universities">
              Найти университет
            </Link>
          )}
        </section>
      ) : (
        <div className="saved-program-grid">
          {visible.map((option) => {
            const program = programs.find((item) => item.id === option.programId)!
            const uni = universityFor(program)
            const allowed = admission.recommendations.some((match) => match.program.id === program.id)
            return (
              <article className="panel saved-program" key={option.programId}>
                <div className="card-top">
                  <span className={`university-monogram ${uni.id}`}>{uni.shortName}</span>
                  <span className="pill">{ru(option.label)}</span>
                </div>
                <p className="university-name">{uni.name}</p>
                <h2>
                  <Link href={`/universities/${program.id}`}>{program.title.value}</Link>
                </h2>
                <p className="muted">
                  {ru(uni.city)} · {p.entryYear} год поступления
                </p>
                {!allowed && (
                  <Notice>
                    Не соответствует ограничению по городу. Остаётся в списке, но не участвует в текущем
                    маршруте.
                  </Notice>
                )}
                <SaveOption admission={admission} programId={program.id} />
                <div className="button-row">
                  <button
                    className="button secondary"
                    disabled={!allowed}
                    aria-pressed={admission.state.comparison.includes(program.id)}
                    onClick={() => admission.toggleCompare(program.id)}
                  >
                    {admission.state.comparison.includes(program.id) ? 'Убрать из сравнения' : 'Сравнить'}
                  </button>
                  <button
                    className="button primary"
                    disabled={!allowed}
                    onClick={() => {
                      admission.chooseFocus(program.id)
                      go('/roadmap')
                    }}
                  >
                    {admission.state.focus === program.id ? (
                      <>
                        <Check size={15} />
                        Основная программа
                      </>
                    ) : (
                      'Выбрать для плана'
                    )}
                  </button>
                </div>
                <Link className="text-button" href={`/universities/${program.id}`}>
                  Подробнее
                  <ArrowRight size={15} />
                </Link>
              </article>
            )
          })}
        </div>
      )}
      {admission.state.comparison.length > 0 && (
        <div className="page-action">
          <p>{admission.state.comparison.length} программ выбрано для сравнения.</p>
          <Link className="button secondary" href="/compare">
            Открыть сравнение
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </>
  )
}
