import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
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
import { questionIds, examLabel, statusLabels, examLimits, validScore } from '../lib/profile'
import { validateProfile } from '../lib/persistence'
import { ru } from '../lib/labels'
import { Link, useRouter } from '../lib/router'

const prompts: Record<string, [string, string]> = {
  grade: ['В каком вы классе?', 'Подберём подходящий темп подготовки.'],
  entryYear: ['Когда планируете поступать?', 'Укажите год начала обучения. Его можно изменить позже.'],
  interest: ['Какое направление вам интересно?', 'Это отправная точка, а не окончательный выбор профессии.'],
  city: [
    'Где вы хотите учиться?',
    'В текущей подборке — университеты Астаны. Другие города можно указать как пожелание.',
  ],
  mustStay: [
    'Обязательно остаться в этом городе?',
    'Жёсткое ограничение исключит программы в других городах.',
  ],
  studyLanguage: [
    'На каком языке хотите учиться?',
    'Учтём язык при подборе. Если язык программы не подтверждён, предложим его уточнить.',
  ],
  academicPerformance: [
    'Как вы оцениваете свою успеваемость?',
    'Необязательный вопрос. Ответ поможет выбрать шаги подготовки, но не определяет шансы поступления.',
  ],
  budget: [
    'Какой бюджет на обучение в год?',
    'В тенге, без расходов на проживание. Можно пока не указывать.',
  ],
  funding: [
    'Как планируете оплачивать обучение?',
    'Пожелание по финансированию не означает, что грант гарантирован.',
  ],
  category: [
    'Какая категория поступления вам подходит?',
    'Для граждан Казахстана и иностранных абитуриентов могут действовать разные правила.',
  ],
  academicStrengths: [
    'Какие предметы и навыки вам даются?',
    'Выберите несколько или продолжите без ответа. Это ваша собственная оценка.',
  ],
  extracurricularInterests: [
    'Что интересно вне уроков?',
    'Необязательно. На основе интересов предложим идеи для портфолио.',
  ],
  constraints: [
    'Что ещё важно учесть?',
    'Необязательно: переезд, доступная среда, время на подготовку или другие условия. Не указывайте чувствительные личные данные.',
  ],
}
export default function DiagnosisPage({ admission }: { admission: Admission }) {
  const { state, setDraft, setDraftStep, answerQuestion } = admission
  const { draft, draftStep: step } = state
  const question = questionIds[step]
  const { go } = useRouter()
  const [error, setError] = useState('')
  const [numberInput, setNumberInput] = useState('')
  const [scoreInput, setScoreInput] = useState('')
  const [examStatus, setExamStatus] = useState<ExamStatus | ''>('')
  const heading = useRef<HTMLHeadingElement>(null)
  const exam = ['SAT', 'IELTS', 'NUET', 'UNT', 'AET'].includes(question) ? (question as ExamName) : null
  useEffect(() => {
    setError('')
    setNumberInput(question === 'budget' ? String(draft.budget ?? '') : String(draft.entryYear))
    if (exam) {
      setExamStatus(draft.exams[exam].status)
      setScoreInput(String(draft.exams[exam].score ?? ''))
    }
    heading.current?.focus()
  }, [step])
  const patch = (value: Partial<ApplicantProfile>) => setDraft({ ...draft, ...value })
  const numberPatch = (raw: string): Partial<ApplicantProfile> =>
    question === 'budget' ? { budget: raw === '' ? null : Number(raw) } : { entryYear: Number(raw) }
  function changeNumber(raw: string) {
    setNumberInput(raw)
    const value = numberPatch(raw)
    const updated = { ...draft, ...value }
    if (validateProfile(updated) && updated.entryYear >= currentYear && updated.entryYear <= currentYear + 8)
      patch(value)
  }
  function answer(value: Partial<ApplicantProfile>) {
    if (question === 'budget' || question === 'entryYear') value = { ...value, ...numberPatch(numberInput) }
    if (exam && examStatus === 'completed') {
      const score = scoreInput === '' || exam === 'AET' ? null : Number(scoreInput)
      if (!validScore(exam, score)) {
        setError(
          `Проверьте результат ${examLabel(exam)}: допустимо от ${examLimits[exam][0]} до ${examLimits[exam][1]}. Неизвестный результат можно оставить пустым.`,
        )
        return
      }
      value = { ...value, exams: { ...draft.exams, [exam]: { status: 'completed', score } } }
    }
    const updated = { ...draft, ...value }
    if (!validateProfile(updated) || updated.entryYear < currentYear || updated.entryYear > currentYear + 8) {
      setError(
        `Проверьте ответ: год от ${currentYear} до ${currentYear + 8}, бюджет от 0 до 100 000 000 тенге.`,
      )
      return
    }
    answerQuestion(value, question, state.profile ? step : step + 1)
    if (state.profile) go('/profile')
    else if (step === questionIds.length - 1) go('/analysis')
  }
  const choices = (items: { label: string; value: Partial<ApplicantProfile>; selected?: boolean }[]) => (
    <div className="question-choices">
      {items.map((item) => (
        <button
          type="button"
          className={`answer-choice ${state.answeredQuestions.includes(question) && item.selected ? 'selected' : ''}`}
          key={item.label}
          onClick={() => answer(item.value)}
        >
          <strong>{item.label}</strong>
          <ArrowRight size={18} />
        </button>
      ))}
    </div>
  )
  const title = exam ? `Какой у вас статус ${examLabel(exam)}?` : prompts[question][0]
  const description = exam
    ? 'Не каждый экзамен нужен каждой программе. Если ещё не решили, выберите «Не знаю». Результат необязателен.'
    : prompts[question][1]
  const multiple = question === 'academicStrengths' || question === 'extracurricularInterests'
  const continueLabel = state.profile
    ? 'Сохранить ответ'
    : step === questionIds.length - 1
      ? 'Посмотреть диагностику'
      : 'Продолжить'
  return (
    <section className="diagnosis-flow">
      <div className="diagnosis-intro">
        <span className="eyebrow">АНКЕТА · ВАША ОТПРАВНАЯ ТОЧКА</span>
        <p>Один вопрос за раз. Ответы можно изменить позже.</p>
      </div>
      <div className="question-layout">
        <div className="panel question-panel">
          <div className="question-progress">
            <span>
              Вопрос {step + 1} из {questionIds.length}
            </span>
            <span>
              <Save size={16} />
              {admission.saveStatus === 'saved'
                ? 'Сохранено'
                : admission.saveStatus === 'saving'
                  ? 'Сохраняем…'
                  : 'Не сохранено'}
            </span>
          </div>
          <progress value={step + 1} max={questionIds.length} aria-label="Прогресс анкеты" />
          <div className="question-body" key={question}>
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <p>{description}</p>
            {question === 'grade' &&
              choices(
                [9, 10, 11, 12].map((grade) => ({
                  label: `${grade} класс`,
                  value: { grade: grade as ApplicantProfile['grade'] },
                  selected: draft.grade === grade,
                })),
              )}
            {question === 'interest' &&
              choices(
                interests.map((interest) => ({
                  label: ru(interest),
                  value: { interest },
                  selected: draft.interest === interest,
                })),
              )}
            {question === 'city' &&
              choices(
                ['Any city', 'Astana', 'Almaty', 'Karaganda', 'Shymkent', 'Other city'].map((city) => ({
                  label: ru(city),
                  value: { city, mustStay: city === 'Any city' ? false : draft.mustStay },
                  selected: draft.city === city,
                })),
              )}
            {question === 'mustStay' &&
              choices(
                draft.city === 'Any city'
                  ? [{ label: 'Рассматриваю разные города', value: { mustStay: false } }]
                  : [
                      {
                        label: 'Готовы рассматривать другие города',
                        value: { mustStay: false },
                        selected: !draft.mustStay,
                      },
                      {
                        label: 'Только выбранный город',
                        value: { mustStay: true },
                        selected: draft.mustStay,
                      },
                    ],
              )}
            {question === 'studyLanguage' &&
              choices(
                (
                  [
                    ['any', 'Любой язык'],
                    ['ru', 'Русский'],
                    ['kk', 'Казахский'],
                    ['en', 'Английский'],
                  ] as const
                ).map(([studyLanguage, label]) => ({
                  label,
                  value: { studyLanguage },
                  selected: draft.studyLanguage === studyLanguage,
                })),
              )}
            {question === 'academicPerformance' &&
              choices(
                (
                  [
                    ['excellent', 'В основном отличные оценки'],
                    ['good', 'В основном хорошие оценки'],
                    ['needs-support', 'Есть предметы, которые хочу подтянуть'],
                    ['unknown', 'Пропустить этот вопрос'],
                  ] as const
                ).map(([academicPerformance, label]) => ({
                  label,
                  value: { academicPerformance },
                  selected: draft.academicPerformance === academicPerformance,
                })),
              )}
            {question === 'funding' &&
              choices([
                { label: 'Рассматриваю оба варианта', value: { funding: 'either' } },
                { label: 'Платное обучение', value: { funding: 'self' } },
                { label: 'Хочу получить грант', value: { funding: 'grant' } },
              ])}
            {question === 'category' &&
              choices([
                { label: 'Гражданин Казахстана', value: { category: 'domestic' } },
                { label: 'Иностранный абитуриент', value: { category: 'international' } },
                { label: 'Пока не знаю', value: { category: 'unknown' } },
              ])}
            {exam && (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault()
                  answer({})
                }}
              >
                <div className="question-choices">
                  {(['unknown', 'planned', 'completed', 'not-planned'] as ExamStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={examStatus === status}
                      className={`answer-choice`}
                      onClick={() => {
                        setExamStatus(status)
                        const value: Partial<ApplicantProfile> = {
                          exams: {
                            ...draft.exams,
                            [exam]: {
                              status,
                              score: status === 'completed' ? draft.exams[exam].score : null,
                            },
                          },
                          ...(exam !== 'AET' && status === 'not-planned'
                            ? {
                                examGoals: {
                                  ...draft.examGoals,
                                  [exam]: { targetScore: null, targetDate: null },
                                },
                              }
                            : {}),
                        }
                        patch(value)
                        // Completed results get an optional score field; other statuses continue with one click.
                        if (status !== 'completed') {
                          answerQuestion(value, question, state.profile ? step : step + 1)
                          if (state.profile) go('/profile')
                          else if (step === questionIds.length - 1) go('/analysis')
                        }
                      }}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
                {examStatus === 'completed' && (
                  <>
                    <label>
                      Результат {examLabel(exam)} (необязательно)
                      {exam !== 'AET' ? (
                        <input
                          type="number"
                          min={examLimits[exam][0]}
                          max={examLimits[exam][1]}
                          step={examLimits[exam][2]}
                          placeholder="Пока неизвестен"
                          value={scoreInput}
                          onChange={(event) => {
                            setScoreInput(event.target.value)
                            const score = event.target.value === '' ? null : Number(event.target.value)
                            if (validScore(exam, score))
                              patch({ exams: { ...draft.exams, [exam]: { status: 'completed', score } } })
                          }}
                        />
                      ) : (
                        <p>
                          Сохраните официальный результат AET. Его модули нужно проверить с приёмной
                          комиссией.
                        </p>
                      )}
                    </label>
                    <button className="button primary question-continue" type="submit">
                      {continueLabel}
                      <ArrowRight size={18} />
                    </button>
                  </>
                )}
              </form>
            )}
            {(question === 'entryYear' ||
              question === 'budget' ||
              question === 'constraints' ||
              multiple) && (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault()
                  answer({})
                }}
              >
                {question === 'entryYear' && (
                  <label>
                    Год поступления
                    <input
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
                    Бюджет в год, тенге
                    <input
                      type="number"
                      min="0"
                      max="100000000"
                      placeholder="Пока неизвестен"
                      value={numberInput}
                      onChange={(e) => changeNumber(e.target.value)}
                    />
                    <small>
                      Оставьте пустым, если не решили. 0 означает отсутствие бюджета на платное обучение.
                    </small>
                  </label>
                )}
                {question === 'constraints' && (
                  <label>
                    Важные условия
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={draft.constraints}
                      onChange={(e) => patch({ constraints: e.target.value })}
                      placeholder="Можно оставить пустым"
                    />
                  </label>
                )}
                {multiple && (
                  <fieldset className="multi-choices">
                    <legend className="sr-only">{title}</legend>
                    {(question === 'academicStrengths' ? academicStrengths : activityCategories).map(
                      (value) => (
                        <label key={value}>
                          <input
                            type="checkbox"
                            checked={(draft[question] as readonly string[]).includes(value)}
                            onChange={(e) =>
                              patch({
                                [question]: e.target.checked
                                  ? [...draft[question], value]
                                  : draft[question].filter((item) => item !== value),
                              })
                            }
                          />
                          {ru(value)}
                        </label>
                      ),
                    )}
                  </fieldset>
                )}
                <button className="button primary question-continue" type="submit">
                  {continueLabel}
                  <ArrowRight size={18} />
                </button>
              </form>
            )}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
          </div>
          <div className="question-footer">
            <button
              className="text-button"
              onClick={() => (step > 0 ? setDraftStep(step - 1) : go(state.profile ? '/profile' : '/'))}
            >
              <ArrowLeft size={18} />
              Назад
            </button>
            {state.profile && <Link href="/profile">Вернуться в профиль</Link>}
            <span>Ответов сохранено: {state.answeredQuestions.length}</span>
          </div>
        </div>
        <aside className="question-aside">
          <span className="eyebrow">ПОСЛЕ АНКЕТЫ</span>
          <h2>Понятный следующий шаг.</h2>
          <ol>
            <li>Разберём вашу цель и сильные стороны</li>
            <li>Предложим программы с объяснениями</li>
            <li>Построим маршрут для выбранных вузов</li>
          </ol>
          <p>Правила подбора прозрачны. Это не прогноз поступления и не ИИ-анализ.</p>
          <p>Ответы автоматически сохраняются в аккаунте. Необязательные вопросы можно пропустить.</p>
        </aside>
      </div>
    </section>
  )
}
