const tinycolor = require('tinycolor2')
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const paletteFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')
const palette = yaml.load(paletteFile)

const baseColors = palette.base
const bg = baseColors.BG
const primaries = ['CYAN', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']

console.log('Checking Color Balance (Base Palette)...')
console.log('-------------------------')

let hasError = false
const luminances = []

for (const name of primaries) {
  const hex = baseColors[name]
  const color = tinycolor(hex)
  const lum = color.getLuminance()
  const contrast = tinycolor.readability(bg, hex)
  luminances.push({ name, lum, contrast })
  console.log(
    `${name.padEnd(10)}: ${hex} | Lum: ${lum.toFixed(3)} | Contrast: ${contrast.toFixed(2)}`,
  )
}

const avgLum = luminances.reduce((sum, c) => sum + c.lum, 0) / luminances.length
console.log('-------------------------')
console.log(`Average Luminance: ${avgLum.toFixed(3)}`)

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

// Check Eggshell contrast
const eggshellHex = palette.eggshell.VARIABLE
const eggshellContrast = tinycolor.readability(bg, eggshellHex)
console.log(`Eggshell  : ${eggshellHex} | Contrast: ${eggshellContrast.toFixed(2)}`)
if (eggshellContrast < 7) {
    console.error('Error: Eggshell contrast is too low!')
    hasError = true
}

if (hasError) {
  process.exit(1)
} else {
  console.log('Color balance check passed!')
}
