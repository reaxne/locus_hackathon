import { useAdmission } from './hooks/useAdmission'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import ProfileForm from './components/ProfileForm'
import ProgramDetailsDialog from './components/ProgramDetailsDialog'
import HelpDialog from './components/HelpDialog'
import Toast from './components/Toast'
import OverviewPage from './pages/OverviewPage'
import ProfilePage from './pages/ProfilePage'
import ProgramsPage from './pages/ProgramsPage'
import ComparePage from './pages/ComparePage'
import RoadmapPage from './pages/RoadmapPage'

export default function App() {
  const admission = useAdmission()
  const {
    view,
    mobileOpen,
    setMobileOpen,
    storageError,
    profileOpen,
    profile,
    saveProfile,
    setProfileOpen,
    details,
    helpOpen,
    toast,
  } = admission

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      {mobileOpen && (
        <button className="sidebar-overlay" aria-label="Закрыть меню" onClick={() => setMobileOpen(false)} />
      )}
      <Sidebar {...admission} />
      <div className="main-shell">
        <Header {...admission} />
        <main id="main" tabIndex={-1}>
          {storageError && (
            <div role="alert" className="storage-warning">
              Браузер не разрешает сохранение. Можно продолжить, но после перезагрузки изменения будут
              потеряны.
            </div>
          )}
          {view === 'overview' && <OverviewPage {...admission} />}
          {view === 'profile' && <ProfilePage {...admission} />}
          {view === 'programs' && <ProgramsPage {...admission} />}
          {view === 'compare' && <ComparePage {...admission} />}
          {view === 'roadmap' && <RoadmapPage {...admission} />}
          <Footer {...admission} />
        </main>
      </div>
      {profileOpen && (
        <ProfileForm profile={profile} onSave={saveProfile} onClose={() => setProfileOpen(false)} />
      )}
      {details && <ProgramDetailsDialog {...admission} university={details} />}
      {helpOpen && <HelpDialog {...admission} />}
      {toast && <Toast {...admission} />}
    </div>
  )
}
