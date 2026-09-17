import { factApplies, money, programs, universities } from '../data/universities'
import type { ApplicantProfile, Recommendation, Program } from '../types'
import { ru } from './labels'
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
      const reasons: string[] = [],
        caveats: string[] = []
      let rank = 0
      if (program.interests.includes(profile.interest)) {
        rank += program.primaryInterest === profile.interest ? 40 : 25
        reasons.push(`Направление «${ru(profile.interest)}» связано с содержанием программы.`)
      } else
        caveats.push(
          `Смежный вариант: связь с направлением «${ru(profile.interest)}» стоит проверить по учебному плану.`,
        )
      if (university.city === profile.city) {
        rank += 10
        reasons.push(`Находится в выбранном городе: ${ru(profile.city)}.`)
      }
      if (profile.city === 'Any city') reasons.push('Соответствует поиску по Казахстану.')
      if (profile.academicStrengths.length && program.interests.includes(profile.interest))
        reasons.push(
          `Ваши сильные стороны: ${profile.academicStrengths.map(ru).join(', ')}. Это основа для подготовки, а не оценка шансов поступления.`,
        )
      if (profile.studyLanguage !== 'any') {
        if (!factApplies(program.language, profile))
          caveats.push(
            `Язык обучения не подтверждён. Уточните наличие обучения на выбранном языке: ${ru(profile.studyLanguage)}.`,
          )
        else if (profile.studyLanguage === 'en' && program.language.value === 'Английский') {
          rank += 30
          reasons.push('Подтверждённый английский язык обучения совпадает с вашим выбором.')
        } else {
          rank -= 50
          caveats.push(
            `Подтверждённый язык: ${program.language.value}. Ваш выбор: ${ru(profile.studyLanguage)}; уточните альтернативы.`,
          )
        }
      }
      let group: Recommendation['group'] = 'Needs verification'
      if (factApplies(program.tuition, profile) && profile.budget !== null) {
        if (program.tuition.value! <= profile.budget) {
          group = 'Fits your verified budget'
          rank += 20
          reasons.push(
            `Стоимость укладывается в бюджет ${money(profile.budget)} в год для цикла ${program.tuition.admissionCycle}.`,
          )
        } else {
          group = 'Over budget'
          rank -= 20
          caveats.push(
            `Стоимость выше бюджета на ${money(program.tuition.value! - profile.budget)}. Получение гранта не гарантировано.`,
          )
        }
      } else
        caveats.push(
          profile.budget === null
            ? 'Укажите годовой бюджет для оценки стоимости.'
            : `Стоимость для поступления в ${profile.entryYear} году и вашей категории не подтверждена; соответствие бюджету ${money(profile.budget)} неизвестно.`,
        )
      for (const exam of program.researchExams) {
        const result = profile.exams[exam]
        if (result.status === 'completed') {
          rank += 3
          reasons.push(
            `${ru(exam)}: ${result.score ?? 'сдан, балл не указан'}. Результат полезен для проверки возможного пути поступления; обязательность не установлена.`,
          )
        } else if (result.status === 'planned') {
          rank += 1
          reasons.push(
            `Вы планируете ${ru(exam)}: проверьте, подходит ли этот экзамен для выбранного пути поступления.`,
          )
        }
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
              `Указанный результат ${ru(requirement.exam)} соответствует подтверждённому минимуму. Другие условия также нужно проверить.`,
            )
          } else
            caveats.push(
              `Подтверждённое требование ${ru(requirement.exam)}${requirement.minimum === null ? '' : `: минимум ${requirement.minimum}`} пока не подтверждено вашим профилем.`,
            )
        }
      } else
        caveats.push(
          'Пороговые баллы, допустимые экзамены и сроки для вашего года требуют уточнения. Неизвестные требования не считаются вашими пробелами.',
        )
      if (profile.funding !== 'self')
        caveats.push(
          'Условия и доступность грантов нужно уточнить: стипендия не предполагается автоматически.',
        )
      if (profile.constraints.trim())
        caveats.push(
          'Дополнительные ограничения из профиля нужно обсудить с приёмной комиссией; каталог не подтверждает их выполнение.',
        )
      return { program, university, group, reasons, caveats, rank }
    })
    .sort((a, b) => b.rank - a.rank || a.program.id.localeCompare(b.program.id))
}
