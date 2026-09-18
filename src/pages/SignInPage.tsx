import { useState } from 'react'
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import type { Admission } from '../hooks/useAdmission'
import { api } from '../lib/api'
import { Link, useRouter } from '../lib/router'

export default function SignInPage({
  admission,
  register = false,
  returnPath,
}: {
  admission: Admission
  register?: boolean
  returnPath?: string
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { go } = useRouter()
  async function submit() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const identity = register
        ? await api.register(username.trim().toLowerCase(), password)
        : await api.login(username.trim().toLowerCase(), password)
      const complete = await admission.activateAccount(identity)
      go(complete ? (returnPath ?? '/dashboard') : '/diagnosis', true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось войти. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }
  if (admission.loading) return <p role="status">Проверяем вход…</p>
  if (admission.state.demoSession && admission.state.demoAccount)
    return <Link href={admission.state.profile ? '/profile' : '/diagnosis'}>Продолжить в своём аккаунте</Link>
  return (
    <div className="sign-in-layout auth-page">
      <section className="panel sign-in-panel auth-panel">
        <span className="pill">Личный аккаунт</span>
        <h1>{register ? 'Создать аккаунт' : 'Войти'}</h1>
        <p>
          {register
            ? 'После создания аккаунта откроется короткая анкета: расскажите о классе, интересах и планах поступления.'
            : 'Продолжите сохранённый маршрут или вернитесь к незаконченной анкете.'}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          aria-busy={busy}
        >
          <label>
            Имя пользователя
            <input
              type="text"
              required
              autoComplete="username"
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-describedby="auth-note"
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={register ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <p id="auth-note" className="muted">
            Имя: 3–50 латинских букв, цифр или _. Пароль: 8–128 символов. Ответы сохраняются в аккаунте.
          </p>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy} type="submit">
            <Mail size={18} />
            {busy ? 'Открываем профиль…' : register ? 'Создать аккаунт' : 'Войти'}
            <ArrowRight size={18} />
          </button>
        </form>
        <div className="info-note">
          <ShieldCheck size={20} />
          <p>
            Вход по имени пользователя и паролю. Восстановление пароля и вход через Google пока не подключены.
          </p>
        </div>
        <Link href={register ? '/sign-in' : '/register'}>
          {register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать аккаунт'}
        </Link>
      </section>
      <aside>
        <span className="eyebrow">ВАШ СЛЕДУЮЩИЙ ШАГ</span>
        <h2>От интереса — к понятному плану.</h2>
        <p>
          Ваши ответы доступны после входа с другого устройства. Дополнительные планы пока доступны только до
          обновления страницы.
        </p>
        <ol>
          <li>Расскажите о себе</li>
          <li>Проверьте рекомендации</li>
          <li>Выберите университеты</li>
          <li>Следуйте своему маршруту</li>
        </ol>
        <Link href="/">Вернуться на главную</Link>
      </aside>
    </div>
  )
}
