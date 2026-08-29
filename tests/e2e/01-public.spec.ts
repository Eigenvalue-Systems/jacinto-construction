import { expect, test, type Page } from '@playwright/test'
import { resetDemoData } from './reset'

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440]

async function withLang(page: Page, lang: 'en' | 'es' = 'en') {
  await page.context().addCookies([{ name: 'lang', value: lang, url: 'http://localhost:3000' }])
}

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

async function expectNoBrokenImages(page: Page) {
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && !img.loading)
      .map((img) => img.currentSrc || img.src),
  )
  expect(broken).toEqual([])
}

test.describe('public site', () => {
  test.beforeAll(async () => {
    await resetDemoData()
  })

  test('home page renders the company, headline, phone link and featured work', async ({ page }) => {
    await withLang(page)
    const errors = collectErrors(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/Jacinto Construction/)
    await expect(page.locator('h1')).toContainText('Built with care')
    await expect(page.locator('a[href="tel:+17735741060"]:visible').first()).toBeVisible()
    await expect(page.locator('main a[href="/projects"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent projects.' })).toBeVisible()
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
    expect(errors).toEqual([])
    await expectNoBrokenImages(page)
  })

  test('first visit asks for a language and Español switches to /es', async ({ page }) => {
    await page.goto('/')
    const dialog = page.locator('dialog[aria-labelledby="lang-title"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Choose a language')).toBeVisible()
    await expect(dialog.getByText('Elija un idioma')).toBeVisible()
    await dialog.locator('a[data-choice="es"]').click()
    await expect(page).toHaveURL(/\/es$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-US')
    await expect(page.locator('h1')).toContainText('Construido con cuidado')
    const cookies = await page.context().cookies()
    expect(cookies.find((c) => c.name === 'lang')?.value).toBe('es')
    await expect(page.locator('dialog[aria-labelledby="lang-title"]')).toHaveCount(0)
  })

  test('choosing English closes the prompt without a reload and remembers it', async ({ page }) => {
    await page.goto('/')
    const dialog = page.locator('dialog[aria-labelledby="lang-title"]')
    await expect(dialog).toBeVisible()
    await dialog.locator('a[data-choice="en"]').click()
    await expect(dialog).toHaveCount(0)
    await page.reload()
    await expect(page.locator('dialog[aria-labelledby="lang-title"]')).toHaveCount(0)
  })

  test('a Spanish preference redirects the root URL to /es', async ({ page }) => {
    await withLang(page, 'es')
    await page.goto('/projects')
    await expect(page).toHaveURL(/\/es\/projects$/)
    await expect(page.locator('h1')).toHaveText('Todo el trabajo.')
  })

  test('the header switch says English or Español in full and switches both ways', async ({ page }) => {
    await withLang(page, 'es')
    await page.goto('/es/about')
    const toEnglish = page.locator('header a[lang="en"]')
    await expect(toEnglish).toBeVisible()
    await expect(toEnglish).toHaveText('English')
    await toEnglish.click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    const toSpanish = page.locator('header a[lang="es"]')
    await expect(toSpanish).toBeVisible()
    await expect(toSpanish).toHaveText('Español')
    await toSpanish.click()
    await expect(page).toHaveURL(/\/es\/about$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-US')
    await expect(page.locator('footer').getByRole('link', { name: 'English' })).toBeVisible()
    await expect(page.locator('footer').getByRole('link', { name: 'Español' })).toBeVisible()
  })

  test('projects index offers All plus the years that have projects, newest first', async ({ page }) => {
    await withLang(page)
    await page.goto('/projects')
    await expect(page.locator('h1')).toHaveText('All work.')
    const filters = page.locator('nav[aria-label="Year"] a')
    await expect(filters).toHaveText(['All', '2025', '2024', '2023', '2022', '2021'])
    await expect(page.getByRole('link', { name: 'Residential', exact: true })).toHaveCount(0)
    const names = page.locator('ol li a[href^="/projects/"]')
    await expect(names).toHaveCount(6)
    await expect(names.first()).toContainText('Two-Flat Masonry Restoration')
    await expect(names.last()).toContainText('New Single-Family Home')
    await page.getByRole('link', { name: '2024', exact: true }).click()
    await expect(page).toHaveURL(/\/projects\?year=2024$/)
    await expect(names).toHaveCount(2)
    await expect(page.locator('nav[aria-label="Year"] a[aria-current="true"]')).toHaveText('2024')
    await page.goto('/projects?year=1999')
    await expect(page.getByText('No projects here yet.')).toBeVisible()
    await page.getByRole('link', { name: 'View all work' }).click()
    await expect(page).toHaveURL(/\/projects$/)
  })

  test('project value shows as whole dollars only when it exists', async ({ page }) => {
    await withLang(page)
    await page.goto('/projects/bungalow-kitchen-and-rear-addition')
    await expect(page.getByTestId('project-value')).toHaveText('$185,000')
    await expect(page.getByText('Project value')).toBeVisible()
    await page.goto('/projects/corner-storefront-build-out')
    await expect(page.getByTestId('project-value')).toHaveCount(0)
    await expect(page.getByText('Project value')).toHaveCount(0)
    await expect(page.getByText('N/A')).toHaveCount(0)
    await page.goto('/es/projects/bungalow-kitchen-and-rear-addition')
    await expect(page.getByTestId('project-value')).toHaveText('$185,000')
  })

  test('project page shows details, gallery and a keyboard operable lightbox', async ({ page }) => {
    await withLang(page)
    const errors = collectErrors(page)
    await page.goto('/projects/two-flat-masonry-restoration')
    await expect(page.locator('h1')).toHaveText('Two-Flat Masonry Restoration')
    await expect(page.getByText('Sample project').first()).toBeVisible()
    await expect(page.getByText('Residential')).toHaveCount(0)
    await expect(page.getByText('Six steel lintels replaced')).toBeVisible()
    const galleryLinks = page.locator('figure a[href$=".svg"]')
    await expect(galleryLinks).toHaveCount(7)
    await galleryLinks.first().click()
    const lightbox = page.locator('dialog[aria-label="Image viewer"]')
    await expect(lightbox).toBeVisible()
    await expect(lightbox.getByText('1 of 7')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(lightbox.getByText('2 of 7')).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await expect(lightbox.getByText('1 of 7')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(lightbox).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Next project/ })).toBeVisible()
    expect(errors).toEqual([])
    await expectNoBrokenImages(page)
  })

  test('before and after module renders for grouped photos', async ({ page }) => {
    await withLang(page)
    await page.goto('/projects/bungalow-kitchen-and-rear-addition')
    await expect(page.getByRole('heading', { name: 'Before and after' })).toBeVisible()
    await expect(page.locator('figcaption').filter({ hasText: 'Before' }).first()).toBeVisible()
    await expect(page.locator('figcaption').filter({ hasText: 'After' }).first()).toBeVisible()
  })

  test('unknown pages return a branded 404 in the right language', async ({ page }) => {
    await withLang(page)
    const response = await page.goto('/not-a-real-page')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('This page is not part of the build.')).toBeVisible()
    await withLang(page, 'es')
    await page.goto('/es/projects/no-existe')
    await expect(page.getByText('Esta página no forma parte de la obra.')).toBeVisible()
  })

  test('contact form validates and stores a message', async ({ page }) => {
    await withLang(page)
    await page.goto('/contact')
    await expect(page.locator('a[href="tel:+17735741060"]:visible').first()).toBeVisible()
    await expect(page.locator('a[href="mailto:luisjacinto1107@gmail.com"]').first()).toBeVisible()
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.locator('#contact-name-error')).toHaveText('Required')
    await page.fill('#contact-name', 'Test Visitor')
    await page.fill('#contact-contact', '773 555 0100')
    await page.fill('#contact-message', 'I need a rear porch rebuilt this fall.')
    await page.waitForTimeout(2600)
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText('Message sent.')).toBeVisible()
    await page.goto('/admin/messages')
    await expect(page.getByText('Test Visitor')).toBeVisible()
    await expect(page.getByText('rear porch rebuilt')).toBeVisible()
  })

  test('sitemap and robots are served', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    const xml = await sitemap.text()
    expect(xml).toContain('/projects/two-flat-masonry-restoration')
    expect(xml).toContain('/es/projects/two-flat-masonry-restoration')
    const robots = await request.get('/robots.txt')
    expect(await robots.text()).toContain('Disallow: /admin')
  })

  test('the English site is never served under /en', async ({ page }) => {
    await withLang(page)
    await page.goto('/en/projects')
    await expect(page).toHaveURL(/\/projects$/)
  })

  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await withLang(page)
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/', '/projects', '/projects/two-flat-masonry-restoration', '/about', '/contact']) {
        await page.goto(path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `${path} at ${width}`).toBeLessThanOrEqual(0)
      }
    })
  }
})

