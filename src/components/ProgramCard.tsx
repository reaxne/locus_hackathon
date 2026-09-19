import { Check, MapPin, Plus, CircleCheck, CircleHelp } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import type { Recommendation } from '../types'
import { money } from '../data/universities'
import { External, Fact } from './Shared'
import SaveOption from './SaveOption'
import { Link } from '../lib/router'
import { ru } from '../lib/labels'

export default function ProgramCard({ match, admission }: { match: Recommendation; admission: Admission }) {
  const { program, university, group, reasons, caveats } = match
  const selected = admission.state.comparison.includes(program.id)
  return (
    <article className={`program-card panel ${selected ? 'selected' : ''}`} data-program={program.id}>
      <div className="card-top">
        <span className={`university-monogram ${university.id}`}>{university.shortName}</span>
        <span
          className={`pill ${group === 'Over budget' ? 'warning' : group === 'Needs verification' ? 'subtle' : ''}`}
        >
          {ru(group)}
        </span>
      </div>
      <p className="university-name">{university.name}</p>
      <h3>
        <Link href={`/universities/${program.id}`}>{program.title.value}</Link>
      </h3>
      <div className="program-meta">
        <span>
          <MapPin size={13} />
          {ru(university.city)}
        </span>
        <span>Бакалавриат</span>
        {program.code && <span>{program.code}</span>}
      </div>
      <div className="tuition-block">
        <span className="small-label">СТОИМОСТЬ ЗА ГОД</span>
        <Fact fact={program.tuition} profile={admission.state.profile!} format={money} />
      </div>
      {/* Reasons and caveats stay one click away: the grid shows many programs at once. */}
      <details className="program-details">
        <summary>
          Почему подходит и что уточнить <span aria-hidden="true">↗</span>
        </summary>
        <div className="program-detail-body">
          <p className="program-description">{program.description}</p>
          <div className="reason-section">
            <strong>
              <CircleCheck size={16} />
              Почему стоит рассмотреть
            </strong>
            <ul>
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <div className="caveat-section">
            <strong>
              <CircleHelp size={16} />
              Что нужно уточнить
            </strong>
            <ul>
              {caveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </div>
          <External href={program.title.sourceUrl}>Источник программы</External>
          <small>
            {program.title.verifiedAt
              ? `Программа проверена ${program.title.verifiedAt}`
              : 'Дата проверки не указана'}
          </small>
        </div>
      </details>
      <div className="card-bottom">
        <Link className="text-button" href={`/universities/${program.id}`}>
          Подробнее о программе
        </Link>
        <SaveOption admission={admission} programId={program.id} />
        <button
          className={`button ${selected ? 'primary' : 'secondary'} compare-toggle`}
          aria-pressed={selected}
          aria-label={`${selected ? 'Убрать из сравнения' : 'Сравнить'} ${university.shortName} ${program.title.value}`}
          onClick={() => admission.toggleCompare(program.id)}
        >
          {selected ? <Check size={16} /> : <Plus size={16} />}
          {selected ? 'Добавлено к сравнению' : 'Добавить к сравнению'}
        </button>
      </div>
    </article>
  )
}
