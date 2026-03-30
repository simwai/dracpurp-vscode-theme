const tinycolor = require('tinycolor2')
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const yamlFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'dracpurp.yml'), 'utf-8')
// _theme is for future use or verification if needed
const _theme = yaml.load(yamlFile)

// Extract base colors from the yaml structure
const colorLines = yamlFile.split('\n')
const baseColors = {}
const colorRegex = /&(\w+)\s+'(#\w+)'/

for (const line of colorLines) {
  const match = line.match(colorRegex)
  if (match) {
    baseColors[match[1]] = match[2]
  }
}

const bg = baseColors.BG || '#100e12'
const primaries = ['CYAN', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']

console.log('Checking Color Balance...')
console.log('-------------------------')

let hasError = false
const luminances = []

for (const name of primaries) {
  const hex = baseColors[name]
  if (!hex) {
    console.warn(`Warning: Primary color ${name} not found in base palette.`)
    continue
  }
  const color = tinycolor(hex)
  const lum = color.getLuminance()
  const contrast = tinycolor.readability(bg, hex)
  luminances.push({ name, lum, contrast })
  console.log(
    `${name.padEnd(10)}: ${hex} | Lum: ${lum.toFixed(3)} | Contrast: ${contrast.toFixed(2)}`,
  )
}

// Calculate average luminance and check variance
const avgLum = luminances.reduce((sum, c) => sum + c.lum, 0) / luminances.length
console.log('-------------------------')
console.log(`Average Luminance: ${avgLum.toFixed(3)}`)

const TOLERANCE = 0.08 // Allow some variance but not too much
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
  console.log('Color balance check passed!')
}
