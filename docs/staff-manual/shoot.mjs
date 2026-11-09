// Takes the screenshots for staff-manual.md from a LOCAL run of the app with
// seed data only. Usage (app running on localhost:3000):
//   STAFF_EMAIL=... STAFF_PASSWORD=... node docs/staff-manual/shoot.mjs
// Never point this at the live site.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = process.env.BASE_URL || 'http://localhost:3000'
if (!/localhost|127\.0\.0\.1/.test(BASE)) throw new Error('Local runs only')
const here = path.dirname(fileURLToPath(import.meta.url))
const img = (n) => path.join(here, 'img', n)
const email = process.env.STAFF_EMAIL
const password = process.env.STAFF_PASSWORD

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, bypassCSP: true })
const page = await ctx.newPage()

// A plain sample picture (drawn here, not a real product photo).
const sample = path.join(here, 'img', '_sample.png')
{
  const p = await ctx.newPage()
  await p.setViewportSize({ width: 600, height: 600 })
  await p.setContent('<body style="margin:0;display:grid;place-items:center;height:600px;background:#f3d9a4;font:600 40px sans-serif;color:#7a4b00">Sample photo</body>')
  await p.screenshot({ path: sample })
  await p.close()
}

async function shot(name, opts = {}) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: img(name), ...opts })
  console.log('saved', name)
}
const field = (label) => page.locator('label', { hasText: label }).first().locator('xpath=following-sibling::*[1]')

// 1 Sign in
await page.goto(BASE + '/dashboard/login')
await page.getByPlaceholder('Email').fill(email)
await page.getByPlaceholder('Password').fill('x'.repeat(password.length))
await shot('01-sign-in.png')
await page.getByPlaceholder('Password').fill(password)
await page.getByRole('button', { name: /sign in|log in|login/i }).click()
await page.waitForURL(/\/dashboard(?!\/login)/, { timeout: 60000 })

// 2 Products list
await page.goto(BASE + '/dashboard/products')
await page.getByPlaceholder('Search products...').waitFor()
await shot('02-products-list.png')

// 3 Add product
await page.getByRole('button', { name: /add product/i }).first().click()
await page.getByText('Add New Product').waitFor()
await field('Name *').fill('Sample Mango Box')
await field('Category').selectOption({ label: 'Fruits' })
await field('Price (AED) *').fill('24.50')
await field('Compare-at Price').fill('29.00')
await field('Unit').fill('per kg')
await field('Stock').fill('40')
await field('Low-stock alert').fill('5')
await field('Origin').fill('Pakistan')
await page.locator('textarea').first().fill('Sweet, ripe mangoes. Sample text for the manual.')
await page.locator('input[type=file]').last().setInputFiles(sample)
await page.waitForTimeout(2500)
await shot('03-add-product-form.png')
await page.getByRole('button', { name: 'Add Product', exact: true }).last().click()
await page.getByText('Add New Product').waitFor({ state: 'hidden' })
await page.goto(BASE + '/dashboard/products')
await page.getByPlaceholder('Search products...').waitFor()

// 4 Edit price, stock, photos
await page.getByPlaceholder('Search products...').fill('Sample Mango Box')
await page.waitForTimeout(800)
await shot('04-find-product.png')
await page.getByRole('button', { name: /^edit$/i }).first().click()
await page.getByText('Edit Product').waitFor()
await shot('05-edit-product-form.png')
await page.getByText('Edit Product').locator('xpath=ancestor::div[contains(@class,"max-w-2xl")]').getByRole('button', { name: 'Cancel' }).click()

// 5 Publish or hide: the status pill in the list
await page.getByPlaceholder('Search products...').fill('Sample Mango Box')
await page.waitForTimeout(800)
await shot('06-active-inactive.png')

// 6 Promo codes
await page.goto(BASE + '/dashboard/settings')
await page.getByRole('button', { name: 'Promo codes' }).click()
await page.getByPlaceholder('SUMMER25').fill('WELCOME10')
await shot('07-promo-code-form.png')

// 7 Delivery areas
await page.getByRole('button', { name: 'Delivery & pricing' }).click()
await page.getByText('Delivery areas (Dubai)').waitFor()
await shot('08-delivery-areas.png')

// 8 Categories
await page.goto(BASE + '/dashboard/categories')
await page.waitForTimeout(1500)
await shot('09-categories.png')

fs.rmSync(sample)
await browser.close()
