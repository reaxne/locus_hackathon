import { Bookmark, Trash2 } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { listLabels, type ListLabel } from '../types'

export default function SaveOption({ admission, programId }: { admission: Admission; programId: string }) {
  const saved = admission.state.savedOptions.find((option) => option.programId === programId)
  return (
    <div className="save-option">
      <label>
        <span>
          <Bookmark size={13} />
          {saved ? 'Your personal label' : 'Save to my list'}
        </span>
        <select
          aria-label="Personal university label"
          value={saved?.label ?? ''}
          onChange={(e) => admission.saveOption(programId, e.target.value as ListLabel)}
        >
          <option value="" disabled>
            Choose a label
          </option>
          {listLabels.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
      </label>
      {saved && (
        <button
          className="icon-button"
          aria-label="Remove from my university list"
          title="Remove from my university list"
          onClick={() => admission.removeOption(programId)}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
