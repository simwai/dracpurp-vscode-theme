const tinycolor = require('tinycolor2')
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const paletteFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')
const palette = yaml.load(paletteFile)

const baseColors = palette.base
const eggshellVariable = palette.eggshell.VARIABLE
const bg = baseColors.BG

// Include EGGSHELL in the checkable colors manifold
const colorsToCheck = {
  ...baseColors,
  EGGSHELL: eggshellVariable
}

// Primaries for luminance balance check
const primaries = ['CYAN', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']

console.log('Checking Color Manifold Consistency...')
console.log('---------------------------------------')

let hasError = false
const luminances = []

for (const [name, hex] of Object.entries(colorsToCheck)) {
  if (name === 'BG' || name === 'FG' || name === 'COMMENT' || name === 'SELECTION') continue

  const color = tinycolor(hex)
  const lum = color.getLuminance()
  const contrast = tinycolor.readability(bg, hex)

  if (primaries.includes(name)) {
      luminances.push({ name, lum, contrast })
  }

  console.log(
    `${name.padEnd(10)}: ${hex} | Lum: ${lum.toFixed(3)} | Contrast: ${contrast.toFixed(2)}`,
  )

  // Enforce minimum contrast for all syntax colors
  if (contrast < 7) {
      console.error(`Error: Color ${name} contrast (${contrast.toFixed(2)}) is below the acceptable threshold of 7.0!`)
      hasError = true
  }
}

const avgLum = luminances.reduce((sum, c) => sum + c.lum, 0) / luminances.length
console.log('-------------------------')
console.log(`Average Primary Luminance: ${avgLum.toFixed(3)}`)

const TOLERANCE = 0.08
for (const c of luminances) {
  const diff = Math.abs(c.lum - avgLum)
  if (diff > TOLERANCE) {
    console.error(
      `Error: Color ${c.name} luminance (${c.lum.toFixed(3)}) deviates too much from average (${avgLum.toFixed(3)})!`,
    )
    hasError = true
  }
}

if (hasError) {
  process.exit(1)
} else {
  console.log('Color manifold consistency check passed!')
}