test.describe('phone navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone only')

  test('menu opens as a full paper panel with large links and a phone number', async ({ page }) => {
    await withLang(page)
    await page.goto('/')
    const menuButton = page.getByRole('button', { name: 'Menu' })
    await expect(menuButton).toBeVisible()
    const box = await menuButton.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    await menuButton.click()
    const menu = page.locator('dialog#site-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: /Projects/ })).toBeVisible()
    await expect(menu.locator('a[href="tel:+17735741060"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await menuButton.click()
    await menu.getByRole('link', { name: /Contact/ }).click()
    await expect(page).toHaveURL(/\/contact$/)
  })

  test('the phone icon in the header is a tap to call link', async ({ page }) => {
    await withLang(page)
    await page.goto('/')
    const call = page.locator('header a[href="tel:+17735741060"]').last()
    await expect(call).toBeVisible()
    const box = await call.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
  })

  test('lightbox responds to swipe', async ({ page }) => {
    await withLang(page)
    await page.goto('/projects/two-flat-masonry-restoration')
    await page.locator('figure a[href$=".svg"]').first().click()
    const lightbox = page.locator('dialog[aria-label="Image viewer"]')
    await expect(lightbox.getByText('1 of 7')).toBeVisible()
    const stage = lightbox.locator('img').first()
    const box = await stage.boundingBox()
    if (!box) throw new Error('no image')
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width * 0.8, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.2, y, { steps: 6 })
    await page.mouse.up()
    await expect(lightbox.getByText('2 of 7')).toBeVisible()
  })
})
