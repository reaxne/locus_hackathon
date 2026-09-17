import type { University, Program, SourcedFact, ApplicantProfile } from '../types'

export const checkedAt = '2026-09-16'
export const sourceUrls = {
  nu: 'https://apply.nu.edu.kz/',
  aitu: 'https://astanait.edu.kz/bachelor',
  aituAdmissions: 'https://astanait.edu.kz/how-to-apply',
  aituCS: 'https://astanait.edu.kz/en/Computer-Science-bachelor',
  aituSE: 'https://astanait.edu.kz/en/Software-Engineering-bachelor',
  aituCyber: 'https://astanait.edu.kz/en/Cybersecurity',
  enu: 'https://fit.enu.kz/en/page/departments/department-of-computer-and-software-engineering/educational-programs',
  registry: 'https://data.egov.kz/datasets/view?index=onirler_oblystar_kalalar_boi11',
}
const verified = <T>(value: T, sourceUrl: string, admissionCycle: string | null = null): SourcedFact<T> => ({
  value,
  sourceUrl,
  admissionCycle,
  verifiedAt: checkedAt,
  status: 'verified',
})
const unknown = <T>(sourceUrl: string): SourcedFact<T> => ({
  value: null,
  sourceUrl,
  admissionCycle: null,
  verifiedAt: null,
  status: 'unknown',
})

export const universities: University[] = [
  {
    id: 'nu',
    name: 'Назарбаев Университет',
    shortName: 'NU',
    city: 'Astana',
    country: 'Kazakhstan',
    sourceUrl: sourceUrls.nu,
  },
  {
    id: 'aitu',
    name: 'Астана IT Университет',
    shortName: 'AITU',
    city: 'Astana',
    country: 'Kazakhstan',
    sourceUrl: sourceUrls.aitu,
  },
  {
    id: 'enu',
    name: 'Евразийский национальный университет имени Л. Н. Гумилёва',
    shortName: 'ENU',
    city: 'Astana',
    country: 'Kazakhstan',
    sourceUrl: sourceUrls.enu,
  },
]
const admissionUnknowns = (url: string) => ({
  examRequirements: unknown<import('../types').ExamRequirement[]>(url),
  deadline: unknown<string>(url),
  grant: unknown<string>(url),
  documents: unknown<string[]>(url),
})
const aitu = {
  universityId: 'aitu',
  level: 'bachelor' as const,
  duration: verified('3 года', sourceUrls.aitu),
  language: verified('Английский', sourceUrls.aitu),
  tuition: { ...verified(2_500_000, sourceUrls.aitu, '2026–2027'), scope: 'domestic' as const },
  ...admissionUnknowns(sourceUrls.aituAdmissions),
  admissionsUrl: sourceUrls.aituAdmissions,
  researchExams: ['UNT', 'AET'] as Program['researchExams'],
}
export const programs: Program[] = [
  {
    id: 'nu-cs',
    universityId: 'nu',
    level: 'bachelor',
    title: verified('Бакалавриат: компьютерные науки', sourceUrls.nu),
    code: null,
    primaryInterest: 'Software engineering',
    interests: ['Software engineering', 'AI & data'],
    description: 'Программа по компьютерным наукам для интересующихся разработкой и вычислениями.',
    duration: unknown(sourceUrls.nu),
    language: verified('Английский', sourceUrls.nu),
    tuition: unknown(sourceUrls.nu),
    ...admissionUnknowns(sourceUrls.nu),
    admissionsUrl: sourceUrls.nu,
    researchExams: ['SAT', 'IELTS', 'NUET'],
  },
  {
    ...aitu,
    id: 'aitu-cs',
    title: verified('Компьютерные науки', sourceUrls.aituCS),
    code: '6B06101',
    primaryInterest: 'AI & data',
    interests: ['AI & data', 'Software engineering'],
    description: 'Программирование, анализ данных и машинное обучение.',
  },
  {
    ...aitu,
    id: 'aitu-se',
    title: verified('Программная инженерия', sourceUrls.aituSE),
    code: '6B06102',
    primaryInterest: 'Software engineering',
    interests: ['Software engineering'],
    description: 'Программная инженерия для студентов, которые хотят создавать приложения.',
  },
  {
    ...aitu,
    id: 'aitu-cyber',
    title: verified('Кибербезопасность', sourceUrls.aituCyber),
    code: '6B06301',
    primaryInterest: 'Cybersecurity',
    interests: ['Cybersecurity'],
    description: 'Программа по защите информации и безопасности цифровых систем.',
  },
  {
    id: 'enu-cs',
    universityId: 'enu',
    level: 'bachelor',
    title: verified('Вычислительная техника и программное обеспечение', sourceUrls.enu),
    code: '6B06104',
    primaryInterest: 'Software engineering',
    interests: ['Software engineering', 'AI & data', 'Cybersecurity'],
    description: 'Разработка программ и компьютерных систем, работа с данными и безопасность.',
    duration: verified('4 года', sourceUrls.enu),
    language: unknown(sourceUrls.enu),
    tuition: unknown(sourceUrls.enu),
    ...admissionUnknowns(sourceUrls.enu),
    admissionsUrl: sourceUrls.enu,
    researchExams: ['UNT'],
  },
]
export const currentYear = new Date().getFullYear()
export const cycleFor = (year: number) => `${year}–${year + 1}`
export function factApplies<T>(fact: SourcedFact<T>, profile?: ApplicantProfile): boolean {
  return (
    fact.status === 'verified' &&
    fact.value !== null &&
    (!profile ||
      ((!fact.admissionCycle || fact.admissionCycle === cycleFor(profile.entryYear)) &&
        (!fact.scope || fact.scope === 'all' || fact.scope === profile.category)))
  )
}
export const money = (value: number) => `${new Intl.NumberFormat('ru-KZ').format(value)} ₸`
export const universityFor = (program: Program) => universities.find((u) => u.id === program.universityId)!
