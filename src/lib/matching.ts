import { factApplies, money, programs, universities } from '../data/universities'
import type { ApplicantProfile, Recommendation, Program } from '../types'

export function meetsHardConstraints(profile: ApplicantProfile, program: Program) {
  const university = universities.find((u) => u.id === program.universityId)!
  return (
    program.level === profile.level &&
    university.country === profile.country &&
    (!profile.mustStay || profile.city === 'Any city' || university.city === profile.city)
  )
}
export function recommend(profile: ApplicantProfile): Recommendation[] {
  return programs
    .filter((program) => meetsHardConstraints(profile, program))
    .map((program) => {
      const university = universities.find((u) => u.id === program.universityId)!
      const reasons: string[] = []
      const caveats: string[] = []
      let rank = 0
      if (program.interests.includes(profile.interest)) {
        rank += program.primaryInterest === profile.interest ? 40 : 25
        reasons.push(`${profile.interest} aligns with this program's focus or listed subjects.`)
      } else
        caveats.push(
          `This is an adjacent option, rather than a direct ${profile.interest.toLowerCase()} pathway.`,
        )
      if (university.city === profile.city) {
        rank += 10
        reasons.push(`Located in your preferred city, ${profile.city}.`)
      }
      if (profile.city === 'Any city') reasons.push('Within your Kazakhstan search area.')
      if (profile.academicStrengths.length && program.interests.includes(profile.interest))
        reasons.push(
          `Your self-reported strengths in ${profile.academicStrengths.join(', ')} give you a starting point for exploring this field; they are not an eligibility assessment.`,
        )
      let group: Recommendation['group'] = 'Needs verification'
      if (factApplies(program.tuition, profile) && profile.budget !== null) {
        if (program.tuition.value! <= profile.budget) {
          group = 'Fits your verified budget'
          rank += 20
          reasons.push(
            `Listed tuition is within your ${money(profile.budget)} annual budget for ${program.tuition.admissionCycle}.`,
          )
        } else {
          group = 'Over budget'
          rank -= 20
          caveats.push(
            `Listed tuition exceeds your annual budget by ${money(program.tuition.value! - profile.budget)}. Funding is not guaranteed.`,
          )
        }
      } else
        caveats.push(
          profile.budget === null
            ? 'Add an annual budget to assess affordability.'
            : `Tuition for your ${profile.entryYear} intake and applicant category is unverified. Affordability against your ${money(profile.budget)} budget is unknown.`,
        )
      // Exam readiness changes explanations; no unverified minimum is treated as eligibility.
      for (const exam of program.researchExams) {
        const result = profile.exams[exam]
        if (result.status === 'completed') {
          rank += 3
          reasons.push(
            `${exam}${result.score === null ? ' completed (score unknown)' : ` ${result.score}`} recorded: a starting point for checking the admissions route.`,
          )
        } else if (result.status === 'planned') {
          rank += 1
          reasons.push(`Your planned ${exam} can inform the admissions-route discussion.`)
        } else if (result.status === 'not-planned')
          caveats.push(`${exam} is not planned; check accepted alternatives before choosing this route.`)
      }
      if (factApplies(program.examRequirements, profile)) {
        for (const requirement of program.examRequirements.value!) {
          const result = profile.exams[requirement.exam]
          if (
            requirement.minimum !== null &&
            result.status === 'completed' &&
            result.score !== null &&
            result.score >= requirement.minimum
          ) {
            rank += 8
            reasons.push(
              `Your recorded ${requirement.exam} meets the sourced minimum; other admission conditions still apply.`,
            )
          }
        }
      } else
        caveats.push(
          'Entry thresholds, accepted exam routes and deadlines need confirmation for your intake.',
        )
      if (profile.funding !== 'self')
        caveats.push('Grant eligibility and availability are unverified; no scholarship is assumed.')
      return { program, university, group, reasons, caveats, rank }
    })
    .sort((a, b) => b.rank - a.rank || a.program.id.localeCompare(b.program.id))
}
