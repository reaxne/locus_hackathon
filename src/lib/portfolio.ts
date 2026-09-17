import { activityCategories, type ActivityCategory, type ApplicantProfile } from '../types'

export const categoryOutcomes: Record<ActivityCategory, string> = {
  Hackathons: 'A small working prototype, a team contribution log and a short demonstration.',
  Volunteering: 'A useful community contribution, feedback and an honest record of your role.',
  Research: 'A focused question, a reproducible notebook or report, and a discussion of limitations.',
  'Personal Projects': 'A working application or analysis, documentation and evidence of iteration.',
  Competitions: 'Practice solutions, a reflection on progress and any participation evidence you earn.',
  Leadership: 'A realistic team plan, meeting notes and feedback from people you supported.',
}
export interface ActivityIdea {
  id: string
  category: ActivityCategory
  title: string
  description: string
  outcome: string
  suggestedPeriod: string
}
export function portfolioIdeas(profile: ApplicantProfile): ActivityIdea[] {
  const early = profile.grade <= 10
  const theme =
    profile.interest === 'AI & data'
      ? 'data'
      : profile.interest === 'Cybersecurity'
        ? 'digital safety'
        : 'software'
  const titles: Record<ActivityCategory, string> = {
    Hackathons: early ? `Try a school ${theme} challenge` : `Build a ${theme} prototype with a team`,
    Volunteering: `Help a community group with ${theme}`,
    Research: early ? `Investigate a small ${theme} question` : `Write a reproducible ${theme} investigation`,
    'Personal Projects':
      profile.interest === 'AI & data'
        ? 'Explore a public dataset in a notebook'
        : profile.interest === 'Cybersecurity'
          ? 'Build a digital-safety learning guide'
          : 'Build a useful school planning app',
    Competitions: early
      ? 'Practice a beginner computing challenge'
      : 'Prepare a set of timed computing solutions',
    Leadership: early ? 'Co-organise a small study group' : 'Lead a short peer-learning project',
  }
  return activityCategories
    .map((category) => ({
      id: `${category}:${profile.interest}:${early ? 'explore' : 'develop'}`,
      category,
      title: titles[category],
      outcome: categoryOutcomes[category],
      description: `${early ? 'Keep the scope small and ask a teacher or mentor for feedback.' : 'Set a clear deliverable and collect evidence of your own contribution.'} Connect the work to ${profile.interest.toLowerCase()}.${profile.interest === 'Cybersecurity' ? ' Use only your own examples, training labs or systems you have permission to study.' : ''}`,
      suggestedPeriod: early ? 'This school term' : 'Next 6–8 weeks',
    }))
    .sort(
      (a, b) =>
        Number(profile.extracurricularInterests.includes(b.category)) -
        Number(profile.extracurricularInterests.includes(a.category)),
    )
}
