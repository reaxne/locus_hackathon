import { ArrowRight, GitCompareArrows, SlidersHorizontal, Search } from 'lucide-react'
import { countries, programName } from '../model'
import type { AdmissionController } from '../hooks/useAdmission'
import DemoDataNote from '../components/DemoDataNote'
import ProgramGrid from '../components/ProgramGrid'

type Props = Pick<
  AdmissionController,
  | 'setProfileOpen'
  | 'setDetails'
  | 'query'
  | 'setQuery'
  | 'countryFilter'
  | 'setCountryFilter'
  | 'profile'
  | 'comparison'
  | 'recommendations'
  | 'navigate'
  | 'toggleCompare'
>

export default function ProgramsPage({
  setProfileOpen,
  setDetails,
  query,
  setQuery,
  countryFilter,
  setCountryFilter,
  profile,
  comparison,
  recommendations,
  navigate,
  toggleCompare,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">МЕСТО ДЛЯ ТВОИХ АМБИЦИЙ</div>
          <h1>
            Найди своё направление<span className="lime-period">.</span>
          </h1>
          <p>Объяснимый подбор по интересам, стране, бюджету, оценкам и языку.</p>
        </div>
        <button className="button secondary" onClick={() => setProfileOpen(true)}>
          <SlidersHorizontal size={17} />
          Настроить профиль
        </button>
      </div>
      <div className="filters">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Поиск программ"
            placeholder="Университет, город или направление"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Фильтр по стране"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option>Все страны</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="muted small">По совпадению с профилем</span>
      </div>
      {(() => {
        const filtered = recommendations.filter(
          (r) =>
            (countryFilter === 'Все страны' || r.university.country === countryFilter) &&
            `${r.university.name} ${r.university.city} ${r.university.fields.join(' ')} ${r.university.fields.map(programName).join(' ')}`
              .toLowerCase()
              .includes(query.toLowerCase().trim()),
        )
        return filtered.length ? (
          <ProgramGrid
            items={filtered}
            profile={profile}
            comparison={comparison}
            toggleCompare={toggleCompare}
            setDetails={setDetails}
          />
        ) : (
          <div className="empty-state">
            <Search size={32} />
            <h2>Пока ничего не нашлось</h2>
            <p>Попробуй другой запрос или выбери все страны.</p>
            <button
              className="button secondary"
              onClick={() => {
                setQuery('')
                setCountryFilter('Все страны')
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        )
      })()}
      <DemoDataNote />
      {comparison.length > 0 && (
        <div className="compare-bar">
          <span>
            <GitCompareArrows size={20} />В сравнении: <strong>{comparison.length} из 3</strong>
          </span>
          <button className="button dark" onClick={() => navigate('compare')}>
            Сравнить программы
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </>
  )
}
