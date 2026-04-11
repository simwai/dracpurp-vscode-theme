const tinycolor = require('tinycolor2')
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const paletteFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')
const palette = yaml.load(paletteFile)

const baseColors = palette.base
const hcBoost = palette.hc_boost
const eggshellVariable = palette.eggshell.VARIABLE
const bgBase = baseColors.BG
const bgHC = '#000000'

const primaries = ['CYAN', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']

console.log('Checking Color Manifold Consistency...')
console.log('---------------------------------------')

let hasError = false

// Check Base Colors
console.log('\nBase Palette (Target Contrast: 10.0)')
for (const name of primaries) {
    const hex = baseColors[name]
    const contrast = tinycolor.readability(bgBase, hex)
    console.log(`${name.padEnd(10)}: ${hex} | Contrast: ${contrast.toFixed(2)}`)
    if (contrast < 9.9) { // Allow slight rounding
        console.error(`Error: ${name} base contrast is too low!`)
        hasError = true
    }
}

// Check HC Boost Colors
console.log('\nHC Boost Palette (Target Contrast: 12.0)')
for (const name of primaries) {
    const hex = hcBoost[name]
    const contrast = tinycolor.readability(bgHC, hex)
    console.log(`${name.padEnd(10)}: ${hex} | Contrast: ${contrast.toFixed(2)}`)
    if (contrast < 11.9) {
        console.error(`Error: ${name} HC contrast is too low!`)
        hasError = true
    }
}

// Check Luminance Consistency (Base only)
const luminances = primaries.map(name => tinycolor(baseColors[name]).getLuminance())
const avgLum = luminances.reduce((a, b) => a + b, 0) / luminances.length
console.log(`\nAverage Primary Luminance: ${avgLum.toFixed(3)}`)

const TOLERANCE = 0.15 // Slightly increased tolerance for high contrast requirements
for (const name of primaries) {
    const lum = tinycolor(baseColors[name]).getLuminance()
    const diff = Math.abs(lum - avgLum)
    if (diff > TOLERANCE) {
        console.warn(`Warning: ${name} luminance (${lum.toFixed(3)}) deviates from average (${avgLum.toFixed(3)})`)
    }
}

if (hasError) {
  process.exit(1)
} else {
  console.log('\nColor manifold consistency check passed!')
}
