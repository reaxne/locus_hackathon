import type { ServerMatch } from './recommendations'

export const searchCategories = [
  {
    id: 'software',
    label: 'Программирование и разработка',
    pattern: /software|программ|бағдарлам|computer science|информат/i,
  },
  { id: 'ai', label: 'ИИ и анализ данных', pattern: /artificial|intelligence|data|данн|искусствен|жасанды/i },
  { id: 'security', label: 'Кибербезопасность', pattern: /security|безопас|қауіпсіз/i },
  {
    id: 'robotics',
    label: 'Робототехника и автоматизация',
    pattern: /robot|робот|automat|автомат|мехатрон/i,
  },
  { id: 'networks', label: 'Сети и телекоммуникации', pattern: /network|телеком|сети|желіл|communication/i },
  {
    id: 'business',
    label: 'Бизнес и цифровая экономика',
    pattern: /business|бизнес|эконом|менедж|management|finance|финанс/i,
  },
  { id: 'design', label: 'Дизайн и цифровые медиа', pattern: /design|дизайн|media|медиа|график/i },
  { id: 'engineering', label: 'Инженерия и технологии', pattern: /engineer|инженер|технолог|электр|energy/i },
]

export function searchMatches(match: ServerMatch, query: string, category: string) {
  const text = `${match.program.title.value ?? ''} ${match.program.description} ${match.university.name} ${match.university.city}`
  const tokens = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  return (
    tokens.every((token) => text.toLocaleLowerCase().includes(token)) &&
    (category === 'all' || !!searchCategories.find((item) => item.id === category)?.pattern.test(text))
  )
}
