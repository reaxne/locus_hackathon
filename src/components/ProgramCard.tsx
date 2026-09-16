import { ArrowUpRight, Check, Plus, MapPin } from 'lucide-react'
import { money, programName, type Profile, type Recommendation } from '../model'

export default function ProgramCard({
  item,
  profile,
  selected,
  toggle,
  details,
}: {
  item: Recommendation
  profile: Profile
  selected: boolean
  toggle: () => void
  details: () => void
}) {
  const u = item.university
  return (
    <article className="program-card">
      <div className="program-top">
        <span className={`uni-monogram ${u.color}`}>{u.short}</span>
        <button
          className={`compare-toggle ${selected ? 'selected' : ''}`}
          onClick={toggle}
          aria-label={`${selected ? 'Убрать из сравнения' : 'Сравнить'} ${u.name}`}
          aria-pressed={selected}
        >
          {selected ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </div>
      <div className="location">
        <MapPin size={13} />
        {u.city}, {u.country}
      </div>
      <h3>
        <button onClick={details}>{u.name}</button>
      </h3>
      <p className="program-name">
        {programName(u.fields.includes(profile.interest) ? profile.interest : u.fields[0])}
      </p>
      <div className="match">
        <span className="match-dots" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={i < item.matches ? 'filled' : ''} />
          ))}
        </span>
        {item.matches} из 5 критериев
      </div>
      <div className="program-facts">
        <div>
          <span>Обучение в год</span>
          <strong>{money(u.fee)}</strong>
        </div>
        <div>
          <span>Английский</span>
          <strong>IELTS {u.ielts.toFixed(1)}</strong>
        </div>
      </div>
      <div className="program-reason">
        <Check size={14} />
        <span>{item.reasons[0] ?? 'Вариант для сравнения'}</span>
      </div>
      <button className="card-link" onClick={details}>
        Почему подходит
        <ArrowUpRight size={16} />
      </button>
    </article>
  )
}
