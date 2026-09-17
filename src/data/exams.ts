import type { GoalExamName } from '../types'

// Preparation resources, not evidence that a program requires an exam.
export const examResources: Record<GoalExamName, { url: string; label: string; guidance: string }> = {
  SAT: {
    url: 'https://satsuite.collegeboard.org/practice',
    label: 'College Board preparation resources',
    guidance: 'Use an official practice test and review your score report.',
  },
  IELTS: {
    url: 'https://ielts.org/take-a-test/preparation-resources',
    label: 'IELTS official preparation resources',
    guidance: 'Review sample tasks for listening, reading, writing and speaking.',
  },
  NUET: {
    url: 'https://apply.nu.edu.kz/',
    label: 'NU official admissions information',
    guidance: 'Confirm the current NUET route, format and available preparation materials with NU.',
  },
  UNT: {
    url: 'https://testcenter.kz/en/',
    label: 'National Testing Center',
    guidance: 'Confirm the current UNT format, subject combination and registration process.',
  },
}
