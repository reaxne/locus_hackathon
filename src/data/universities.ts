import type { SourcedFact, ApplicantProfile } from '../types'

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
