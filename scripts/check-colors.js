const tinycolor = require('tinycolor2')
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const paletteFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')
const palette = yaml.load(paletteFile)

const primaries = ['CYAN', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']

let hasError = false

function checkLineage(name, colors, targetContrast, bg) {
    console.log(`\nChecking ${name} Lineage (Target: ${targetContrast})`)
    for (const colorName of primaries) {
        const hex = colors[colorName]
        const contrast = tinycolor.readability(bg, hex)
        console.log(`  ${colorName.padEnd(10)}: ${hex} | Contrast: ${contrast.toFixed(2)}`)
        if (contrast < targetContrast - 0.1) {
            console.error(`  Error: ${colorName} contrast is too low!`)
            hasError = true
        }
    }
}

console.log('Checking Color Manifold Consistency...')
console.log('---------------------------------------')

// Check Optimized Standard
checkLineage('Optimized Standard', palette.optimized, 10.0, palette.optimized.BG)

// Check Optimized HC
checkLineage('Optimized High Contrast', palette.hc_boost, 12.0, palette.hc_boost.BG)

// Check Original (Native)
checkLineage('Original Dracula', palette.dracula, 6.0, palette.dracula.BG)

if (hasError) {
  process.exit(1)
} else {
  console.log('\nColor manifold consistency check passed!')
}
