import { ArrowUpRight, ArrowRight, GraduationCap, ChevronDown, CircleHelp, MoveUpRight } from 'lucide-react'
import type { AdmissionController } from '../hooks/useAdmission'
import { navigation } from '../navigation'

type Props = Pick<
  AdmissionController,
  'view' | 'setProfileOpen' | 'setHelpOpen' | 'mobileOpen' | 'profile' | 'comparison' | 'isDemo' | 'navigate'
>

export default function Sidebar({
  view,
  setProfileOpen,
  setHelpOpen,
  mobileOpen,
  profile,
  comparison,
  isDemo,
  navigate,
}: Props) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Основная навигация">
      <a href="#overview" className="brand" onClick={() => navigate('overview')}>
        <span className="brand-symbol">
          <ArrowUpRight size={30} strokeWidth={2.8} />
        </span>
        вектор<span className="brand-dot">.</span>
      </a>
      <div className="workspace">
        <span className="workspace-icon">
          <GraduationCap size={20} />
        </span>
        <div>
          <strong>Моё поступление</strong>
          <span>Бакалавриат · {profile.year}</span>
        </div>
      </div>
      <div className="nav-label">ТВОЁ ПРОСТРАНСТВО</div>
      <nav>
        {navigation.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault()
              navigate(id)
            }}
            className={`nav-item ${view === id ? 'active' : ''}`}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={19} />
            {label}
            {id === 'compare' && comparison.length > 0 && (
              <span className="nav-count">{comparison.length}</span>
            )}
            {id === 'roadmap' && <span className="nav-dot" />}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <div className="tip-symbol">
            <MoveUpRight size={23} />
          </div>
          <strong>
            Твоё будущее начинается
            <br />с одного шага.
          </strong>
          <p>
            Не обязательно знать весь путь.
            <br />
            Достаточно начать.
          </p>
          <button onClick={() => navigate('roadmap')}>
            К моему маршруту
            <ArrowRight size={16} />
          </button>
        </div>
        <button className="help-button" onClick={() => setHelpOpen(true)}>
          <CircleHelp size={18} />
          Как работает Вектор
          <ArrowUpRight size={15} />
        </button>
        <button className="sidebar-profile" onClick={() => setProfileOpen(true)}>
          <span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{profile.name}</strong>
            <small>{isDemo ? 'Демо-профиль' : 'Личный профиль'}</small>
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    </aside>
  )
}
