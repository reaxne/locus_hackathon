import { test, expect, type Page } from '@playwright/test'
import { demoProfile } from '../src/lib/persistence'
import { questionIds } from '../src/lib/profile'
import { toSurvey } from '../src/lib/api'

const password = 'correct horse battery staple'
const headers = { Origin: 'http://127.0.0.1:3100', 'X-Locus-Request': '1' }
const email = () => `student_${crypto.randomUUID().replaceAll('-', '')}`
async function saved(page: Page) {
  await expect(page.locator('main[data-save-status]')).toHaveAttribute('data-save-status', 'saved')
}
async function register(page: Page, address = email()) {
  await page.goto('/register')
  await page.getByLabel('Имя пользователя', { exact: true }).fill(address)
  await page.getByLabel('Пароль', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click()
  await expect(page).toHaveURL(/\/diagnosis$/)
  return address
}
async function seed(page: Page) {
  const username = email()
  const response = await page.request.post('/api/auth/register', {
    headers,
    data: { username, password },
  })
  expect(response.status()).toBe(201)
  const user = await response.json()
  expect(
    (await page.request.post('/api/auth/login', { headers, data: { username, password } })).status(),
  ).toBe(200)
  const profile = demoProfile()
  const result = await page.request.post('/api/survey', {
    headers: { ...headers, 'X-Locus-User': String(user.id) },
    data: {
      survey: toSurvey(profile),
      state: { profile, draft: profile, revision: 0, draftStep: 17, answeredQuestions: questionIds },
    },
  })
  expect(result.status()).toBe(200)
  await page.goto('/profile')
  await saved(page)
}

test('new account starts questionnaire, saves to PostgreSQL, resumes after login', async ({ page }) => {
  const address = await register(page)
  await expect(page.getByRole('heading', { name: 'В каком вы классе?' })).toBeVisible()
  await page.getByRole('button', { name: '9 класс', exact: true }).click()
  await page.getByLabel('Год поступления', { exact: true }).fill('2029')
  await saved(page)
  await page.reload()
  await expect(page.getByLabel('Год поступления', { exact: true })).toHaveValue('2029')
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await register(page)
  await expect(page.getByRole('heading', { name: 'В каком вы классе?' })).toBeVisible()
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/sign-in')
  await page.getByLabel('Имя пользователя', { exact: true }).fill(address)
  await page.getByLabel('Пароль', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByLabel('Год поступления', { exact: true })).toHaveValue('2029')
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('complete questionnaire submits and profile edits persist', async ({ page }) => {
  await register(page)
  await page.getByRole('button', { name: '11 класс', exact: true }).click()
  await page.getByLabel('Год поступления', { exact: true }).fill('2027')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  for (const name of [
    'Разработка программного обеспечения',
    'В основном хорошие оценки',
    'Английский',
    'Астана',
    'Готовы рассматривать другие города',
  ])
    await page.getByRole('button', { name, exact: true }).click()
  await page.getByLabel('Бюджет в год, тенге').fill('3000000')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await page.getByRole('button', { name: 'Рассматриваю оба варианта', exact: true }).click()
  await page.getByRole('button', { name: 'Гражданин Казахстана', exact: true }).click()
  await page.getByRole('button', { name: 'Пропустить', exact: true }).click()
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Не указано', exact: true }).click()
  await page.getByRole('button', { name: 'Пропустить', exact: true }).click()
  await page.getByLabel('Важные условия').fill('Need accommodation')
  await page.getByRole('button', { name: 'Посмотреть диагностику', exact: true }).click()
  await expect(page).toHaveURL(/\/analysis$/)
  await saved(page)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Изменить: Язык обучения', exact: true }).click()
  await page.getByRole('button', { name: 'Русский', exact: true }).click()
  await saved(page)
  await page.reload()
  await expect(page.locator('main')).toContainText('Русский')
  const remote = await (await page.request.get('/api/survey')).json()
  expect(remote.state.profile.studyLanguage).toBe('ru')
  expect(remote.state.profile.constraints).toBe('Need accommodation')
  await page.goto('/universities')
  const recommendations = await (await page.request.get('/api/recommendations?limit=50')).json()
  await expect(page.locator('.program-card')).toHaveCount(recommendations.recommendations.length)
  if (recommendations.recommendations.length)
    await expect(page.locator('.program-card').first()).toHaveAttribute(
      'data-program',
      recommendations.recommendations[0].programId,
    )
})

test('failed save is visible and retry persists the edit', async ({ page }) => {
  await seed(page)
  await page.route('**/api/survey', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({ status: 503, json: { detail: 'test outage' } })
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Изменить: Язык обучения', exact: true }).click()
  await page.getByRole('button', { name: 'Русский', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Не удалось сохранить')
  await page.unroute('**/api/survey')
  await page.getByRole('button', { name: 'Повторить сохранение' }).click()
  await saved(page)
  await page.reload()
  await expect(page.locator('main')).toContainText('Русский')
})

test('stale tab cannot overwrite another tab and both themes remain usable', async ({ page }) => {
  await seed(page)
  const remote = await (await page.request.get('/api/survey', { headers })).json()
  const changed = { ...remote.state.profile, studyLanguage: 'kk' }
  const result = await page.request.post('/api/survey', {
    headers: { ...headers, 'X-Locus-User': remote.userId },
    data: {
      survey: toSurvey(changed),
      state: {
        profile: changed,
        draft: changed,
        revision: remote.revision,
        draftStep: 17,
        answeredQuestions: questionIds,
      },
    },
  })
  expect(result.status()).toBe(200)
  await page.getByRole('button', { name: 'Изменить: Язык обучения', exact: true }).click()
  await page.getByRole('button', { name: 'Русский', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('другой вкладке')
  await page.getByRole('button', { name: /Загрузить серверную версию/ }).click()
  await saved(page)
  await expect(page.locator('main')).toContainText('Казахский')
  await page.getByRole('button', { name: 'Включить светлую тему' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
