import { useState } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { Link, useRouter } from '../lib/router'
import { Empty } from '../components/Shared'

export default function SignInPage({ admission }: { admission: Admission }) {
  const [name, setName] = useState(admission.state.demoSession?.displayName ?? '')
  const { go } = useRouter()
  if (!admission.state.profile)
    return (
      <Empty title="Explore your options first" href="/diagnosis" action="Begin diagnosis">
        Your answers will carry through to your personal dashboard.
      </Empty>
    )
  return (
    <div className="sign-in-layout">
      <section className="panel sign-in-panel">
        <span className="pill">Demo sign-in</span>
        <h1>Continue with your plan.</h1>
        <p>
          Your answers, matches and saved options are already here. This demo accepts everyone, including
          guests.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            admission.signIn(name)
            go('/dashboard')
          }}
        >
          <label>
            What should we call you? <span className="muted">Optional</span>
            <input
              autoComplete="nickname"
              maxLength={40}
              placeholder="Student"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className="button primary" type="submit">
            Enter demo dashboard
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="info-note">
          <ShieldCheck size={18} />
          <div>
            No password, email verification or real account. This local demo does not authenticate anyone or
            sync between devices.
          </div>
        </div>
        <Link href="/universities">Back to universities</Link>
      </section>
      <aside>
        <span className="eyebrow">A PLACE FOR YOUR NEXT STEPS</span>
        <h2>Your shortlist is just the beginning.</h2>
        <p>Keep university options, portfolio activities, exam targets and the next action in one place.</p>
        <ul className="plain-list">
          <li>Personal university labels</li>
          <li>Portfolio outcomes you can work toward</li>
          <li>Small steps that change with your plans</li>
        </ul>
      </aside>
    </div>
  )
}
