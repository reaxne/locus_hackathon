import { LoaderCircle } from 'lucide-react'

const stages: Record<string, [string, string]> = {
  session: ['Проверяем вход', 'Подтверждаем сессию на сервере.'],
  saving: ['Подготавливаем профиль', 'Дожидаемся сохранения последних ответов.'],
  preparing: ['Подбираем данные', 'Сопоставляем анкету с требованиями программ.'],
  prepared: ['Данные подготовлены', 'Проверяем возможность использовать предыдущий результат.'],
  matched: ['Программы найдены', 'Составляем шаги по проверенным требованиям и вашим целям.'],
  model: ['ИИ изучает ваш профиль', 'Готовим персональные пояснения. Это может занять до минуты.'],
  model_failed: ['Модель недоступна', 'Проверяем возможность продолжить с другой бесплатной моделью.'],
  context_ready: ['Запрос подготовлен', 'Передаём модели только данные, необходимые для этой задачи.'],
  validating: ['Проверяем ответ', 'Проверяем формат и соответствие шагов вашему плану.'],
  validated: ['Завершаем обработку', 'Подготавливаем проверенный результат к показу.'],
  cache_hit: ['Открываем готовый результат', 'Для этих исходных данных уже есть актуальный ответ.'],
  completed: ['Открываем результат', 'Обработка завершена.'],
}
export default function LoadingState({
  stage = 'preparing',
  onCancel,
  full = false,
}: {
  stage?: string
  onCancel?: () => void
  full?: boolean
}) {
  const [title, text] = stages[stage] ?? stages.preparing
  return (
    <section
      className={`loading-state panel ${full ? 'loading-full' : ''}`}
      aria-busy="true"
      aria-label="Обработка запроса"
    >
      <LoaderCircle className="loading-spinner" size={36} aria-hidden="true" />
      <div role="status" aria-live="polite">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {onCancel && (
        <button type="button" className="button secondary" onClick={onCancel}>
          Прервать
        </button>
      )}
    </section>
  )
}
