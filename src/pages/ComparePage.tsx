import { ArrowRight, GitCompareArrows, Plus, X } from 'lucide-react'
import { money, programName, universities, type University } from '../model'
import type { AdmissionController } from '../hooks/useAdmission'
import DemoDataNote from '../components/DemoDataNote'

type Props = Pick<
  AdmissionController,
  'profile' | 'comparison' | 'recommendations' | 'navigate' | 'toggleCompare' | 'chooseTarget'
>

export default function ComparePage({
  profile,
  comparison,
  recommendations,
  navigate,
  toggleCompare,
  chooseTarget,
}: Props) {
  return (
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
        <div className="table-scroll" role="region" aria-label="Таблица сравнения программ" tabIndex={0}>
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
                  (u: University) => `${recommendations.find((r) => r.university.id === u.id)!.matches} из 5`,
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
      <DemoDataNote />
    </>
  )
}
