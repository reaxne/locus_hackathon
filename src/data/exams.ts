import type { GoalExamName } from '../types'
// Preparation resources do not establish admission requirements.
export const examResources: Record<GoalExamName, { url: string; label: string; guidance: string }> = {
  SAT: {
    url: 'https://satsuite.collegeboard.org/practice',
    label: 'Официальная подготовка College Board',
    guidance: 'Пройдите официальный пробный тест и разберите отчёт о результатах.',
  },
  IELTS: {
    url: 'https://ielts.org/take-a-test/preparation-resources',
    label: 'Официальные материалы IELTS',
    guidance: 'Изучите примеры заданий по аудированию, чтению, письму и устной речи.',
  },
  NUET: {
    url: 'https://apply.nu.edu.kz/',
    label: 'Приёмная комиссия Назарбаев Университета',
    guidance: 'Уточните актуальный формат NUET и доступные материалы для подготовки.',
  },
  UNT: {
    url: 'https://testcenter.kz/en/',
    label: 'Национальный центр тестирования',
    guidance: 'Уточните формат ЕНТ, комбинацию предметов и порядок регистрации.',
  },
}
