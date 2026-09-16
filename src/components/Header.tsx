import { Menu, ChevronRight } from 'lucide-react'
import type { AdmissionController } from '../hooks/useAdmission'

type Props = Pick<
  AdmissionController,
  'setProfileOpen' | 'mobileOpen' | 'setMobileOpen' | 'profile' | 'title'
>

export default function Header({ setProfileOpen, mobileOpen, setMobileOpen, profile, title }: Props) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Открыть меню"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
        <span className="breadcrumb-root">Моё пространство</span>
        <ChevronRight size={14} />
        <strong>{title}</strong>
      </div>
      <div className="topbar-right">
        <span className="intake">
          <span />
          Набор {profile.year}
        </span>
        <span className="topbar-divider" />
        <button
          className="avatar small-avatar"
          onClick={() => setProfileOpen(true)}
          aria-label="Редактировать профиль"
        >
          {profile.name.slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  )
}
