export const countries = ['Казахстан', 'Германия', 'Нидерланды'] as const
export const interests = ['IT и технологии', 'Бизнес и экономика', 'Инженерия'] as const
export type Country = (typeof countries)[number]
export type Interest = (typeof interests)[number]
export type View = 'overview' | 'profile' | 'programs' | 'compare' | 'roadmap'
export interface Profile {
  name: string
  grade: string
  interest: Interest
  gpa: number
  ielts: number
  countries: Country[]
  budget: number
  year: number
}
export interface University {
  id: string
  name: string
  short: string
  country: Country
  city: string
  fee: number
  ielts: number
  gpa: number
  fields: Interest[]
  color: string
  duration: number
}
export interface Recommendation {
  university: University
  matches: number
  rank: number
  reasons: string[]
  gaps: string[]
}
export interface Task {
  id: string
  title: string
  description: string
  category: string
  timing: string
}
export interface SavedState {
  version: 1
  profile: Profile
  isDemo: boolean
  completed: string[]
  comparison: string[]
  target: string | null
}
export const currentYear = new Date().getFullYear()
export const demoProfile: Profile = {
  name: 'Алекс',
  grade: '11 класс',
  interest: 'IT и технологии',
  gpa: 4.5,
  ielts: 6,
  countries: ['Германия', 'Нидерланды'],
  budget: 15000,
  year: currentYear + 1,
}
// All catalog records, costs and requirements are fictional scenario data, not admission advice.
export const universities: University[] = [
  {
    id: 'rhein',
    name: 'Rhein Institute of Technology',
    short: 'RI',
    country: 'Германия',
    city: 'Берлин',
    fee: 4800,
    ielts: 6,
    gpa: 4,
    fields: ['IT и технологии', 'Инженерия'],
    color: 'blue',
    duration: 3,
  },
  {
    id: 'noord',
    name: 'Noord International University',
    short: 'NU',
    country: 'Нидерланды',
    city: 'Утрехт',
    fee: 12500,
    ielts: 6.5,
    gpa: 4,
    fields: ['IT и технологии', 'Бизнес и экономика'],
    color: 'orange',
    duration: 3,
  },
  {
    id: 'elbe',
    name: 'Elbe University of Applied Sciences',
    short: 'EU',
    country: 'Германия',
    city: 'Гамбург',
    fee: 7200,
    ielts: 6,
    gpa: 3.8,
    fields: ['IT и технологии', 'Бизнес и экономика', 'Инженерия'],
    color: 'purple',
    duration: 4,
  },
  {
    id: 'steppe',
    name: 'Steppe Technology University',
    short: 'ST',
    country: 'Казахстан',
    city: 'Алматы',
    fee: 3200,
    ielts: 5.5,
    gpa: 3.5,
    fields: ['IT и технологии', 'Инженерия'],
    color: 'teal',
    duration: 4,
  },
  {
    id: 'astana',
    name: 'Astana International College',
    short: 'AI',
    country: 'Казахстан',
    city: 'Астана',
    fee: 4200,
    ielts: 6,
    gpa: 4,
    fields: ['Бизнес и экономика', 'IT и технологии'],
    color: 'blue',
    duration: 4,
  },
  {
    id: 'altai',
    name: 'Altai Applied University',
    short: 'AU',
    country: 'Казахстан',
    city: 'Караганда',
    fee: 2400,
    ielts: 5,
    gpa: 3,
    fields: ['Инженерия', 'Бизнес и экономика'],
    color: 'orange',
    duration: 4,
  },
  {
    id: 'haven',
    name: 'Haven School of Business',
    short: 'HB',
    country: 'Нидерланды',
    city: 'Роттердам',
    fee: 9800,
    ielts: 6,
    gpa: 3.8,
    fields: ['Бизнес и экономика'],
    color: 'teal',
    duration: 3,
  },
  {
    id: 'delta',
    name: 'Delta Technical University',
    short: 'DT',
    country: 'Нидерланды',
    city: 'Эйндховен',
    fee: 14500,
    ielts: 6.5,
    gpa: 4.5,
    fields: ['IT и технологии', 'Инженерия'],
    color: 'purple',
    duration: 3,
  },
  {
    id: 'spree',
    name: 'Spree School of Economics',
    short: 'SE',
    country: 'Германия',
    city: 'Берлин',
    fee: 6500,
    ielts: 6,
    gpa: 3.8,
    fields: ['Бизнес и экономика'],
    color: 'blue',
    duration: 3,
  },
]
export const money = (value: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    value,
  )
