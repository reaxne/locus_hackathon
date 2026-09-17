import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Save, ShieldCheck } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import {
  academicStrengths,
  activityCategories,
  interests,
  type ApplicantProfile,
  type ExamName,
  type ExamStatus,
} from '../types'
import { currentYear } from '../data/universities'
import { questionIds, examLabel, statusLabels } from '../lib/profile'
import { validateProfile } from '../lib/persistence'
import { Link, useRouter } from '../lib/router'

export default function DiagnosisPage({ admission }: { admission: Admission }) {
  const { state, setDraft, setDraftStep, answerQuestion } = admission
  const { draft, draftStep: step } = state
  const question = questionIds[step]
  const { go } = useRouter()
  const [error, setError] = useState('')
  const [numberInput, setNumberInput] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    setError('')
    setNumberInput(question === 'budget' ? String(draft.budget ?? '') : String(draft.entryYear))
    heading.current?.focus()
  }, [step])
  const patch = (value: Partial<ApplicantProfile>) => setDraft({ ...draft, ...value })
  function numberPatch(raw: string): Partial<ApplicantProfile> {
    return question === 'budget' ? { budget: raw === '' ? null : Number(raw) } : { entryYear: Number(raw) }
  }
  function changeNumber(raw: string) {
    setNumberInput(raw)
    const value = numberPatch(raw)
    const updated = { ...draft, ...value }
    // Keep the last valid draft when an input is temporarily blank or invalid.
    if (validateProfile(updated) && updated.entryYear >= currentYear && updated.entryYear <= currentYear + 8)
      patch(value)
  }
  function answer(value: Partial<ApplicantProfile>) {
    if (question === 'budget' || question === 'entryYear') value = { ...value, ...numberPatch(numberInput) }
    const updated = { ...draft, ...value }
    if (!validateProfile(updated) || updated.entryYear < currentYear || updated.entryYear > currentYear + 8) {
      setError(
        `Check your answer. Use an entry year from ${currentYear} to ${currentYear + 8} and a non-negative budget.`,
      )
      return
    }
    answerQuestion(value, question, state.profile ? step : step + 1)
    if (state.profile) go('/profile')
    else if (step === questionIds.length - 1) go('/universities')
  }
  const exam = ['SAT', 'IELTS', 'NUET', 'UNT', 'AET'].includes(question) ? (question as ExamName) : null
  const prompts: Record<string, [string, string]> = {
    grade: ['What grade are you in?', 'Your school stage helps us suggest a realistic pace.'],
    entryYear: [
      'When do you plan to start university?',
      'Choose your intended entry year. You can change it later.',
    ],
    interest: [
      'Which field interests you most?',
      'Choose a starting direction. You do not need to have everything decided.',
    ],
    city: [
      'Where would you like to study?',
      'Our initial collection covers Astana. We will be clear about gaps in coverage.',
    ],
    mustStay: [
      'Is staying in this city essential?',
      'A strict preference excludes programs in other cities.',
    ],
    budget: [
      'What is your annual tuition budget?',
      'Enter an amount in KZT. Living costs are separate; unknown is a valid answer.',
    ],
    funding: [
      'How would you like to fund your studies?',
      'A funding preference is a planning input, not a scholarship prediction.',
    ],
    category: [
      'Which applicant category applies to you?',
      'Official rules can differ for Kazakhstan citizens and international applicants.',
    ],
    academicStrengths: [
      'What are your academic strengths?',
      'Choose any that describe you, or continue without selecting. These are self-reported.',
    ],
    extracurricularInterests: [
      'What would you like to try outside class?',
      'Select any activities that interest you. We will use them to suggest a portfolio plan.',
    ],
  }
  const [title, description] = exam
    ? [
        `What is your ${examLabel(exam)} status?`,
        'This does not mean the exam is required. Record scores and personal targets later in Exam Goals.',
      ]
    : prompts[question]
  const choices = (
    options: { label: string; value: Partial<ApplicantProfile>; selected?: boolean; hint?: string }[],
  ) => (
    <div className="question-choices">
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          className={`answer-choice ${state.answeredQuestions.includes(question) && option.selected ? 'selected' : ''}`}
          onClick={() => answer(option.value)}
        >
          <span>
            <strong>{option.label}</strong>
            {option.hint && <small>{option.hint}</small>}
          </span>
          <ArrowRight size={17} />
        </button>
      ))}
    </div>
  )
  const multiple = question === 'academicStrengths' || question === 'extracurricularInterests'
  return (
    <section className="diagnosis-flow">
      <div className="diagnosis-intro">
        <div className="eyebrow">YOUR PERSONAL STARTING POINT</div>
        <p>One question at a time. A plan built around your answers.</p>
      </div>
      <div className="question-layout">
        <div className="panel question-panel">
          <div className="question-progress">
            <span>
              Question {step + 1} of {questionIds.length}
            </span>
            <span>
              <Save size={13} />
              {admission.storageError ? 'Session only' : 'Answers saved automatically'}
            </span>
          </div>
          <progress value={step + 1} max={questionIds.length} aria-label="Diagnosis progress" />
          <div className="question-body" key={question}>
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <p>{description}</p>
            {question === 'grade' &&
              choices(
                [9, 10, 11, 12].map((grade) => ({
                  label: `Grade ${grade}`,
                  value: { grade: grade as ApplicantProfile['grade'] },
                  selected: draft.grade === grade,
                })),
              )}
            {question === 'interest' &&
              choices(
                interests.map((interest) => ({
                  label: interest,
                  value: { interest },
                  selected: draft.interest === interest,
                })),
              )}
            {question === 'city' &&
              choices(
                ['Any city', 'Astana', 'Almaty', 'Karaganda', 'Shymkent', 'Other city'].map((city) => ({
                  label: city,
                  value: { city, mustStay: city === 'Any city' ? false : draft.mustStay },
                  selected: draft.city === city,
                })),
              )}
            {question === 'mustStay' &&
              choices(
                draft.city === 'Any city'
                  ? [{ label: 'I am open to different cities', value: { mustStay: false }, selected: true }]
                  : [
                      {
                        label: 'Flexible preference',
                        hint: 'Include other cities as well',
                        value: { mustStay: false },
                        selected: !draft.mustStay,
                      },
                      {
                        label: 'Must stay in this city',
                        hint: `Only include programs in ${draft.city}`,
                        value: { mustStay: true },
                        selected: draft.mustStay,
                      },
                    ],
              )}
            {question === 'funding' &&
              choices([
                {
                  label: 'Open to either option',
                  value: { funding: 'either' },
                  selected: draft.funding === 'either',
                },
                {
                  label: 'Self-funded tuition',
                  value: { funding: 'self' },
                  selected: draft.funding === 'self',
                },
                {
                  label: 'Seeking a grant',
                  value: { funding: 'grant' },
                  selected: draft.funding === 'grant',
                },
              ])}
            {question === 'category' &&
              choices([
                {
                  label: 'Kazakhstan citizen',
                  value: { category: 'domestic' },
                  selected: draft.category === 'domestic',
                },
                {
                  label: 'International applicant',
                  value: { category: 'international' },
                  selected: draft.category === 'international',
                },
                {
                  label: 'Not sure yet',
                  value: { category: 'unknown' },
                  selected: draft.category === 'unknown',
                },
              ])}
            {exam &&
              choices(
                (['unknown', 'planned', 'completed', 'not-planned'] as ExamStatus[]).map((status) => ({
                  label: statusLabels[status],
                  value: {
                    exams: {
                      ...draft.exams,
                      [exam]: { status, score: status === 'completed' ? draft.exams[exam].score : null },
                    },
                    ...(exam !== 'AET' && status === 'not-planned'
                      ? { examGoals: { ...draft.examGoals, [exam]: { targetScore: null, targetDate: null } } }
                      : {}),
                  },
                  selected: draft.exams[exam].status === status,
                })),
              )}
            {(question === 'entryYear' || question === 'budget' || multiple) && (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault()
                  answer({})
                }}
              >
                {question === 'entryYear' && (
                  <label>
                    Intended entry year
                    <input
                      autoFocus
                      type="number"
                      min={currentYear}
                      max={currentYear + 8}
                      value={numberInput}
                      onChange={(e) => changeNumber(e.target.value)}
                    />
                  </label>
                )}
                {question === 'budget' && (
                  <label>
                    Annual tuition budget (KZT)
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      max="100000000"
                      placeholder="Unknown"
                      value={numberInput}
                      onChange={(e) => changeNumber(e.target.value)}
                    />
                    <small>0 means no self-funded tuition. Leave blank if unknown.</small>
                  </label>
                )}
                {question === 'academicStrengths' && (
                  <fieldset className="multi-choices">
                    <legend className="sr-only">Academic strengths</legend>
                    {academicStrengths.map((strength) => (
                      <label
                        key={strength}
                        className={draft.academicStrengths.includes(strength) ? 'selected' : ''}
                      >
                        <input
                          type="checkbox"
                          checked={draft.academicStrengths.includes(strength)}
                          onChange={(e) =>
                            patch({
                              academicStrengths: e.target.checked
                                ? [...draft.academicStrengths, strength]
                                : draft.academicStrengths.filter((s) => s !== strength),
                            })
                          }
                        />
                        {strength}
                      </label>
                    ))}
                  </fieldset>
                )}
                {question === 'extracurricularInterests' && (
                  <fieldset className="multi-choices">
                    <legend className="sr-only">Extracurricular interests</legend>
                    {activityCategories.map((category) => (
                      <label
                        key={category}
                        className={draft.extracurricularInterests.includes(category) ? 'selected' : ''}
                      >
                        <input
                          type="checkbox"
                          checked={draft.extracurricularInterests.includes(category)}
                          onChange={(e) =>
                            patch({
                              extracurricularInterests: e.target.checked
                                ? [...draft.extracurricularInterests, category]
                                : draft.extracurricularInterests.filter((c) => c !== category),
                            })
                          }
                        />
                        {category}
                      </label>
                    ))}
                  </fieldset>
                )}
                <button className="button primary question-continue" type="submit">
                  {state.profile
                    ? 'Save answer'
                    : step === questionIds.length - 1
                      ? 'Show my universities'
                      : 'Continue'}
                  <ArrowRight size={17} />
                </button>
              </form>
            )}
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="question-footer">
            <button
              className="text-button"
              onClick={() => (step > 0 ? setDraftStep(step - 1) : go(state.profile ? '/profile' : '/'))}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {state.profile && <Link href="/profile">Back to summary</Link>}
            <span>{state.answeredQuestions.length} answers recorded</span>
          </div>
        </div>
        <aside className="question-aside">
          <ShieldCheck size={25} />
          <h2>Your answers stay yours.</h2>
          <p>Your profile is saved in this browser. No password or account is needed to explore.</p>
          <div className="aside-divider" />
          <span className="small-label">WHAT COMES NEXT</span>
          <ul className="plain-list">
            <li>A shortlist with reasons</li>
            <li>An editable profile summary</li>
            <li>Your own goals and next steps</li>
          </ul>
          {state.answeredQuestions.length > 0 && (
            <span className="saved-indicator">
              <Check size={15} />
              You can leave and come back.
            </span>
          )}
        </aside>
      </div>
    </section>
  )
}
