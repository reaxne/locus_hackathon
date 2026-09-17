import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import App from './App'
import './styles.css'
import { Router } from './lib/router'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="empty panel">
          <h1>Something went wrong.</h1>
          <p>Your saved progress is still on this device. Reload to try again.</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </main>
      )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </React.StrictMode>,
)
