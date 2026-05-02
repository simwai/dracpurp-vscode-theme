const tinycolor = require('tinycolor2')

const colors = {
  WORKHORSE: '#CEC8B9',
  PARAMETER: '#DEAC77',
  FUNCTION: '#A1D3A9',
  KEYWORD: '#F272BE',
  CLASS: '#B2A1E5',
  TYPE: '#A8B4C3',
  COMMENT: '#817B93'
}

console.log('Original Analysis:')
for (const [name, hex] of Object.entries(colors)) {
    const c = tinycolor(hex)
    const hsv = c.toHsv()
    console.log(`${name.padEnd(10)}: ${hex} | H: ${Math.round(hsv.h)} S: ${Math.round(hsv.s * 100)}% V: ${Math.round(hsv.v * 100)}%`)
}

console.log('\nProposing Improved (More Saturated/Distinct):')
for (const [name, hex] of Object.entries(colors)) {
    if (name === 'WORKHORSE') {
        console.log(`${name.padEnd(10)}: ${hex} (Anchor)`)
        continue
    }

    let c = tinycolor(hex)
    // Increase saturation and adjust value for better differentiation
    // Mint Green and Pink are usually okay, but the Slate and Lavender are too dull
    let saturationBoost = 0.20
    let valueAdjustment = 0.05

    if (name === 'TYPE' || name === 'CLASS' || name === 'COMMENT') {
        saturationBoost = 0.30 // These were very dull (~15%)
    }

    const hsv = c.toHsv()
    const newColor = tinycolor({
        h: hsv.h,
        s: Math.min(1, hsv.s + saturationBoost),
        v: Math.min(1, hsv.v + valueAdjustment)
    })

    const newHex = newColor.toHexString().toUpperCase()
    const newHsv = newColor.toHsv()
    console.log(`${name.padEnd(10)}: ${newHex} | H: ${Math.round(newHsv.h)} S: ${Math.round(newHsv.s * 100)}% V: ${Math.round(newHsv.v * 100)}%`)
}
