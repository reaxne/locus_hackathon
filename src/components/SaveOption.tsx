import { Bookmark, Trash2 } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { listLabels, type ListLabel } from '../types'
import { ru } from '../lib/labels'

export default function SaveOption({ admission, programId }: { admission: Admission; programId: string }) {
  const saved = admission.state.savedOptions.find((option) => option.programId === programId)
  if (!saved)
    return (
      <button className="button secondary" onClick={() => admission.saveOption(programId, 'Priority')}>
        <Bookmark size={15} />
        Добавить в мои университеты
      </button>
    )
  return (
    <div className="save-option">
      <label>
        <span>
          <Bookmark size={13} />
          Ваша метка
        </span>
        <select
          aria-label="Метка университета"
          value={saved?.label ?? ''}
          onChange={(e) => admission.saveOption(programId, e.target.value as ListLabel)}
        >
          <option value="" disabled>
            Выберите метку
          </option>
          {listLabels.map((label) => (
            <option key={label} value={label}>
              {ru(label)}
            </option>
          ))}
        </select>
      </label>
      {saved && (
        <button
          className="icon-button"
          aria-label="Удалить из моих университетов"
          title="Удалить из моих университетов"
          onClick={() => admission.removeOption(programId)}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
