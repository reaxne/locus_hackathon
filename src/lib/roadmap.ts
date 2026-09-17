import { cycleFor, factApplies, programs, universityFor } from '../data/universities'
import { examResources } from '../data/exams'
import {
  goalExamNames,
  ieltsSections,
  type ApplicantProfile,
  type Program,
  type PlannedActivity,
  type RoadmapTask,
  type SavedOption,
} from '../types'
import { meetsHardConstraints } from './matching'
import { examLabel } from './profile'

// Fingerprints reset only tasks whose inputs or sourced requirements actually changed.
function fingerprint(value: unknown) {
  let hash = 2166136261
  for (const char of JSON.stringify(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (hash >>> 0).toString(36)
}
export function createPlan(
  profile: ApplicantProfile,
  savedOptions: SavedOption[] = [],
  activities: PlannedActivity[] = [],
  focus: string | null = null,
): RoadmapTask[] {
  const tasks: RoadmapTask[] = []
  const early = profile.grade <= 10
  const future = early || profile.entryYear > new Date().getFullYear() + 1
  const context = `${profile.entryYear}:${profile.category}`
  const add = (
    id: string,
    stage: RoadmapTask['stage'],
    title: string,
    description: string,
    timing: string,
    why: string,
    how: string[],
    sourceUrl = '/sources',
    sourceLabel = 'Planning methodology · suggested activity',
    actionPath?: string,
  ) => tasks.push({ id, stage, title, description, timing, why, how, sourceUrl, sourceLabel, actionPath })
  const optionIds = new Set([...savedOptions.map((option) => option.programId), ...(focus ? [focus] : [])])
  const selected = programs
    .filter((program) => optionIds.has(program.id) && meetsHardConstraints(profile, program))
    .sort((a, b) => Number(b.id === focus) - Number(a.id === focus))
  if (early)
    add(
      `explore:${context}:${profile.interest}`,
      'Now',
      'Explore your chosen field',
      `Try one small ${profile.interest.toLowerCase()} exercise before committing to a pathway.`,
      'This school term · suggested',
      'A small practical experience can help you discover which tasks you enjoy.',
      [
        'Choose one beginner activity from Portfolio Plan.',
        'Spend one short session trying it.',
        'Write down what you enjoyed and what you want to learn next.',
      ],
      '/sources',
      'Planning methodology · not an admission requirement',
      '/portfolio',
    )
  if (!selected.length)
    add(
      `shortlist:${context}:${profile.interest}:${profile.city}:${profile.mustStay}`,
      'Now',
      'Save two programs to investigate',
      'Start with the reasons and unknowns, then use personal labels to organise your options.',
      'This week · suggested',
      'A shortlist gives your preparation a concrete direction.',
      [
        'Open Universities and inspect two program pages.',
        'Save an option as Considering or another personal label.',
        'Compare official information before choosing a focus.',
      ],
      '/sources',
      'Planning methodology',
      '/universities',
    )
  for (const program of selected) {
    const uni = universityFor(program)
    const prefix = `${program.id}:${context}`
    const requirementsKey = fingerprint([program.examRequirements, program.documents])
    add(
      `${prefix}:route:${requirementsKey}`,
      'Now',
      `Check the admissions route at ${uni.shortName}`,
      `Confirm the ${cycleFor(profile.entryYear)} route for ${program.title.value}.`,
      future ? 'Research now; recheck nearer your intake' : 'This week · suggested',
      'Applicant category and intake can change which requirements apply.',
      [
        'Open the official admissions page.',
        'Identify your intended intake and applicant category.',
        'Confirm which exams are alternatives and which documents are required.',
      ],
      program.admissionsUrl,
      'Official admissions information',
      `/universities/${program.id}`,
    )
  }
  add(
    `subjects:${context}:${early ? 'early' : 'senior'}:${profile.interest}:${fingerprint(profile.academicStrengths.slice().sort())}`,
    'Prepare',
    early ? 'Build your subject foundations' : 'Choose one subject to strengthen',
    profile.academicStrengths.length
      ? `Use your strengths in ${profile.academicStrengths.join(', ')} as a starting point.`
      : 'Choose one mathematics, computing or English topic to practise.',
    early ? 'This school term · suggested' : 'Next two weeks · suggested',
    'A focused routine is easier to maintain than an undefined preparation goal.',
    [
      'Choose one topic connected to your intended field.',
      'Try a short exercise to find a specific gap.',
      'Schedule two practice sessions and review what improved.',
    ],
  )
  for (const exam of goalExamNames) {
    const result = profile.exams[exam]
    const goal = profile.examGoals[exam]
    const chosen =
      result.status === 'planned' ||
      result.status === 'completed' ||
      goal.targetScore !== null ||
      goal.targetDate !== null
    if (!chosen) continue
    const key = `exam:${context}:${exam}:${fingerprint([result, goal])}`
    const resource = examResources[exam]
    const timing = goal.targetDate
      ? `Before ${goal.targetDate} · your target, not an official deadline`
      : early
        ? 'This school term · suggested'
        : 'Next two weeks · suggested'
    const name = examLabel(exam)
    add(
      `${key}:route`,
      'Prepare',
      `Confirm where ${name} fits`,
      'Check whether this exam is accepted for any of your intended admissions routes before booking it.',
      'Before committing to an exam',
      'A personal exam goal is not a university requirement.',
      [
        'Read the admissions rules for your saved programs.',
        'Check accepted exam types, validity and score requirements.',
        'If rules are unpublished, keep the requirement unknown and revisit later.',
      ],
      selected[0]?.admissionsUrl ?? resource.url,
      selected.length ? 'Official admissions information' : resource.label,
      '/exam-goals',
    )
    const preparing =
      result.status !== 'completed' ||
      result.score === null ||
      (goal.targetScore !== null && goal.targetScore > result.score)
    if (preparing) {
      add(
        `${key}:diagnostic`,
        'Prepare',
        `Take a diagnostic test for ${name}`,
        resource.guidance,
        timing,
        'A baseline identifies what needs practice; it is not an official certificate.',
        [
          'Find an appropriate official sample or practice test.',
          'Try it under realistic conditions.',
          'Keep the score report or your notes for review.',
        ],
        resource.url,
        `${resource.label} · steps are planning suggestions`,
        '/exam-goals',
      )
      add(
        `${key}:record`,
        'Prepare',
        `Record your ${name} section scores`,
        exam === 'IELTS'
          ? 'Record Listening, Reading, Writing and Speaking in Exam Goals. Use teacher feedback where a task cannot be scored reliably alone.'
          : 'Write down your section or subject results in your own study notes and record your current official result in Exam Goals when available.',
        'After your diagnostic · suggested',
        'Section-level feedback makes a broad target more actionable.',
        [
          'Separate official results from practice estimates.',
          'Record the section or subject breakdown.',
          'Leave any unmeasured score unknown.',
        ],
        resource.url,
        resource.label,
        '/exam-goals',
      )
      const sectionKey = exam === 'IELTS' ? fingerprint(profile.ieltsSectionScores) : 'subjects'
      const measured =
        exam === 'IELTS'
          ? ieltsSections
              .filter((section) => profile.ieltsSectionScores[section] !== null)
              .sort((a, b) => profile.ieltsSectionScores[a]! - profile.ieltsSectionScores[b]!)
          : []
      add(
        `${key}:weak:${sectionKey}`,
        'Prepare',
        `Choose one ${name} section to improve`,
        measured.length
          ? `${measured[0]} is currently your lowest recorded practice section. Consider starting there.`
          : 'Use your diagnostic notes to choose one section or subject for focused practice.',
        'After recording feedback · suggested',
        'One specific weakness gives you a manageable first practice goal.',
        [
          'Review mistakes rather than only the total score.',
          'Choose one recurring mistake or skill.',
          'Write a small improvement goal for your next session.',
        ],
        resource.url,
        resource.label,
        '/exam-goals',
      )
      add(
        `${key}:practice:${sectionKey}`,
        'Prepare',
        `Schedule two ${name} practice sessions`,
        `Choose times you can keep.${goal.targetScore !== null ? ` Your personal target is ${goal.targetScore}; it is not a verified admission minimum.` : ''}`,
        timing,
        'Scheduled practice turns an exam intention into an action you can follow.',
        [
          'Pick two realistic study slots in your own calendar.',
          'Use official sample questions for the chosen weak area.',
          'Review results after the second session and adjust your goal.',
        ],
        resource.url,
        resource.label,
        '/exam-goals',
      )
    } else
      add(
        `${key}:validity`,
        'Prepare',
        `Check your ${name} result validity`,
        `Your recorded result is ${result.score ?? 'unknown'}. Verify validity and score-reporting rules for the intake.`,
        'Before applying · suggested',
        'A completed exam still needs to meet the receiving university’s rules.',
        [
          'Find your official result record.',
          'Confirm the certificate remains valid for the intended intake.',
          'Check the university’s score-submission procedure.',
        ],
        resource.url,
        resource.label,
        '/exam-goals',
      )
  }
  for (const activity of activities) {
    const key = `activity:${context}:${activity.id}:${fingerprint([activity.title, activity.category, activity.targetPeriod])}`
    const timing = activity.targetPeriod
      ? `${activity.targetPeriod} · your target period`
      : 'Choose a target period in Portfolio Plan'
    if (activity.status === 'planned')
      add(
        `${key}:scope`,
        'Prepare',
        `Define a small outcome: ${activity.title}`,
        'Write one deliverable you could show and a realistic first step.',
        timing,
        'A defined outcome keeps an extracurricular activity manageable.',
        [
          'Describe your own role.',
          'Choose one deliverable, such as a demo, report or reflection.',
          'Confirm any event eligibility or mentor arrangements yourself.',
        ],
        '/sources',
        'Portfolio planning idea · not an admitted-student example',
        '/portfolio',
      )
    if (activity.status !== 'completed')
      add(
        `${key}:deliver`,
        'Prepare',
        `Make progress: ${activity.title}`,
        'Complete one small piece of the activity and record what you contributed.',
        timing,
        'An honest record is more useful than a claim without evidence.',
        [
          'Work on your next small milestone.',
          'Save a screenshot, notebook, contribution log or draft.',
          'Update the activity status in Portfolio Plan.',
        ],
        '/sources',
        'Portfolio planning methodology',
        '/portfolio',
      )
    add(
      `${key}:reflect`,
      'Prepare',
      `Reflect on ${activity.title}`,
      'Collect an outcome and a short reflection on what you learned.',
      activity.status === 'completed'
        ? 'Now, while the experience is fresh · suggested'
        : 'After your activity · suggested',
      'Reflection helps explain your interests; a portfolio is not automatically required for admission.',
      [
        'Save the final work and describe your own contribution.',
        'Mention a challenge and how you responded.',
        'Use it in an application only if that program requests or accepts it.',
      ],
      '/sources',
      'Portfolio planning methodology',
      '/portfolio',
    )
  }
  for (const program of selected) {
    const prefix = `${program.id}:${context}`
    const short = universityFor(program).shortName
    for (const exam of program.researchExams) {
      if (
        exam !== 'AET' &&
        (profile.exams[exam].status === 'planned' ||
          profile.exams[exam].status === 'completed' ||
          profile.examGoals[exam].targetScore !== null ||
          profile.examGoals[exam].targetDate !== null)
      )
        continue
      add(
        `${prefix}:exam:${exam}:${fingerprint(profile.exams[exam])}`,
        'Prepare',
        `Check the ${examLabel(exam)} route at ${short}`,
        'This is a research topic, not a confirmed compulsory exam.',
        'After checking the admissions route',
        'Universities may offer alternative routes and cycle-specific rules.',
        [
          'Check the current official admissions page.',
          'Ask if this exam applies to your category.',
          'Add a personal goal only if you choose to prepare for it.',
        ],
        program.admissionsUrl,
        'Official admissions information',
        '/exam-goals',
      )
    }
    if (factApplies(program.examRequirements, profile))
      for (const requirement of program.examRequirements.value!) {
        add(
          `${prefix}:requirement:${fingerprint(requirement)}:${fingerprint(profile.exams[requirement.exam])}`,
          'Prepare',
          `Review the verified ${examLabel(requirement.exam)} requirement at ${short}`,
          `The sourced requirement${requirement.minimum === null ? ' needs its exact threshold checked' : ` lists ${requirement.minimum} as a minimum`}. Confirm other conditions as well.`,
          'Before applying',
          'A verified requirement must still match your category and intake.',
          [
            'Read all conditions around the sourced threshold.',
            'Compare your official result, leaving missing scores unknown.',
            'Check accepted exam dates and submission methods.',
          ],
          program.examRequirements.sourceUrl,
          'Sourced admission requirement',
          '/exam-goals',
        )
      }
    add(
      `${prefix}:budget:${profile.budget}:${profile.funding}:${fingerprint(program.tuition)}`,
      'Prepare',
      `Confirm tuition and funding at ${short}`,
      `Verify the ${cycleFor(profile.entryYear)} fee and a funding plan for your category.`,
      future ? 'Research now; recheck before applying' : 'Before committing to this option',
      'A missing price or a hoped-for grant cannot establish affordability.',
      [
        'Confirm tuition and payment conditions.',
        'Budget for living costs separately.',
        'If seeking a grant, confirm eligibility and a backup plan.',
      ],
      program.tuition.sourceUrl,
      'Official fee information',
    )
    add(
      `${prefix}:deadline:${fingerprint(program.deadline)}`,
      'Apply',
      `Verify the current deadline at ${short}`,
      factApplies(program.deadline, profile)
        ? `Recheck the sourced date: ${program.deadline.value}.`
        : `No deadline is verified for ${cycleFor(profile.entryYear)}. Revisit when this intake's rules are published.`,
      future
        ? `Later, nearer the ${profile.entryYear} intake · estimate`
        : 'When your intake rules are published',
      'Old dates must not be carried into a new application cycle.',
      [
        'Find the page for your exact intake.',
        'Confirm the date, year and timezone.',
        'Add only the confirmed date to your own calendar.',
      ],
      program.deadline.sourceUrl,
      'Official admissions calendar · confirm the intake',
    )
    add(
      `${prefix}:documents:${fingerprint(program.documents)}`,
      'Apply',
      `Create a document checklist for ${short}`,
      factApplies(program.documents, profile)
        ? program.documents.value!.join('; ')
        : 'The required documents are unverified for your intake and category.',
      future ? 'Later, before your intake · estimate' : 'After confirming the current rules',
      'Requirements can differ by route, citizenship and qualification.',
      [
        'Open the official document instructions.',
        'List the items that apply to your category.',
        'Check any translation or certification requirements before preparing files.',
      ],
      program.documents.sourceUrl,
      'Official document information',
    )
    add(
      `${prefix}:apply:${future ? 'future' : 'near'}`,
      'Apply',
      future ? `Prepare to apply to ${short} in ${profile.entryYear}` : `Prepare your ${short} application`,
      'Use the official portal only once the intake is open and your requirements are confirmed.',
      `Only during the confirmed ${profile.entryYear} application window`,
      'This planner does not submit applications or confirm that an intake is open.',
      [
        'Recheck the deadline and eligibility.',
        'Prepare the verified document set.',
        'Review the official application carefully before you submit it.',
      ],
      program.admissionsUrl,
      'Official application information',
    )
    add(
      `${prefix}:confirm`,
      'Confirm',
      `Review the official outcome from ${short}`,
      'Read any offer, funding conditions and enrollment instructions.',
      'After an official decision',
      'Only the university can confirm admission and enrollment.',
      [
        'Read the official decision.',
        'Clarify funding and enrollment terms.',
        'Follow the university’s confirmation instructions if you accept.',
      ],
      program.admissionsUrl,
      'Official admissions information',
    )
  }
  const stages: RoadmapTask['stage'][] = ['Now', 'Prepare', 'Apply', 'Confirm']
  return tasks.sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage))
}
export const createRoadmap = (profile: ApplicantProfile, program: Program) =>
  createPlan(profile, [], [], program.id)
