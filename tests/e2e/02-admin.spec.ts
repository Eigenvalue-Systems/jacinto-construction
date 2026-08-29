import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { resetDemoData } from './reset'

const fixtures = (name: string) => path.join(__dirname, 'fixtures', name)

async function withLang(page: Page) {
  await page.context().addCookies([{ name: 'lang', value: 'en', url: 'http://localhost:3000' }])
}

test.describe('admin console (demo mode)', () => {
  test.beforeAll(async () => {
    await resetDemoData()
  })

  test.skip(({ isMobile }) => !!isMobile, 'desktop only')

  test('simplified lifecycle: name, year, location, value, description, photos, publish', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/projects$/)
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(page.getByText('Demo mode.')).toBeVisible()

    await page.getByRole('link', { name: 'New project' }).click()
    await page.fill('#new-name', 'Porch Rebuild Test')
    await page.getByRole('button', { name: 'Create project' }).click()
    await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/)
    await expect(page.locator('h1')).toHaveText('Porch Rebuild Test')

    await expect(page.locator('#p-name')).toBeVisible()
    await expect(page.locator('#p-year')).toBeVisible()
    await expect(page.locator('#p-location')).toBeVisible()
    await expect(page.locator('#p-value')).toBeVisible()
    await expect(page.locator('#p-description')).toBeVisible()
    await expect(page.locator('#p-slug')).toBeHidden()
    await expect(page.locator('#p-name-es')).toBeHidden()
    await expect(page.locator('select[name="projectType"]')).toHaveCount(0)

    await page.setInputFiles('input[type="file"][multiple]', [
      fixtures('photo-landscape.jpg'),
      fixtures('photo-portrait.jpg'),
      fixtures('photo-3.jpg'),
      fixtures('photo-4.jpg'),
      fixtures('photo-heic.heic'),
    ])
    await expect(page.getByText('All photos uploaded.')).toBeVisible({ timeout: 120_000 })
    const items = page.locator('.photo-item')
    await expect(items).toHaveCount(5)
    await expect(items.nth(0).locator('.photo-cover-tag')).toHaveText('Cover')
    await expect(items.nth(4).locator('input[id^="alt-"]')).toHaveValue('Porch Rebuild Test, project photo 5')
    await expect(items.first().locator('input[id^="alt-"]')).toBeHidden()

    await items.nth(1).getByRole('button', { name: 'Move earlier' }).click()
    await expect(items.nth(0).locator('input[id^="alt-"]')).toHaveValue('Porch Rebuild Test, project photo 2')
    await items.nth(2).getByRole('button', { name: 'Set as cover' }).click()
    await expect(items.nth(2).locator('.photo-cover-tag')).toHaveText('Cover')
    await expect(items.nth(0).locator('.photo-cover-tag')).toHaveCount(0)

    await page.selectOption('#p-year', '2024')
    await page.fill('#p-location', 'South Chicago, IL')
    await page.fill('#p-value', '185,000')
    await page.fill('#p-description', 'A rear porch rebuilt from the footings up. New footings, pressure treated framing and composite decking.\n\nSecond paragraph about the railing.')
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Published. The project is live.')).toBeVisible()
    await expect(page.locator('#p-value')).toHaveValue('185000')

    await page.goto('/projects/porch-rebuild-test')
    await expect(page.locator('h1')).toHaveText('Porch Rebuild Test')
    await expect(page.getByTestId('project-value')).toHaveText('$185,000')
    await expect(page.locator('dl').getByText('South Chicago, IL', { exact: true })).toBeVisible()
    await expect(page.getByText('A rear porch rebuilt from the footings up.')).toBeVisible()
    await expect(page.getByText('Second paragraph about the railing.')).toBeVisible()
    const cover = page.locator('figure img').first()
    await expect(cover).toHaveAttribute('src', /medium\.jpg$/)
    await expect(cover).toHaveAttribute('srcset', /thumb\.jpg 480w/)
    expect(await cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(page.locator('figure a[href$="-full.jpg"]')).toHaveCount(4)

    await page.goto('/es/projects/porch-rebuild-test')
    await expect(page.locator('h1')).toHaveText('Porch Rebuild Test')
    await expect(page.getByText('A rear porch rebuilt from the footings up.')).toBeVisible()
    await expect(page.getByTestId('project-value')).toHaveText('$185,000')
    await expect(page.getByText('Valor del proyecto')).toBeVisible()

    await page.goto('/projects?year=2024')
    await expect(page.locator('ol li a[href="/projects/porch-rebuild-test"]')).toHaveCount(1)
    await page.goto('/projects?year=2021')
    await expect(page.locator('ol li a[href="/projects/porch-rebuild-test"]')).toHaveCount(0)
    await page.goto('/')
    await expect(page.locator('main').getByText('Porch Rebuild Test').first()).toBeVisible()

    await page.goto('/admin/projects')
    await page.getByRole('link', { name: 'Porch Rebuild Test', exact: true }).click()
    await page.fill('#p-value', 'not a number')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText('Enter the project value as a plain number', { exact: false }).first()).toBeVisible()
    await page.fill('#p-value', '')
    await page.fill('#p-name', 'Porch Rebuild Test Edited')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    await page.goto('/projects/porch-rebuild-test')
    await expect(page.locator('h1')).toHaveText('Porch Rebuild Test Edited')
    await expect(page.getByTestId('project-value')).toHaveCount(0)
    await expect(page.getByText('Project value')).toHaveCount(0)

    await page.goto('/admin/projects')
    await page.getByRole('link', { name: 'Porch Rebuild Test Edited', exact: true }).click()
    await page.getByRole('button', { name: 'Unpublish' }).click()
    await expect(page.getByText('Unpublished. The project is hidden.')).toBeVisible()
    expect((await page.request.get('/projects/porch-rebuild-test')).status()).toBe(404)

    await page.getByRole('link', { name: 'Preview' }).click()
    await expect(page.getByText('Preview: Porch Rebuild Test Edited')).toBeVisible()
    await expect(page.locator('h1')).toHaveText('Porch Rebuild Test Edited')
    await page.goBack()

    await page.getByRole('button', { name: 'Duplicate' }).click()
    await expect(page.locator('h1')).toHaveText('Porch Rebuild Test Edited (copy)')
    await expect(page.locator('.photo-item')).toHaveCount(5)

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page).toHaveURL(/\/admin\/projects\?deleted=1$/)
    await expect(page.getByText('Project deleted.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Porch Rebuild Test Edited (copy)', exact: true })).toHaveCount(0)

    await page.getByRole('link', { name: 'Porch Rebuild Test Edited', exact: true }).click()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page).toHaveURL(/\/admin\/projects\?deleted=1$/)
  })

  test('publishing needs a location and a description, saving a draft does not', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/projects/new')
    await page.fill('#new-name', 'Draft Only Test')
    await page.getByRole('button', { name: 'Create project' }).click()
    await expect(page.locator('h1')).toHaveText('Draft Only Test')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Add a location before publishing.').first()).toBeVisible()
    await page.fill('#p-location', 'Chicago, IL')
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Add a description before publishing.').first()).toBeVisible()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page).toHaveURL(/\/admin\/projects\?deleted=1$/)
  })

  test('optional details hold the web address, scope and featured switch', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/projects')
    await page.getByRole('link', { name: 'Corner Storefront Build-Out', exact: true }).click()
    await expect(page.locator('#p-slug')).toBeHidden()
    await page.getByText('Optional details').click()
    await expect(page.locator('#p-slug')).toHaveValue('corner-storefront-build-out')
    await expect(page.locator('#p-details')).toBeVisible()
    await expect(page.locator('input[name="featured"]')).toBeVisible()
    await page.getByText('Spanish translation').click()
    await expect(page.locator('#p-name-es')).toHaveValue('Adecuación de un local comercial en esquina')
  })

  test('project order buttons change the public order within a year', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/projects')
    const rows = page.locator('.admin-row')
    await expect(rows.nth(1).locator('.admin-row-name')).toHaveText('Bungalow Kitchen and Rear Addition')
    await expect(rows.nth(2).locator('.admin-row-name')).toHaveText('Corner Storefront Build-Out')
    await expect(rows.nth(1).getByRole('button', { name: /Move up/ })).toBeDisabled()
    await rows.nth(2).getByRole('button', { name: /Move up/ }).click()
    await expect(rows.nth(1).locator('.admin-row-name')).toHaveText('Corner Storefront Build-Out')
    await page.goto('/projects?year=2024')
    await expect(page.locator('ol li a[href^="/projects/"]').first()).toContainText('Corner Storefront Build-Out')
    await page.goto('/projects')
    await expect(page.locator('ol li a[href^="/projects/"]').first()).toContainText('Two-Flat Masonry Restoration')
    await page.goto('/admin/projects')
    await rows.nth(1).getByRole('button', { name: /Move down/ }).click()
    await expect(rows.nth(1).locator('.admin-row-name')).toHaveText('Bungalow Kitchen and Rear Addition')
  })

  test('settings save and show up on the site', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/settings')
    await page.fill('#s-headline', 'Built to last. Test headline.')
    await page.selectOption('#s-hero', { index: 2 })
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByText('Settings saved.')).toBeVisible()
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Built to last.')
    await page.goto('/admin/settings')
    await page.fill('#s-headline', 'Built with care. Made to last.')
    await page.selectOption('#s-hero', { index: 0 })
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByText('Settings saved.')).toBeVisible()
  })

  test('admin can be used in Spanish', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/projects')
    await page.getByRole('link', { name: 'Español' }).click()
    await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible()
    await page.getByRole('link', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  })

  test('photos and messages pages render', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/media')
    await expect(page.locator('.media-item').first()).toBeVisible()
    await page.goto('/admin/messages')
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible()
  })

  test('sample projects can be removed in one action', async ({ page }) => {
    await withLang(page)
    await page.goto('/admin/projects')
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Remove all sample projects' }).click()
    await expect(page.getByText('Sample projects removed.')).toBeVisible()
    await expect(page.locator('.status-sample')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Remove all sample projects' })).toHaveCount(0)
    await page.goto('/projects')
    await expect(page.getByText('Sample project')).toHaveCount(0)
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('Sample project')).toHaveCount(0)
  })
})
