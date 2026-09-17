import { useState } from 'react'
import { ArrowRight, GitCompareArrows, X } from 'lucide-react'
import { interests, type ApplicantProfile, type MatchGroup } from '../types'
import { factApplies } from '../data/universities'
import { ru } from '../lib/labels'
import type { Admission } from '../hooks/useAdmission'
import ProgramCard from '../components/ProgramCard'
import { Empty, Notice, PageHeading } from '../components/Shared'
import { Link } from '../lib/router'
import ProfileSummary from '../components/ProfileSummary'

export default function MatchesPage({ admission }: { admission: Admission }) {
  const { programs, universities } = admission
  const [query, setQuery] = useState('')
  const [universityFilter, setUniversityFilter] = useState('all')
  const [budgetFilter, setBudgetFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [requirementsFilter, setRequirementsFilter] = useState('all')
  const profile = admission.state.profile
  if (!profile)
    return (
      <Empty title="Подбор начинается с вашей анкеты">Заполните анкету для подбора по вашим ответам.</Empty>
    )
  const visible = admission.recommendations.filter(
    (match) =>
      `${match.program.title.value} ${match.university.name} ${match.university.shortName}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (universityFilter === 'all' || match.university.id === universityFilter) &&
      (budgetFilter === 'all' || match.group === budgetFilter) &&
      (cityFilter === 'all' || match.university.city === cityFilter) &&
      (languageFilter === 'all' ||
        (languageFilter === 'unknown'
          ? !factApplies(match.program.language, profile)
          : factApplies(match.program.language, profile) &&
            match.program.language.value === languageFilter)) &&
      (requirementsFilter === 'all' ||
        (requirementsFilter === 'verified'
          ? factApplies(match.program.examRequirements, profile)
          : !factApplies(match.program.examRequirements, profile))),
  )
  const hasFilters = Boolean(
    query ||
    [universityFilter, budgetFilter, cityFilter, languageFilter, requirementsFilter].some(
      (value) => value !== 'all',
    ),
  )
  function resetFilters() {
    setQuery('')
    setUniversityFilter('all')
    setBudgetFilter('all')
    setCityFilter('all')
    setLanguageFilter('all')
    setRequirementsFilter('all')
  }
  return (
    <>
      <PageHeading
        eyebrow="ВАШ ВЫБОР"
        title="Найти университет"
        description="Изучите программы, проверьте требования и сравните два или три варианта."
        back="/roadmap"
      >
        <Link className="button secondary" href="/profile">
          Изменить анкету
        </Link>
      </PageHeading>
      <details className="panel search-profile-summary">
        <summary>Ваша анкета · проверьте или измените любой ответ</summary>
        <ProfileSummary admission={admission} compact />
      </details>
      <section className="match-controls panel" aria-label="Уточнить рекомендации">
        <label>
          Главное направление
          <select
            aria-label="Главное направление"
            value={profile.interest}
            onChange={(e) =>
              admission.updateProfile({ interest: e.target.value as ApplicantProfile['interest'] })
            }
          >
            {interests.map((interest) => (
              <option key={interest} value={interest}>
                {ru(interest)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Бюджет на год (₸)
          <input
            type="number"
            min="0"
            max="100000000"
            placeholder="Пока неизвестно"
            value={profile.budget ?? ''}
            onChange={(e) => {
              const budget = e.target.value === '' ? null : Number(e.target.value)
              if (budget === null || (budget >= 0 && budget <= 100000000)) admission.updateProfile({ budget })
            }}
          />
        </label>
        <label>
          Поиск программы
          <input
            type="search"
            placeholder="Университет или программа"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </section>
      <div className="search-filters">
        <label>
          Университет
          <select
            aria-label="Университет"
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
          >
            <option value="all">Все университеты</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Проверка бюджета
          <select
            aria-label="Проверка бюджета"
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
          >
            <option value="all">Любой бюджет</option>
            {(['Fits your verified budget', 'Needs verification', 'Over budget'] as const).map((group) => (
              <option key={group} value={group}>
                {ru(group)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Город
          <select
            aria-label="Город каталога"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">Все города</option>
            {[...new Set(universities.map((uni) => uni.city))].map((city) => (
              <option key={city} value={city}>
                {ru(city)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Язык обучения
          <select
            aria-label="Язык обучения в каталоге"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="all">Любой язык</option>
            {[
              ...new Set(
                programs
                  .filter((program) => factApplies(program.language, profile))
                  .map((program) => program.language.value!),
              ),
            ].map((language) => (
              <option key={language} value={language}>
                {ru(language)}
              </option>
            ))}
            <option value="unknown">Нужно уточнить</option>
          </select>
        </label>
        <label>
          Статус требований
          <select
            aria-label="Статус требований"
            value={requirementsFilter}
            onChange={(e) => setRequirementsFilter(e.target.value)}
          >
            <option value="all">Любой статус</option>
            <option value="verified">Подтверждены для моего года</option>
            <option value="unknown">Нужно уточнить</option>
          </select>
        </label>
        <button className="text-button" onClick={resetFilters}>
          Сбросить фильтры
        </button>
      </div>
      <Notice>
        Это варианты для изучения, а не решение о зачислении. Стоимость и правила нужно проверить на{' '}
        {profile.entryYear} год. <Link href="/sources">Как работает подбор</Link>
      </Notice>
      <div className="section-meta">
        <span>
          {visible.length} программ · {new Set(visible.map((m) => m.university.id)).size} университетов
        </span>
        <span>Сначала варианты, наиболее близкие вашим предпочтениям</span>
      </div>
      {visible.length > 0 ? (
        (['Fits your verified budget', 'Needs verification', 'Over budget'] as MatchGroup[]).map((group) => {
          const members = visible.filter((match) => match.group === group)
          if (!members.length) return null
          return (
            <section className="match-group" key={group} aria-label={ru(group)}>
              <div className="group-heading">
                <h2>{ru(group)}</h2>
                <span>{members.length} вариантов</span>
              </div>
              <div className="program-grid">
                {members.map((match) => (
                  <ProgramCard key={match.program.id} match={match} admission={admission} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <section className="empty panel">
          <h2>По этим фильтрам ничего не найдено</h2>
          <p>
            {hasFilters
              ? 'Попробуйте изменить университет, запрос или бюджет.'
              : admission.recommendationWarnings.join(' ') ||
                'Сервер не вернул подходящих программ для вашей анкеты.'}
          </p>
          <div className="button-row">
            {hasFilters ? (
              <button className="button secondary" onClick={resetFilters}>
                Очистить поиск
              </button>
            ) : (
              <button
                className="button secondary"
                onClick={() => admission.updateProfile({ city: 'Any city', mustStay: false })}
              >
                Показать все варианты · снять ограничение по городу
              </button>
            )}
            <Link className="button primary" href="/profile">
              Изменить анкету
            </Link>
          </div>
        </section>
      )}
      {visible.length > 0 && !visible.some((m) => m.group === 'Fits your verified budget') && (
        <Notice>
          Нет программы с подтверждённой ценой в пределах бюджета для вашего года и категории. Неизвестную
          стоимость нужно уточнить. <Link href="/profile">Проверить бюджет</Link>.
        </Notice>
      )}
      <section className="dashboard-invitation">
        <div>
          <span className="eyebrow">СЛЕДУЮЩИЙ ШАГ</span>
          <h2>От выбора — к плану действий.</h2>
          <p>Сохранённые университеты и ваши цели определяют следующие шаги.</p>
        </div>
        <Link className="button primary" href="/roadmap">
          Мой маршрут
          <ArrowRight size={17} />
        </Link>
      </section>
      <div className="comparison-tray">
        <div className="tray-summary">
          <GitCompareArrows size={22} />
          <div>
            <strong>{admission.state.comparison.length} выбрано</strong>
            <small>Выберите 2–3 для сравнения</small>
          </div>
        </div>
        <div className="tray-chips">
          {admission.state.comparison.map((id) => {
            const program = programs.find((p) => p.id === id)!
            const uni = universities.find((u) => u.id === program.universityId)!
            return (
              <button
                key={id}
                onClick={() => admission.toggleCompare(id)}
                title={`Убрать ${uni.shortName} ${program.title.value}`}
                aria-label={`Убрать ${uni.shortName} ${program.title.value} из сравнения`}
              >
                {uni.shortName} · {program.code ?? 'CS'}
                <X size={13} />
              </button>
            )
          })}
        </div>
        <Link className="button primary" href="/compare">
          Сравнить программы
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  )
}
