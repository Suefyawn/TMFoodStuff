// Renders staff-manual.md to staff-manual.pdf (A4). Needs the "marked" package
// available to node (for example: npm i marked in a scratch folder and run with
// NODE_PATH pointing at its node_modules). Not added to the app's dependencies.
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { marked } = require('marked')
const here = path.dirname(fileURLToPath(import.meta.url))
const md = fs.readFileSync(path.join(here, 'staff-manual.md'), 'utf8')
const html = `<!doctype html><meta charset="utf-8"><style>
body{font:14px/1.55 Helvetica,Arial,sans-serif;color:#1f2933;margin:0}
h1{font-size:26px;margin:0 0 8px}h2{font-size:19px;margin:26px 0 8px;break-after:avoid;border-bottom:2px solid #10b981;padding-bottom:4px}
img{max-width:100%;border:1px solid #d5dbe1;border-radius:6px;margin:8px 0;break-inside:avoid}
li{margin:3px 0}code{background:#eef1f4;padding:1px 4px;border-radius:3px}p{margin:6px 0}
</style><body>${marked.parse(md)}</body>`
const tmp = path.join(here, '_print.html')
fs.writeFileSync(tmp, html)
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(pathToFileURL(tmp).href)
await page.waitForLoadState('networkidle')
await page.pdf({ path: path.join(here, 'staff-manual.pdf'), format: 'A4', margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' }, printBackground: true })
await browser.close()
fs.rmSync(tmp)
console.log('wrote staff-manual.pdf')
