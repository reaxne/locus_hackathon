import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function sample(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore a sample path' }).click()
}
async function dismiss(page: Page) {
  const button = page.getByRole('button', { name: 'Dismiss notification' })
  if (await button.isVisible()) await button.click()
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}
async function dashboard(page: Page, name = '') {
  await page.getByRole('link', { name: 'Continue to my dashboard' }).click()
  await expect(page.locator('input[type=password]')).toHaveCount(0)
  if (name) await page.getByLabel('What should we call you?').fill(name)
  await page.getByRole('button', { name: 'Enter demo dashboard' }).click()
  await expect(page.getByRole('heading', { name: `Welcome, ${name || 'Student'}.` })).toBeVisible()
}
async function workspace(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Dashboard navigation' })
    .getByRole('link', { name, exact: true })
    .click()
}

test('progressive diagnosis, editable answers, search, details, comparison and demo dashboard', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('link', { name: 'Build my path', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What grade are you in?')
  await page.screenshot({ path: `tmp/screenshots/${info.project.name}-diagnosis-v3.png`, fullPage: true })
  await page.getByRole('button', { name: 'Grade 11', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Grade 11', exact: true })).toHaveCount(0)
  await page.getByLabel('Intended entry year').fill('2027')
  await page.reload()
  await expect(page.getByLabel('Intended entry year')).toHaveValue('2027')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Grade 11', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Software engineering', exact: true }).click()
  await page.getByRole('button', { name: 'Astana', exact: true }).click()
  await page.getByRole('button', { name: /Flexible preference/ }).click()
  await page.getByLabel('Annual tuition budget').fill('3000000')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Open to either option', exact: true }).click()
  await page.getByRole('button', { name: 'Kazakhstan citizen', exact: true }).click()
  await page.getByLabel('Mathematics', { exact: true }).check()
  await page.getByLabel('Programming', { exact: true }).check()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  for (const status of ['Unknown', 'Planned', 'Unknown', 'Planned', 'Unknown'])
    await page.getByRole('button', { name: status, exact: true }).click()
  await page.getByLabel('Personal Projects', { exact: true }).check()
  await page.getByRole('button', { name: 'Show my universities' }).click()
  await expect(page).toHaveURL(/\/universities$/)
  await expect(page.locator('.program-card')).toHaveCount(5)
  await page.getByLabel('University', { exact: true }).selectOption('nu')
  await expect(page.locator('.program-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Reset search filters' }).click()
  await page.getByLabel('Primary interest', { exact: true }).selectOption('Cybersecurity')
  await expect(page.locator('.program-card').first()).toHaveAttribute('data-program', 'aitu-cyber')
  await page.locator('[data-program="nu-cs"]').getByLabel('Personal university label').selectOption('Dream')
  await page.locator('[data-program="nu-cs"]').getByRole('link', { name: 'View program details' }).click()
  await expect(page.getByRole('heading', { name: 'Required documents' })).toBeVisible()
  await expect(page.locator('.details-facts')).toContainText('Check official site')
  await expect(page.locator('.portfolio-examples')).toContainText('no verified public examples')
  await noOverflow(page)
  await page.getByRole('link', { name: 'Back', exact: true }).click()
  await page.locator('[data-program="nu-cs"] .compare-toggle').click()
  await page.locator('[data-program="aitu-cs"] .compare-toggle').click()
  await page.getByRole('link', { name: 'Compare programs', exact: true }).click()
  await expect(page.locator('.compare-card')).toHaveCount(2)
  await noOverflow(page)
  await page.getByRole('button', { name: 'Choose a focus', exact: true }).first().click()
  await dismiss(page)
  await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.goto('/universities')
  await dashboard(page, 'Dana')
  await page.screenshot({ path: `tmp/screenshots/${info.project.name}-dashboard-v3.png`, fullPage: true })
  await workspace(page, 'Profile')
  await expect(page.locator('.profile-summary')).toContainText('Mathematics, Programming')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export my profile as JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('admission-profile.json')
  const data = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(data.profile.grade).toBe(11)
  expect(data.profile.interest).toBe('Cybersecurity')
  expect(data.profile.exams.IELTS.score).toBeNull()
  await page.getByRole('button', { name: 'Edit Primary interest' }).click()
  await page.getByRole('button', { name: 'AI & data', exact: true }).click()
  await workspace(page, 'Universities')
  await expect(page.locator('.program-card').first()).toHaveAttribute('data-program', 'aitu-cs')
  await workspace(page, 'My University List')
  await expect(page.locator('.saved-program')).toHaveCount(1)
  await page.getByLabel('Personal university label').selectOption('Priority')
  await page.reload()
  await expect(page.getByLabel('Personal university label')).toHaveValue('Priority')
  await page.getByRole('button', { name: 'Remove from my university list' }).click()
  await expect(page.getByRole('heading', { name: 'Your list is ready for its first option' })).toBeVisible()
  expect(errors).toEqual([])
})

test('portfolio activities and IELTS goals create granular steps and invalidate obsolete completion', async ({
  page,
}, info) => {
  await sample(page)
  await dashboard(page)
  await workspace(page, 'Portfolio Plan')
  await page.getByLabel('Category filter').selectOption('Personal Projects')
  await expect(page.locator('.activity-idea')).toHaveCount(1)
  await page.getByRole('button', { name: 'Add activity', exact: true }).click()
  await expect(page.locator('.planned-activity')).toHaveCount(1)
  await page.locator('.planned-activity').getByLabel('Target period').fill('October 2026')
  await page.locator('.planned-activity').getByLabel('Progress', { exact: true }).selectOption('in-progress')
  await page.screenshot({ path: `tmp/screenshots/${info.project.name}-portfolio-v3.png`, fullPage: true })
  await workspace(page, 'Exam Goals')
  await page.getByLabel('IELTS target score', { exact: true }).fill('7.5')
  await page.getByLabel('IELTS target date', { exact: true }).fill('2027-05-01')
  await page.getByRole('button', { name: 'Save IELTS goal', exact: true }).click()
  await page.getByLabel('Listening', { exact: true }).fill('7')
  await page.getByLabel('Reading', { exact: true }).fill('6.5')
  await page.getByLabel('Writing', { exact: true }).fill('5.5')
  await page.getByLabel('Speaking', { exact: true }).fill('6')
  await page.getByRole('button', { name: 'Save section scores' }).click()
  await page.screenshot({ path: `tmp/screenshots/${info.project.name}-exams-v3.png`, fullPage: true })
  await workspace(page, 'Roadmap')
  const diagnostic = page.getByRole('checkbox', {
    name: 'Complete: Take a diagnostic test for IELTS',
    exact: true,
  })
  await expect(diagnostic).toBeVisible()
  await expect(
    page.locator('.task-card').filter({ hasText: 'Choose one IELTS section to improve' }),
  ).toContainText('Writing')
  await page
    .locator('.task-card')
    .filter({ hasText: 'Take a diagnostic test for IELTS' })
    .locator('summary')
    .click()
  await expect(page.getByRole('heading', { name: 'Why this matters', exact: true }).first()).toBeVisible()
  await diagnostic.check()
  await page.reload()
  await expect(diagnostic).toBeChecked()
  await expect(
    page.locator('.task-card').filter({ hasText: 'Make progress: Build a useful school planning app' }),
  ).toBeVisible()
  await workspace(page, 'Exam Goals')
  await page.getByLabel('IELTS target score', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Save IELTS goal', exact: true }).click()
  await workspace(page, 'Roadmap')
  await expect(diagnostic).not.toBeChecked()
  await workspace(page, 'Profile')
  await expect(page.locator('.profile-goals')).toContainText('Target: 8')
  await workspace(page, 'Portfolio Plan')
  await page.locator('.planned-activity').getByLabel('Progress', { exact: true }).selectOption('completed')
  await workspace(page, 'Roadmap')
  await expect(
    page.locator('.task-card').filter({ hasText: 'Make progress: Build a useful school planning app' }),
  ).toHaveCount(0)
  await expect(
    page.locator('.task-card').filter({ hasText: 'Reflect on Build a useful school planning app' }),
  ).toBeVisible()
  await workspace(page, 'Portfolio Plan')
  await page.getByRole('button', { name: 'Remove activity: Build a useful school planning app' }).click()
  await workspace(page, 'Roadmap')
  await expect(
    page.locator('.task-card').filter({ hasText: 'Build a useful school planning app' }),
  ).toHaveCount(0)
  await noOverflow(page)
})

test('strict city edits prune comparison and active tasks but preserve personal bookmarks', async ({
  page,
}) => {
  await sample(page)
  await page.locator('[data-program="nu-cs"]').getByLabel('Personal university label').selectOption('Backup')
  await page.locator('[data-program="nu-cs"] .compare-toggle').click()
  await page.getByRole('link', { name: 'Edit profile', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Preferred city' }).click()
  await page.getByRole('button', { name: 'Almaty', exact: true }).click()
  await page.getByRole('button', { name: 'Edit City constraint' }).click()
  await page.getByRole('button', { name: /Must stay in this city/ }).click()
  await page.getByRole('link', { name: 'See universities' }).click()
  await expect(page.getByRole('heading', { name: 'No options within these filters' })).toBeVisible()
  await expect(page.locator('.tray-summary')).toContainText('0 selected')
  await page.goto('/my-list')
  await expect(page.locator('.saved-program')).toContainText('Outside your current hard city constraint')
  await page.goto('/roadmap')
  await expect(
    page.getByRole('heading', { name: 'Check the admissions route at NU', exact: true }),
  ).toHaveCount(0)
  await page.goto('/universities')
  await page.getByRole('button', { name: /Explore all verified options/ }).click()
  await expect(page.locator('.program-card')).toHaveCount(5)
})

test('budget groups respect cycles, and grade nine starts with exploration', async ({ page }) => {
  await sample(page)
  await page.getByRole('link', { name: 'Edit profile', exact: true }).click()
  await page.getByRole('button', { name: 'Edit University entry' }).click()
  await page.getByLabel('Intended entry year').fill('2026')
  await page.getByRole('button', { name: 'Save answer' }).click()
  await page.getByRole('link', { name: 'See universities' }).click()
  const aitu = page.locator('[data-program="aitu-cs"]')
  await expect(aitu).toContainText('Fits your verified budget')
  await page.getByLabel('Annual budget (KZT)', { exact: true }).fill('500000')
  await expect(aitu).toContainText('Over budget')
  await page.getByLabel('Find a program').fill('zzzz')
  await expect(page.getByRole('heading', { name: 'No options within these filters' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await page.getByRole('link', { name: 'Edit profile', exact: true }).click()
  await page.getByRole('button', { name: 'Edit School grade' }).click()
  await page.getByRole('button', { name: 'Grade 9', exact: true }).click()
  await page.getByRole('button', { name: 'Edit University entry' }).click()
  await page.getByLabel('Intended entry year').fill('2029')
  await page.getByRole('button', { name: 'Save answer' }).click()
  await page.goto('/roadmap')
  await expect(page.locator('.next-action')).toContainText('Explore your chosen field')
})

test('320px layouts, light/dark persistence, guest session and damaged local data', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await sample(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page
    .locator('[data-program="nu-cs"]')
    .getByLabel('Personal university label')
    .selectOption('Considering')
  await dashboard(page)
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  for (const route of [
    '/dashboard',
    '/universities',
    '/universities/nu-cs',
    '/my-list',
    '/portfolio',
    '/exam-goals',
    '/roadmap',
    '/profile',
  ]) {
    await page.goto(route)
    await noOverflow(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await page.goto('/dashboard')
  await page.screenshot({
    path: `tmp/screenshots/${info.project.name}-320-dashboard-dark.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'End demo session' }).click()
  await expect(page.getByRole('heading', { name: 'Your dashboard is ready' })).toBeVisible()
  await page.goto('/universities')
  await expect(page.locator('.program-card')).toHaveCount(5)
  await page.evaluate(() => localStorage.setItem('admission-journey-v3', '{invalid'))
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Start with one question' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Saved data could not be read')
})

test('inline validation, storage failure and exam input boundaries', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable')
    }
  })
  await page.goto('/diagnosis')
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable')
  await page.getByRole('button', { name: 'Grade 11', exact: true }).click()
  await page.getByLabel('Intended entry year').fill('2000')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.locator('.error-text')).toContainText('Check your answer')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Grade 10', exact: true }).click()
  await expect(page.getByLabel('Intended entry year')).not.toHaveValue('2000')
  await page.getByLabel('Intended entry year').fill('2028')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Which field interests you most?' })).toBeVisible()
  await page.getByRole('link', { name: 'Admission planning home' }).click()
  await page.getByRole('button', { name: 'Explore a sample path' }).click()
  await page.getByRole('link', { name: 'Continue to my dashboard' }).click()
  await page.getByRole('button', { name: 'Enter demo dashboard' }).click()
  await workspace(page, 'Exam Goals')
  await page.getByLabel('SAT target score', { exact: true }).fill('2000')
  await page.getByRole('button', { name: 'Save SAT goal', exact: true }).click()
  await expect(page.locator('.error-text')).toContainText('Use a score from 400 to 1600')
})

test('static hosting serves deep links and returns 404 for absent assets', async ({ request }) => {
  expect((await request.get('/health')).status()).toBe(200)
  expect((await request.get('/assets/missing.js')).status()).toBe(404)
  expect((await request.get('/universities/nu-cs', { headers: { Accept: 'text/html' } })).status()).toBe(200)
})
