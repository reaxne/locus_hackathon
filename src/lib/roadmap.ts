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
import { ru } from './labels'
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
  const tasks: RoadmapTask[] = [],
    early = profile.grade <= 10
  const context = `${profile.entryYear}:${profile.category}`
  const ids = new Set([...savedOptions.map((o) => o.programId), ...(focus ? [focus] : [])])
  const selected = programs.filter((p) => ids.has(p.id) && meetsHardConstraints(profile, p))
  const timing = early ? 'В этой учебной четверти · рекомендация' : 'В ближайшие две недели · рекомендация'
  const add = (
    id: string,
    stage: RoadmapTask['stage'],
    title: string,
    description: string,
    how: string[],
    associated: Program[] = [],
    sourceUrl = '/sources',
    actionPath?: string,
    when = timing,
    why = 'Конкретный небольшой шаг помогает проверить условия и подготовиться без неподтверждённых предположений.',
    criteria = 'Все перечисленные действия выполнены, результат сохранён в ваших заметках.',
  ) => {
    tasks.push({
      id,
      stage,
      title,
      description,
      how,
      why,
      timing: when,
      sourceUrl,
      sourceLabel:
        sourceUrl === '/sources'
          ? 'Методика планирования · рекомендация'
          : 'Официальный источник · проверьте год поступления',
      programIds: associated.map((p) => p.id),
      deadlines: associated.map((p) => ({
        programId: p.id,
        value: factApplies(p.deadline, profile) ? p.deadline.value : null,
        sourceUrl: p.deadline.sourceUrl,
        status: factApplies(p.deadline, profile) ? 'verified' : 'unknown',
      })),
      completionCriteria: criteria,
      actionPath,
      actionLabel:
        actionPath === '/exam-goals'
          ? 'Открыть цели по экзаменам'
          : actionPath === '/portfolio'
            ? 'Открыть план портфолио'
            : actionPath === '/universities'
              ? 'Найти университет'
              : actionPath
                ? 'Открыть программу'
                : undefined,
    })
  }
  if (early)
    add(
      `explore:${context}:${profile.interest}`,
      'Now',
      'Попробуйте выбранное направление',
      `В ${profile.grade} классе начните с небольшой задачи по направлению «${ru(profile.interest)}».`,
      [
        'Выберите одну идею в плане портфолио.',
        'Потратьте одно занятие на пробную задачу.',
        'Запишите, что понравилось и чему хотите научиться.',
      ],
      [],
      '/sources',
      '/portfolio',
    )
  if (!selected.length)
    add(
      `shortlist:${context}:${profile.interest}:${profile.city}:${profile.mustStay}`,
      'Now',
      'Добавьте две программы для изучения',
      'Прочитайте причины подбора и сведения, которые пока требуют проверки.',
      [
        'Откройте две карточки в каталоге.',
        'Добавьте подходящие варианты в свои университеты.',
        'Сравните официальные сведения.',
      ],
      [],
      '/sources',
      '/universities',
    )
  // University-level research is shared across programs at the same university.
  for (const universityId of [...new Set(selected.map((p) => p.universityId))]) {
    const associated = selected.filter((p) => p.universityId === universityId),
      p = associated[0],
      short = universityFor(p).shortName
    const prefix = `university:${universityId}:${context}`
    add(
      `${prefix}:route`,
      'Now',
      `Проверьте требования выбранных программ: ${short}`,
      `Найдите правила приёма ${cycleFor(profile.entryYear)} для вашей категории. Неопубликованные требования остаются неизвестными.`,
      [
        'Откройте официальный сайт приёмной комиссии.',
        'Найдите свой год и категорию поступления.',
        'Уточните обязательные экзамены и альтернативные пути для каждой выбранной программы.',
      ],
      associated,
      p.admissionsUrl,
      `/universities/${p.id}`,
      'На этой неделе · рекомендация',
      'У разных категорий и программ могут быть разные правила.',
      'Правила для каждой выбранной программы найдены либо вопрос отправлен приёмной комиссии.',
    )
    add(
      `${prefix}:budget:${profile.budget}:${profile.funding}:${fingerprint(associated.map((p) => p.tuition).filter((v, i, a) => a.findIndex((x) => JSON.stringify(x) === JSON.stringify(v)) === i))}`,
      'Prepare',
      `Уточните стоимость и финансирование: ${short}`,
      `Ваш годовой бюджет: ${profile.budget === null ? 'не указан' : `${profile.budget.toLocaleString('ru-KZ')} ₸`}. Проверьте стоимость для ${profile.entryYear} года.`,
      [
        'Уточните стоимость обучения и порядок оплаты.',
        'Отдельно оцените проживание и транспорт.',
        'Если нужен грант, проверьте условия и запасной вариант финансирования.',
      ],
      associated,
      p.tuition.sourceUrl,
    )
    add(
      `${prefix}:deadline`,
      'Apply',
      `Уточните сроки подачи: ${short}`,
      'Официальные даты показаны отдельно по программам, если подтверждены для вашего года. Не переносите даты прошлых лет.',
      [
        'Откройте календарь своего набора.',
        'Проверьте дату, год и часовой пояс для каждой программы.',
        'Добавьте в календарь только подтверждённые сроки.',
      ],
      associated,
      p.deadline.sourceUrl,
      undefined,
      `Когда опубликованы правила набора ${profile.entryYear}`,
    )
    add(
      `${prefix}:documents:${fingerprint(associated.map((p) => p.documents).filter((v, i, a) => a.findIndex((x) => JSON.stringify(x) === JSON.stringify(v)) === i))}`,
      'Apply',
      `Составьте список документов: ${short}`,
      associated.every((p) => factApplies(p.documents, profile))
        ? associated.flatMap((p) => p.documents.value!).join('; ')
        : 'Список документов пока не подтверждён для вашего набора.',
      [
        'Найдите официальный перечень для каждой программы.',
        'Запишите необходимые документы и способ подачи.',
        'Проверьте требования к переводу и заверению.',
      ],
      associated,
      p.documents.sourceUrl,
      undefined,
      'После проверки действующих правил',
    )
    for (const program of associated) {
      add(
        `${program.id}:${context}:apply`,
        'Apply',
        `Подготовьте заявку: ${program.title.value}`,
        'Подавайте заявку только через официальный портал после проверки набора и всех требований.',
        [
          'Перепроверьте право участия и сроки.',
          'Подготовьте подтверждённый комплект документов.',
          'Проверьте заявку перед самостоятельной отправкой.',
        ],
        [program],
        program.admissionsUrl,
        `/universities/${program.id}`,
        `Только в подтверждённое окно приёма ${profile.entryYear}`,
      )
      add(
        `${program.id}:${context}:confirm`,
        'Confirm',
        `Проверьте решение: ${program.title.value}`,
        'Только университет подтверждает зачисление и условия финансирования.',
        [
          'Прочитайте официальное решение.',
          'Уточните условия гранта или оплаты.',
          'Выполните инструкции университета, если принимаете предложение.',
        ],
        [program],
        program.admissionsUrl,
        undefined,
        'После официального решения',
      )
    }
  }
  add(
    `subjects:${context}:${early}:${profile.interest}:${profile.academicPerformance}:${fingerprint(profile.academicStrengths.slice().sort())}`,
    'Prepare',
    early ? 'Укрепите базу по школьным предметам' : 'Выберите один предмет для улучшения',
    profile.academicPerformance === 'needs-support'
      ? 'Начните с короткой диагностики по математике или информатике и попросите помощь учителя.'
      : `Опирайтесь на сильные стороны: ${profile.academicStrengths.map(ru).join(', ') || 'пока не указаны'}.`,
    [
      'Выберите одну тему, связанную с вашим направлением.',
      'Решите короткое задание и определите пробел.',
      'Запланируйте два занятия и оцените результат.',
    ],
    selected,
  )
  if (profile.studyLanguage !== 'any')
    add(
      `language:${context}:${profile.studyLanguage}`,
      'Prepare',
      `Проверьте готовность учиться: ${ru(profile.studyLanguage)}`,
      'Язык обучения влияет на учебные материалы. Сам по себе выбор языка не означает, что нужен IELTS или другой экзамен.',
      [
        'Уточните язык каждой выбранной программы.',
        'Попробуйте прочитать вводный учебный материал на этом языке.',
        'Запишите непонятные термины и выберите способ практики.',
      ],
      selected,
      '/sources',
      undefined,
      timing,
      'Нужно отличать готовность учиться на языке от официальных требований к сертификату.',
    )
  if (profile.constraints.trim())
    add(
      `constraints:${context}:${fingerprint(profile.constraints)}`,
      'Now',
      'Уточните ваши существенные ограничения',
      profile.constraints,
      [
        'Сформулируйте конкретный вопрос по ограничению.',
        'Проверьте информацию на сайте выбранного университета.',
        'При отсутствии ответа обратитесь в приёмную комиссию.',
      ],
      selected,
    )
  for (const exam of goalExamNames) {
    const result = profile.exams[exam],
      goal = profile.examGoals[exam],
      resource = examResources[exam],
      name = examLabel(exam)
    const chosen =
      ['planned', 'completed'].includes(result.status) ||
      goal.targetScore !== null ||
      goal.targetDate !== null
    const associated = selected.filter(
      (p) =>
        p.researchExams.includes(exam) ||
        (factApplies(p.examRequirements, profile) && p.examRequirements.value!.some((r) => r.exam === exam)),
    )
    const key = `exam:${context}:${exam}:${fingerprint([result, goal])}`
    if (!chosen) {
      if (associated.length)
        add(
          `${key}:research`,
          'Prepare',
          `Уточните, нужен ли ${name}`,
          'Это возможный путь для изучения, а не подтверждённый обязательный экзамен.',
          [
            'Проверьте допустимые пути для каждой связанной программы.',
            'Уточните, применим ли экзамен к вашей категории.',
            'Добавьте цель, только если выбрали этот путь.',
          ],
          associated,
          associated[0].admissionsUrl,
          '/exam-goals',
        )
      continue
    }
    const when = goal.targetDate ? `До ${goal.targetDate} · ваша цель, не официальный дедлайн` : timing
    add(
      `${key}:route`,
      'Prepare',
      `Проверьте применимость ${name}`,
      'Личная цель по экзамену не равна требованию университета.',
      [
        'Прочитайте правила выбранных программ.',
        'Проверьте принятые виды экзамена, срок действия и пороги.',
        'Если требования не опубликованы, оставьте их неизвестными.',
      ],
      associated,
      associated[0]?.admissionsUrl ?? resource.url,
      '/exam-goals',
      'До регистрации на экзамен',
    )
    const preparing =
      result.status !== 'completed' ||
      result.score === null ||
      (goal.targetScore !== null && goal.targetScore > result.score)
    if (preparing) {
      add(
        `${key}:diagnostic`,
        'Prepare',
        `Пройдите пробный тест ${name}`,
        resource.guidance,
        [
          'Найдите официальный пробный тест.',
          'Выполните задания в условиях, близких к экзамену.',
          'Сохраните отчёт или заметки.',
        ],
        associated,
        resource.url,
        '/exam-goals',
        when,
        'Пробный результат показывает, что тренировать; он не является официальным сертификатом.',
        'Пробный тест пройден, результаты сохранены.',
      )
      add(
        `${key}:record`,
        'Prepare',
        `Добавьте результаты по разделам ${name}`,
        exam === 'IELTS'
          ? 'Запишите аудирование, чтение, письмо и устную речь в целях по экзаменам. Для письма и речи полезна обратная связь преподавателя.'
          : 'Запишите результаты разделов в учебных заметках. Официальный итог добавьте в цели по экзаменам, когда он появится.',
        [
          'Отделите официальный результат от тренировочного.',
          'Запишите баллы по разделам или предметам.',
          'Неизмеренные баллы оставьте неизвестными.',
        ],
        associated,
        resource.url,
        '/exam-goals',
        'После пробного теста · рекомендация',
      )
      const sectionKey = exam === 'IELTS' ? fingerprint(profile.ieltsSectionScores) : 'subjects'
      const measured =
        exam === 'IELTS'
          ? ieltsSections
              .filter((s) => profile.ieltsSectionScores[s] !== null)
              .sort((a, b) => profile.ieltsSectionScores[a]! - profile.ieltsSectionScores[b]!)
          : []
      add(
        `${key}:weak:${sectionKey}`,
        'Prepare',
        `Выберите один раздел ${name} для улучшения`,
        measured.length
          ? `Самый низкий записанный тренировочный результат: ${ru(measured[0])}. Можно начать с него.`
          : 'Выберите раздел по результатам пробного теста.',
        [
          'Разберите ошибки, а не только общий балл.',
          'Выберите одну повторяющуюся трудность.',
          'Запишите небольшую цель на следующее занятие.',
        ],
        associated,
        resource.url,
        '/exam-goals',
        'После записи результатов · рекомендация',
      )
      add(
        `${key}:practice:${sectionKey}`,
        'Prepare',
        `Запланируйте два занятия по ${name}`,
        `Выберите удобное время.${goal.targetScore !== null ? ` Ваша цель: ${goal.targetScore}; это не подтверждённый проходной балл.` : ''}`,
        [
          'Забронируйте два учебных отрезка в личном календаре.',
          'Потренируйте выбранный раздел на официальных примерах.',
          'После второго занятия оцените результат.',
        ],
        associated,
        resource.url,
        '/exam-goals',
        when,
      )
    } else
      add(
        `${key}:validity`,
        'Prepare',
        `Проверьте срок действия результата ${name}`,
        `Записанный результат: ${result.score}. Уточните правила передачи результата.`,
        [
          'Найдите официальный документ о результате.',
          'Проверьте срок действия для выбранного набора.',
          'Уточните способ отправки результата.',
        ],
        associated,
        resource.url,
        '/exam-goals',
        'До подачи заявки',
      )
  }
  const aetPrograms = selected.filter((p) => p.researchExams.includes('AET'))
  if (aetPrograms.length)
    add(
      `exam:${context}:AET:${fingerprint(profile.exams.AET)}:research`,
      'Prepare',
      'Уточните правила AET',
      'Статус AET в профиле не доказывает выполнение требований. Уточните применимость и формат для своего набора.',
      [
        'Проверьте официальный путь поступления.',
        'Уточните, нужен ли AET для вашей категории.',
        'Сверьте записанный статус с правилами.',
      ],
      aetPrograms,
      aetPrograms[0].admissionsUrl,
      `/universities/${aetPrograms[0].id}`,
    )
  for (const program of selected) {
    if (!factApplies(program.examRequirements, profile)) continue
    for (const requirement of program.examRequirements.value!)
      add(
        `requirement:${context}:${requirement.exam}:${fingerprint([requirement, profile.exams[requirement.exam]])}`,
        'Prepare',
        `Сверьте подтверждённое требование ${examLabel(requirement.exam)}`,
        requirement.minimum === null
          ? 'Точный порог нужно уточнить в источнике.'
          : `В источнике указан минимум ${requirement.minimum}. Проверьте остальные условия.`,
        [
          'Прочитайте условия вокруг указанного порога.',
          'Сравните официальный результат с требованием.',
          'Уточните сроки и способ передачи результата.',
        ],
        selected.filter(
          (p) =>
            factApplies(p.examRequirements, profile) &&
            p.examRequirements.value!.some(
              (r) => r.exam === requirement.exam && r.minimum === requirement.minimum,
            ),
        ),
        program.examRequirements.sourceUrl,
        '/exam-goals',
      )
  }
  for (const activity of activities) {
    const key = `activity:${context}:${activity.id}:${fingerprint([activity.title, activity.category, activity.targetPeriod])}`,
      when = activity.targetPeriod
        ? `${activity.targetPeriod} · ваш целевой период`
        : 'Укажите период в плане портфолио'
    if (activity.status === 'planned')
      add(
        `${key}:scope`,
        'Prepare',
        `Определите результат: ${activity.title}`,
        'Выберите небольшой результат, который сможете показать.',
        [
          'Опишите свою роль.',
          'Выберите результат: демонстрация, отчёт или анализ.',
          'Проверьте условия мероприятия или договоритесь с наставником.',
        ],
        [],
        '/sources',
        '/portfolio',
        when,
      )
    if (activity.status !== 'completed')
      add(
        `${key}:deliver`,
        'Prepare',
        `Сделайте следующий шаг: ${activity.title}`,
        'Выполните небольшую часть работы и зафиксируйте личный вклад.',
        [
          'Выполните ближайшую небольшую задачу.',
          'Сохраните пример работы или запись о вкладе.',
          'Обновите статус в плане портфолио.',
        ],
        [],
        '/sources',
        '/portfolio',
        when,
      )
    add(
      `${key}:reflect`,
      'Prepare',
      `Подведите итог: ${activity.title}`,
      'Портфолио не считается обязательным требованием без подтверждения программы.',
      [
        'Сохраните итоговую работу и опишите личный вклад.',
        'Запишите трудность и способ её решения.',
        'Используйте работу в заявке, только если программа принимает такие материалы.',
      ],
      [],
      '/sources',
      '/portfolio',
      'После завершения активности · рекомендация',
    )
  }
  const stages: RoadmapTask['stage'][] = ['Now', 'Prepare', 'Apply', 'Confirm']
  return [...new Map(tasks.map((task) => [task.id, task])).values()].sort(
    (a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage),
  )
}
export const createRoadmap = (profile: ApplicantProfile, program: Program) =>
  createPlan(profile, [], [], program.id)
