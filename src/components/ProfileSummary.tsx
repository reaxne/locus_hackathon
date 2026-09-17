import { Pencil } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { money } from '../data/universities'
import { questionIds, examLabel, statusLabels } from '../lib/profile'
import { examNames } from '../types'
import { useRouter } from '../lib/router'

export default function ProfileSummary({
  admission,
  compact = false,
}: {
  admission: Admission
  compact?: boolean
}) {
  const p = admission.state.profile!
  const { go } = useRouter()
  const rows: { id: string; label: string; value: string }[] = [
    { id: 'grade', label: 'School grade', value: `Grade ${p.grade}` },
    { id: 'entryYear', label: 'University entry', value: String(p.entryYear) },
    { id: 'interest', label: 'Primary interest', value: p.interest },
    { id: 'city', label: 'Preferred city', value: p.city },
    {
      id: 'mustStay',
      label: 'City constraint',
      value: p.mustStay ? 'Must stay in this city' : 'Flexible location',
    },
    { id: 'budget', label: 'Annual tuition budget', value: p.budget === null ? 'Unknown' : money(p.budget) },
    {
      id: 'funding',
      label: 'Funding preference',
      value: { self: 'Self-funded', grant: 'Seeking a grant', either: 'Open to either option' }[p.funding],
    },
    {
      id: 'category',
      label: 'Applicant category',
      value: {
        domestic: 'Kazakhstan citizen',
        international: 'International applicant',
        unknown: 'Not sure yet',
      }[p.category],
    },
    {
      id: 'academicStrengths',
      label: 'Academic strengths',
      value: p.academicStrengths.join(', ') || 'Still exploring',
    },
    {
      id: 'extracurricularInterests',
      label: 'Extracurricular interests',
      value: p.extracurricularInterests.join(', ') || 'Open to suggestions',
    },
    ...examNames.map((exam) => ({
      id: exam,
      label: examLabel(exam),
      value: `${statusLabels[p.exams[exam].status]}${p.exams[exam].score === null ? '' : ` · ${p.exams[exam].score}`}`,
    })),
  ]
  return (
    <dl className={`profile-summary ${compact ? 'compact' : ''}`}>
      {rows.map((row) => (
        <div key={row.id}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
          <button
            className="icon-button"
            aria-label={`Edit ${row.label}`}
            onClick={() => {
              admission.setDraft(p)
              admission.setDraftStep(questionIds.findIndex((id) => id === row.id))
              go('/diagnosis')
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
      ))}
    </dl>
  )
}