export const programName = (field: Interest) =>
  ({
    'IT и технологии': 'Computer Science',
    'Бизнес и экономика': 'Business & Economics',
    Инженерия: 'Engineering & Technology',
  })[field]
export function recommend(profile: Profile): Recommendation[] {
  return universities
    .map((university) => {
      const checks = [
        {
          ok: university.fields.includes(profile.interest),
          weight: 40,
          yes: 'Есть выбранное направление',
          no: 'Нет выбранного направления',
        },
        {
          ok: profile.countries.includes(university.country),
          weight: 25,
          yes: 'В одной из выбранных стран',
          no: 'За пределами выбранных стран',
        },
        {
          ok: university.fee <= profile.budget,
          weight: 30,
          yes: 'Обучение укладывается в бюджет',
          no: `Выше бюджета на ${money(university.fee - profile.budget)}/год`,
        },
        {
          ok: profile.ielts >= university.ielts,
          weight: 8,
          yes: 'Текущего IELTS достаточно',
          no: `Нужно повысить IELTS до ${university.ielts}`,
        },
        {
          ok: profile.gpa >= university.gpa,
          weight: 7,
          yes: 'Средний балл соответствует',
          no: `Ориентир среднего балла — ${university.gpa}/5`,
        },
      ]
      return {
        university,
        matches: checks.filter((c) => c.ok).length,
        rank: checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0),
        reasons: checks.filter((c) => c.ok).map((c) => c.yes),
        gaps: checks.filter((c) => !c.ok).map((c) => c.no),
      }
    })
    .sort((a, b) => b.rank - a.rank || a.university.fee - b.university.fee)
}
export function createRoadmap(profile: Profile, target: University): Task[] {
  const key = `${target.id}-${profile.interest}-${profile.year}`
  const tasks: Task[] = [
    {
      id: `verify-${key}`,
      title: 'Уточнить условия выбранной программы',
      description: `Зафиксируй требования, стоимость и реальные даты набора ${profile.year}. ${target.name} — учебный пример: для настоящей заявки выбери реальный вуз и проверь его официальный сайт.`,
      category: 'Выбор программы',
      timing: 'На этой неделе',
    },
  ]
  if (profile.ielts < target.ielts)
    tasks.push({
      id: `ielts-${target.ielts}-${profile.year}`,
      title: `Составить план подготовки к IELTS ${target.ielts}`,
      description: `Сейчас у тебя ${profile.ielts || 'нет результата'}. Начни с пробного теста, выбери слабые секции и запланируй подготовку. Требование ${target.ielts} — демонстрационное.`,
      category: 'Экзамены',
      timing: 'Ближайшие 2 недели',
    })
  else
    tasks.push({
      id: `certificate-${profile.year}`,
      title: 'Проверить срок действия сертификата',
      description:
        'Уточни, принимает ли выбранная программа твой языковой экзамен и будет ли сертификат действителен на дату подачи.',
      category: 'Экзамены',
      timing: 'Ближайшие 2 недели',
    })
  if (target.fee > profile.budget)
    tasks.push({
      id: `funding-${target.id}-${profile.budget}-${profile.year}`,
      title: 'Найти вариант финансирования',
      description: `В демо-сценарии не хватает ${money(target.fee - profile.budget)} в год на обучение. Сравни более доступные программы и проверь реальные условия стипендий.`,
      category: 'Бюджет',
      timing: 'В этом месяце',
    })
  if (profile.gpa < target.gpa)
    tasks.push({
      id: `grades-${target.gpa}-${profile.year}`,
      title: 'Составить учебный план по профильным предметам',
      description: `Твой средний балл ${profile.gpa}/5; ориентир в примере — ${target.gpa}/5. Определи предметы, результаты по которым можно улучшить.`,
      category: 'Учёба',
      timing: 'В этом месяце',
    })
  tasks.push(
    {
      id: `documents-${target.country}-${profile.year}`,
      title:
        target.country === 'Казахстан'
          ? 'Собрать документы об образовании'
          : 'Подготовить документы и переводы',
      description: `Составь список: паспорт, аттестат или выписка оценок, языковой сертификат.${target.country !== 'Казахстан' ? ' Уточни требования к переводу и признанию аттестата.' : ' Уточни национальные экзамены и требования приёмной комиссии.'} Финальный перечень зависит от реальной программы.`,
      category: 'Документы',
      timing: 'После проверки требований',
    },
    {
      id: `activity-${profile.interest}-${profile.year}`,
      title:
        profile.interest === 'IT и технологии'
          ? 'Добавить свой проект в портфолио'
          : profile.interest === 'Инженерия'
            ? 'Описать инженерный проект'
            : 'Подготовить описание учебного или бизнес-проекта',
      description:
        'Выбери один проект: сформулируй задачу, покажи свою роль и результат. Это поможет рассказать о мотивации и интересах.',
      category: 'Активности',
      timing: 'В течение месяца',
    },
    {
      id: `application-${key}`,
      title: `Подготовить заявку на набор ${profile.year}`,
      description:
        'Напиши черновик мотивационного письма, проверь комплект документов и занеси подтверждённый дедлайн реального вуза в календарь.',
      category: 'Подача заявки',
      timing: `До официального дедлайна ${profile.year}`,
    },
  )
  return tasks
}
export function validateProfile(value: unknown): value is Profile {
  if (!value || typeof value !== 'object') return false
  const p = value as Profile
  return (
    typeof p.name === 'string' &&
    p.name.trim().length > 0 &&
    p.name.length <= 40 &&
    ['9 класс', '10 класс', '11 класс', 'Выпускник'].includes(p.grade) &&
    interests.includes(p.interest) &&
    Number.isFinite(p.gpa) &&
    p.gpa >= 2 &&
    p.gpa <= 5 &&
    Number.isFinite(p.ielts) &&
    p.ielts >= 0 &&
    p.ielts <= 9 &&
    (p.ielts * 2) % 1 === 0 &&
    Array.isArray(p.countries) &&
    p.countries.length > 0 &&
    p.countries.every((c) => countries.includes(c)) &&
    Number.isFinite(p.budget) &&
    p.budget >= 0 &&
    p.budget <= 100000 &&
    Number.isInteger(p.year) &&
    p.year >= currentYear &&
    p.year <= currentYear + 5
  )
}
export const storageKey = 'vector-admission-v1'
export const initialState = (): SavedState => ({
  version: 1,
  profile: { ...demoProfile, countries: [...demoProfile.countries] },
  isDemo: true,
  completed: [],
  comparison: [],
  target: null,
})
export function parseSavedState(raw: string | null): SavedState {
  try {
    const state = JSON.parse(raw ?? 'null') as SavedState | null
    if (!state || state.version !== 1 || !validateProfile(state.profile)) return initialState()
    return {
      version: 1,
      profile: state.profile,
      isDemo: state.isDemo !== false,
      completed: Array.isArray(state.completed)
        ? state.completed.filter((v): v is string => typeof v === 'string').slice(0, 200)
        : [],
      comparison: Array.isArray(state.comparison)
        ? [...new Set(state.comparison.filter((id) => universities.some((u) => u.id === id)))].slice(0, 3)
        : [],
      target: universities.some((u) => u.id === state.target) ? state.target : null,
    }
  } catch {
    return initialState()
  }
}
