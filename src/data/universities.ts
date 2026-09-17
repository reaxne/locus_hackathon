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
    name: 'Nazarbayev University',
    shortName: 'NU',
    city: 'Astana',
    country: 'Kazakhstan',
    sourceUrl: sourceUrls.nu,
  },
  {
    id: 'aitu',
    name: 'Astana IT University',
    shortName: 'AITU',
    city: 'Astana',
    country: 'Kazakhstan',
    sourceUrl: sourceUrls.aitu,
  },
  {
    id: 'enu',
    name: 'L.N. Gumilyov Eurasian National University',
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
  duration: verified('3 years', sourceUrls.aitu),
  language: verified('English', sourceUrls.aitu),
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
    title: verified('BSc in Computer Science', sourceUrls.nu),
    code: null,
    primaryInterest: 'Software engineering',
    interests: ['Software engineering', 'AI & data'],
    description: 'A computer science degree to explore for your software and computing interests.',
    duration: unknown(sourceUrls.nu),
    language: verified('English', sourceUrls.nu),
    tuition: unknown(sourceUrls.nu),
    ...admissionUnknowns(sourceUrls.nu),
    admissionsUrl: sourceUrls.nu,
    researchExams: ['SAT', 'IELTS', 'NUET'],
  },
  {
    ...aitu,
    id: 'aitu-cs',
    title: verified('Computer Science', sourceUrls.aituCS),
    code: '6B06101',
    primaryInterest: 'AI & data',
    interests: ['AI & data', 'Software engineering'],
    description: 'Programming, data analysis and machine learning in a computing degree.',
  },
  {
    ...aitu,
    id: 'aitu-se',
    title: verified('Software Engineering', sourceUrls.aituSE),
    code: '6B06102',
    primaryInterest: 'Software engineering',
    interests: ['Software engineering'],
    description: 'A focused software pathway for students interested in building applications.',
  },
  {
    ...aitu,
    id: 'aitu-cyber',
    title: verified('Cybersecurity', sourceUrls.aituCyber),
    code: '6B06301',
    primaryInterest: 'Cybersecurity',
    interests: ['Cybersecurity'],
    description: 'A dedicated cybersecurity program to explore for your security interests.',
  },
  {
    id: 'enu-cs',
    universityId: 'enu',
    level: 'bachelor',
    title: verified('Computer Engineering and Software', sourceUrls.enu),
    code: '6B06104',
    primaryInterest: 'Software engineering',
    interests: ['Software engineering', 'AI & data', 'Cybersecurity'],
    description: 'Software development and computer systems, with data and security subjects.',
    duration: verified('4 years', sourceUrls.enu),
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
export const money = (value: number) => `${new Intl.NumberFormat('en-US').format(value)} ₸`
export const universityFor = (program: Program) => universities.find((u) => u.id === program.universityId)!
