import { useState, type FormEvent } from 'react'
import { ArrowRight, ArrowLeft, Check, Plus, Info, BookOpen } from 'lucide-react'
import { countries, interests, currentYear, validateProfile, type Profile } from '../model'
import Modal from './Modal'

export default function ProfileForm({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile
  onSave: (p: Profile) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState({ ...profile, countries: [...profile.countries] })
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((p) => ({ ...p, [key]: value }))
    setError('')
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 2 && !draft.countries.length) {
      setError('Выбери хотя бы одну страну.')
      return
    }
    if (step < 2) {
      setStep(step + 1)
      return
    }
    const clean = { ...draft, name: draft.name.trim() }
    if (!validateProfile(clean)) {
      setError('Проверь данные анкеты. Имя обязательно, средний балл — от 2 до 5, IELTS — от 0 до 9.')
      return
    }
    onSave(clean)
  }
  return (
    <Modal title="Давай найдём твой вектор" onClose={onClose}>
      <p className="modal-intro">Три коротких шага — и у тебя будет свой маршрут.</p>
      <div className="form-steps">
        {['О тебе', 'Подготовка', 'Твоя цель'].map((label, i) => (
          <div key={label} className={i <= step ? 'active' : ''}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            {label}
          </div>
        ))}
      </div>
      <form onSubmit={submit}>
        <div className="form-content" key={step}>
          {step === 0 && (
            <>
              <label>
                Как тебя зовут?
                <input
                  autoFocus
                  required
                  maxLength={40}
                  value={draft.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Твоё имя"
                  autoComplete="given-name"
                />
              </label>
              <label>
                Где ты сейчас учишься?
                <select value={draft.grade} onChange={(e) => update('grade', e.target.value)}>
                  {['9 класс', '10 класс', '11 класс', 'Выпускник'].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Что тебе интересно?</legend>
                <div className="choice-stack">
                  {interests.map((field, i) => (
                    <button
                      type="button"
                      className={`choice ${draft.interest === field ? 'selected' : ''}`}
                      key={field}
                      aria-pressed={draft.interest === field}
                      onClick={() => update('interest', field)}
                    >
                      <span>{['01', '02', '03'][i]}</span>
                      {field}
                      {draft.interest === field && <Check size={18} />}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          {step === 1 && (
            <>
              <div className="field-note">
                <BookOpen size={23} />
                <p>Не нужно быть идеальным кандидатом. Ответы помогут понять, к чему подготовиться.</p>
              </div>
              <label>
                Средний балл по 5-балльной шкале
                <input
                  autoFocus
                  type="number"
                  required
                  min={2}
                  max={5}
                  step={0.1}
                  value={draft.gpa}
                  onChange={(e) => update('gpa', e.target.valueAsNumber)}
                />
              </label>
              <label>
                Текущий результат IELTS
                <select value={draft.ielts} onChange={(e) => update('ielts', Number(e.target.value))}>
                  <option value={0}>Пока не сдавал(а)</option>
                  {Array.from({ length: 18 }, (_, i) => (i + 1) / 2).map((n) => (
                    <option key={n} value={n}>
                      {n.toFixed(1)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted small">
                В этой версии рассматриваем англоязычные программы бакалавриата. Другие экзамены можно
                добавить позже.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <fieldset>
                <legend>Где хочешь учиться?</legend>
                <div className="country-choices">
                  {countries.map((country) => (
                    <button
                      type="button"
                      className={`chip ${draft.countries.includes(country) ? 'selected' : ''}`}
                      key={country}
                      aria-pressed={draft.countries.includes(country)}
                      onClick={() =>
                        update(
                          'countries',
                          draft.countries.includes(country)
                            ? draft.countries.filter((c) => c !== country)
                            : [...draft.countries, country],
                        )
                      }
                    >
                      {country}
                      {draft.countries.includes(country) ? <Check size={15} /> : <Plus size={15} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Бюджет на обучение в год, €
                <input
                  type="number"
                  required
                  min={0}
                  max={100000}
                  step={100}
                  value={draft.budget}
                  onChange={(e) => update('budget', e.target.valueAsNumber)}
                />
              </label>
              <p className="muted small tight">Без проживания, перелётов и визы.</p>
              <label>
                Год поступления
                <select value={draft.year} onChange={(e) => update('year', Number(e.target.value))}>
                  {Array.from({ length: 6 }, (_, i) => currentYear + i).map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
              <div className="field-note">
                <Info size={20} />
                <p>Профиль сохранится только в этом браузере. Подбор построен на демонстрационных данных.</p>
              </div>
            </>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-footer">
          <span className="muted small">Шаг {step + 1} из 3</span>
          <div>
            {step > 0 && (
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setStep(step - 1)
                  setError('')
                }}
              >
                <ArrowLeft size={16} />
                Назад
              </button>
            )}
            <button className="button primary" type="submit">
              {step === 2 ? 'Построить маршрут' : 'Продолжить'}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
