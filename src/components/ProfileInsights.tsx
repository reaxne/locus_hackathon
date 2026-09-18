import { useEffect, useRef, useState } from 'react'
import type { Admission } from '../hooks/useAdmission'
import type { ProfileAnalysisResponse } from '../lib/api'

export default function ProfileInsights({ admission }: { admission: Admission }) {
  const [result, setResult] = useState<ProfileAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const profileKey = JSON.stringify([admission.state.demoAccount?.id, admission.state.profile])
  useEffect(() => {
    generation.current++
    setResult(null)
    setError('')
    setLoading(false)
    return () => {
      generation.current++
    }
  }, [profileKey])
  async function analyze() {
    const current = ++generation.current
    setLoading(true)
    setError('')
    try {
      const response = await admission.analyzeProfile()
      if (current === generation.current) setResult(response)
    } catch (cause) {
      if (current === generation.current)
        setError(cause instanceof Error ? cause.message : 'Не удалось проанализировать профиль.')
    } finally {
      if (current === generation.current) setLoading(false)
    }
  }
  return (
    <section className="panel summary-panel" aria-label="Анализ профиля с ИИ">
      <h2>Сильные стороны и зоны развития</h2>
      <p>
        ИИ объяснит выводы по вашим ответам и предложит конкретные действия. Недостающие данные не считаются
        слабостью.
      </p>
      <button
        className="button secondary"
        disabled={loading || admission.saveStatus !== 'saved'}
        onClick={() => void analyze()}
      >
        {loading ? 'Анализируем профиль…' : 'Проанализировать профиль с ИИ'}
      </button>
      {error && <p role="alert">{error}</p>}
      {result?.ai.status === 'unavailable' && (
        <p role="status">
          Бесплатные модели сейчас недоступны. Повторите запрос позже. Выводы о профиле не были сгенерированы.
        </p>
      )}
      {result?.ai.status === 'generated' && result.analysis && (
        <>
          {(
            [
              ['Сильные стороны', result.analysis.strengths],
              ['Зоны развития', result.analysis.weaknesses],
            ] as const
          ).map(([title, entries]) => (
            <div key={title}>
              <h3>{title}</h3>
              {!entries.length && <p>Пока недостаточно данных для обоснованного вывода.</p>}
              {entries.map((entry, index) => (
                <article key={`${entry.title}-${index}`}>
                  <h4>{entry.title}</h4>
                  <p>
                    <strong>Основание:</strong> {entry.evidence}
                  </p>
                  <p>{entry.why}</p>
                  <ol>
                    {entry.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          ))}
          {result.analysis.unknowns.length > 0 && (
            <div>
              <h3>Что стоит уточнить</h3>
              <ul>
                {result.analysis.unknowns.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="muted">
            Советы ИИ основаны на вашей анкете и не являются оценкой вероятности поступления.
          </p>
        </>
      )}
    </section>
  )
}
