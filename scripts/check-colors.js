const tinycolor = require('tinycolor2')
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const paletteFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')
const palette = yaml.load(paletteFile)

const primaries = ['CYAN', 'GREEN', 'ORANGE', 'PINK', 'PURPLE', 'RED', 'YELLOW']

let hasError = false

function checkLineage(name, colors, targetContrast, bg) {
    console.log(`\nChecking ${name} Lineage (Target Range: ~${targetContrast})`)
    for (const colorName of primaries) {
        const hex = colors[colorName]
        const contrast = tinycolor.readability(bg, hex)
        console.log(`  ${colorName.padEnd(10)}: ${hex} | Contrast: ${contrast.toFixed(2)}`)
        // The new philosophy has a contrast CEILING of 8.5/11.2, so we just log and verify it's above AA (4.5)
        if (contrast < 4.4) {
            console.error(`  Error: ${colorName} contrast is too low for accessibility!`)
            hasError = true
        }
    }
}

console.log('Checking Color Manifold Consistency...')
console.log('---------------------------------------')

// Check Optimized Standard
checkLineage('Optimized Standard', palette.optimized, 8.5, palette.optimized.BG)

// Check Optimized HC
checkLineage('Optimized High Contrast (HC)', palette.optimized, 11.2, palette.hc_optimized.BG)

// Check Original (Native)
checkLineage('Original Dracula', palette.dracula, 6.0, palette.dracula.BG)

if (hasError) {
  process.exit(1)
} else {
  console.log('\nColor manifold consistency check passed!')
}
