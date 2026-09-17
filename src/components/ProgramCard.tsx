import { Check, MapPin, Plus, CircleCheck, CircleHelp } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import type { Recommendation } from '../types'
import { money } from '../data/universities'
import { External, Fact } from './Shared'
import SaveOption from './SaveOption'
import { Link } from '../lib/router'

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
          {group}
        </span>
      </div>
      <p className="university-name">{university.name}</p>
      <h3>
        <Link href={`/universities/${program.id}`}>{program.title.value}</Link>
      </h3>
      <div className="program-meta">
        <span>
          <MapPin size={13} />
          {university.city}
        </span>
        <span>Bachelor's</span>
        {program.code && <span>{program.code}</span>}
      </div>
      <p className="program-description">{program.description}</p>
      <div className="tuition-block">
        <span className="small-label">ANNUAL TUITION</span>
        <Fact fact={program.tuition} profile={admission.state.profile!} format={money} />
      </div>
      <div className="reason-section">
        <strong>
          <CircleCheck size={16} />
          Why consider it
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
          What to verify
        </strong>
        <ul>
          {caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </div>
      <div className="card-bottom">
        <Link className="text-button" href={`/universities/${program.id}`}>
          View program details
        </Link>
        <SaveOption admission={admission} programId={program.id} />
        <External href={program.title.sourceUrl}>Program source</External>
        <small>Program checked {program.title.verifiedAt}</small>
        <button
          className={`button ${selected ? 'primary' : 'secondary'} compare-toggle`}
          aria-pressed={selected}
          aria-label={`${selected ? 'Remove' : 'Compare'} ${university.shortName} ${program.title.value}`}
          onClick={() => admission.toggleCompare(program.id)}
        >
          {selected ? <Check size={16} /> : <Plus size={16} />}
          {selected ? 'Added to comparison' : 'Add to comparison'}
        </button>
      </div>
    </article>
  )
}
