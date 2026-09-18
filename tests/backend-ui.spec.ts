import { test, expect, type Page } from '@playwright/test'
import { emptyProfile } from '../src/lib/persistence'
import { questionIds } from '../src/lib/profile'
import { backendMatch, backendResponse } from './fixtures/recommendations'

async function mockAccount(page: Page) {
  let profile = { ...emptyProfile(), entryYear: 2027 }
  let revision = 1
  const calls: string[] = []
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    calls.push(`${route.request().method()} ${url.pathname}`)
    if (url.pathname === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'tester' } })
    if (url.pathname === '/api/survey') {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON()
        expect(route.request().headers()['x-locus-user']).toBe('1')
        expect(payload.state.revision).toBe(revision)
        profile = payload.state.profile
        revision++
      }
      return route.fulfill({
        json: {
          userId: '1',
          revision,
          survey: {},
          state: {
            profile,
            draft: profile,
            draftStep: 17,
            answeredQuestions: questionIds,
            revision,
          },
        },
      })
    }
    if (url.pathname === '/api/recommendations') return route.fulfill({ json: backendResponse() })
    if (url.pathname === '/api/ai/roadmap' || url.pathname === '/api/ai/recommendations')
      return route.fulfill({ json: backendResponse() })
    throw new Error(`Unexpected API call ${url.pathname}`)
  })
  return calls
}

test('renders backend programs, comparison and roadmap without a local catalog', async ({ page }) => {
  await mockAccount(page)
  await page.goto('/universities')
  await expect(page.locator('.program-card')).toHaveCount(1)
  await expect(page.locator('.program-card')).toHaveAttribute('data-program', 'api-only-program')
  await expect(page.locator('.program-card')).toContainText('Причина из backend')
  await page.getByRole('button', { name: /Сравнить Тестовый университет/ }).click()
  await expect(page.locator('.tray-chips')).toContainText('Тестовый университет')
  await page.getByRole('link', { name: 'Подробнее о программе' }).click()
  await expect(page.getByRole('heading', { name: 'Программа api-only-program' })).toBeVisible()
  await page.getByRole('link', { name: 'Мой маршрут', exact: true }).first().click()
  await expect(page.locator('.route-task h3')).toHaveText('Шаг из backend')
  await expect(page.locator('#next-action-title')).toHaveText('Шаг из backend')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('saves edits without remounting search; refresh is explicit', async ({ page }) => {
  const calls = await mockAccount(page)
  await page.goto('/universities')
  await expect(page.locator('.program-card')).toHaveCount(1)
  await page.getByRole('searchbox', { name: 'Поиск программы' }).fill('api-only')
  calls.length = 0
  await page.getByLabel('Бюджет на год (₸)').fill('123456')
  await expect.poll(() => calls.includes('POST /api/survey')).toBe(true)
  await expect(page.getByRole('searchbox', { name: 'Поиск программы' })).toHaveValue('api-only')
  expect(calls.includes('GET /api/recommendations')).toBe(false)
  await page.getByRole('button', { name: 'Обновить подбор', exact: true }).click()
  await expect.poll(() => calls.includes('GET /api/recommendations')).toBe(true)
  expect(calls.indexOf('POST /api/survey')).toBeLessThan(calls.indexOf('GET /api/recommendations'))
  await expect(page.getByRole('searchbox', { name: 'Поиск программы' })).toHaveValue('api-only')
})

test('shows API errors, retries, and never replaces an empty response with local results', async ({
  page,
}) => {
  await mockAccount(page)
  let failing = true
  await page.route('**/api/recommendations?*', (route) =>
    route.fulfill(failing ? { status: 503, json: { detail: 'Offline' } } : { json: backendResponse([]) }),
  )
  await page.goto('/universities')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.locator('.program-card')).toHaveCount(0)
  failing = false
  await page.getByRole('button', { name: 'Повторить загрузку' }).click()
  await expect(page.getByRole('heading', { name: 'Найти университет' })).toBeVisible()
  await expect(page.locator('.program-card')).toHaveCount(0)
})

test('keeps search results stable while roadmap updates after profile changes', async ({ page }) => {
  await mockAccount(page)
  let release!: () => void
  let count = 0
  const delayed = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/recommendations?*', async (route) => {
    const requestNumber = ++count
    if (requestNumber === 1) await delayed
    await route.fulfill({ json: backendResponse([backendMatch(requestNumber === 1 ? 'stale' : 'fresh')]) })
  })
  await page.goto('/profile')
  await expect.poll(() => count).toBe(1)
  await page.getByRole('button', { name: 'Изменить: Язык обучения', exact: true }).click()
  await page.getByRole('button', { name: 'Русский', exact: true }).click()
  release()
  await page.getByRole('link', { name: 'Найти университет', exact: true }).first().click()
  await expect(page.locator('.program-card')).toHaveAttribute('data-program', 'stale')
  expect(count).toBe(1)
  await page.getByRole('button', { name: 'Обновить подбор', exact: true }).click()
  await expect.poll(() => count).toBe(2)
  await expect(page.locator('.program-card')).toHaveAttribute('data-program', 'fresh')
})

test('locks later goals and advances the quick current-goal control', async ({ page }) => {
  await mockAccount(page)
  const item = backendMatch()
  item.roadmap.push({ ...item.roadmap[0], id: 'second', title: 'Второй шаг' })
  await page.route('**/api/ai/roadmap', (route) => route.fulfill({ json: backendResponse([item]) }))
  await page.goto('/roadmap')
  await expect(page.getByRole('combobox', { name: 'Статус: Шаг из backend', exact: true })).toBeEnabled()
  await expect(page.getByRole('combobox', { name: 'Статус: Второй шаг' })).toBeDisabled()
  await page.getByRole('button', { name: 'Открыть текущую цель' }).click()
  await page.getByRole('button', { name: 'Выполнено', exact: true }).click()
  await expect(page.locator('#next-action-title')).toHaveText('Второй шаг')
  await expect(page.getByRole('combobox', { name: 'Статус: Второй шаг' })).toBeEnabled()
})

test('profile AI explains evidence and shows provider failure without invented insights', async ({ page }) => {
  await mockAccount(page)
  let available = false
  await page.route('**/api/ai/profile', (route) => route.fulfill({ json: {
    ai: { status: available ? 'generated' : 'unavailable', model: null, cached: false },
    analysis: available ? {
      strengths: [{ title: 'Интерес к программированию', evidence: 'Вы выбрали разработку.', evidence_fields: ['student.interest'], why: 'Можно начать с небольшого проекта.', actions: ['Выберите задачу.', 'Создайте прототип.', 'Запишите выводы.'] }],
      weaknesses: [], unknowns: ['Уточните результаты экзаменов.'],
    } : null,
  } }))
  await page.goto('/profile')
  const section = page.getByRole('region', { name: 'Анализ профиля с ИИ' })
  await section.getByRole('button', { name: 'Проанализировать профиль с ИИ' }).click()
  await expect(section).toContainText('Бесплатные модели сейчас недоступны')
  await expect(section.getByRole('heading', { name: 'Интерес к программированию' })).toHaveCount(0)
  available = true
  await section.getByRole('button', { name: 'Проанализировать профиль с ИИ' }).click()
  await expect(section).toContainText('Вы выбрали разработку.')
  await expect(section).toContainText('Создайте прототип.')
})
