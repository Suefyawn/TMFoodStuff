// Generates PNG icon variants from the canonical SVG.
//
// Run: node scripts/build-icons.js
// Outputs:
//   app/src/app/apple-icon.png    180x180  (iOS home-screen icon)
//   app/public/icons/icon-192.png 192x192  (PWA manifest)
//   app/public/icons/icon-512.png 512x512  (PWA manifest)
//   app/public/icons/icon.svg              (kept in sync with src/app/icon.svg)
const fs = require('fs')
const path = require('path')
const sharp = require(path.resolve(__dirname, '..', 'app', 'node_modules', 'sharp'))

const ROOT = path.resolve(__dirname, '..')
const SRC_SVG = path.join(ROOT, 'app', 'src', 'app', 'icon.svg')

const targets = [
  { out: path.join(ROOT, 'app', 'src', 'app', 'apple-icon.png'), size: 180 },
  { out: path.join(ROOT, 'app', 'public', 'icons', 'icon-192.png'), size: 192 },
  { out: path.join(ROOT, 'app', 'public', 'icons', 'icon-512.png'), size: 512 },
]

;(async () => {
  const svg = fs.readFileSync(SRC_SVG)
  for (const { out, size } of targets) {
    await sharp(svg, { density: 512 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(out)
    const { size: bytes } = fs.statSync(out)
    console.log(`  ${path.relative(ROOT, out).padEnd(40)} ${size}x${size}  ${bytes.toLocaleString()} bytes`)
  }
  // Mirror the SVG into /public/icons too so manifest.json's icon.svg entry resolves.
  fs.copyFileSync(SRC_SVG, path.join(ROOT, 'app', 'public', 'icons', 'icon.svg'))
  console.log('  app/public/icons/icon.svg                synced from src/app/icon.svg')
})().catch(err => {
  console.error(err)
  process.exit(1)
})
