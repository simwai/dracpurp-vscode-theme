const { readFile } = require('node:fs').promises
const { join } = require('node:path')
const { Type, Schema, load } = require('js-yaml')
const _ = require('lodash')

const withAlphaType = new Type('!alpha', {
  kind: 'sequence',
  construct: ([hexRGB, alpha]) => hexRGB + alpha,
  represent: ([hexRGB, alpha]) => hexRGB + alpha,
})

const schema = Schema.create([withAlphaType])

module.exports = async () => {
  const yamlFile = await readFile(join(__dirname, '..', 'src', 'dracpurp.yml'), 'utf-8')
  const paletteFile = await readFile(join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')

  const palette = load(paletteFile)
  const baseColors = palette.base
  const hcBoost = palette.hc_boost
  const eggshellVal = palette.eggshell.VARIABLE

  /** @type {Theme} */
  const rawBase = load(yamlFile, { schema })

  for (const key of Object.keys(rawBase.colors)) {
    if (!rawBase.colors[key]) {
      delete rawBase.colors[key]
    }
  }

  const baseVariants = {
    'base': {
       ..._.cloneDeep(rawBase),
       name: 'Dracpurp',
       tokenColors: rawBase.tokenColors.filter(obj => !obj?.name?.startsWith('OM_SETTING'))
    },
    'nightOwlItalic': {
       ..._.cloneDeep(rawBase),
       name: 'Dracpurp (Night Owl Italic)'
    },
    'noItalic': {
       ..._.cloneDeep(rawBase),
       name: 'Dracpurp (No Italic)',
       tokenColors: rawBase.tokenColors.map(obj => {
         const newObj = _.cloneDeep(obj)
         if (newObj?.settings?.fontStyle) {
           newObj.settings.fontStyle = newObj.settings.fontStyle.replace('italic', '').trim()
         }
         return newObj
       })
    }
  }

  const results = {}

  function transform(theme, nameSuffix, bg, useEggshell, isHC) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`

    if (bg) {
      t.colors['editor.background'] = bg
    }

    if (t.tokenColors) {
      t.tokenColors = t.tokenColors.map(tc => {
        if (!tc.settings) return tc
        const newTc = _.cloneDeep(tc)

        const currentFg = newTc.settings.foreground?.toUpperCase()

        // Handle HC Color Boost
        if (isHC) {
          // Find if the current foreground is one of our base primary colors
          for (const [name, hex] of Object.entries(baseColors)) {
              if (currentFg === hex.toUpperCase() && hcBoost[name]) {
                  newTc.settings.foreground = hcBoost[name]
                  break
              }
          }
        }

        // Handle Eggshell Variables
        if (useEggshell) {
          const finalFg = newTc.settings.foreground?.toUpperCase()
          // Check if it's the base orange or the boosted orange
          if (finalFg === baseColors.ORANGE.toUpperCase() || (isHC && finalFg === hcBoost.ORANGE.toUpperCase())) {
            newTc.settings.foreground = eggshellVal
          }
        }

        return newTc
      })
    }
    return t
  }

  Object.entries(baseVariants).forEach(([key, bt]) => {
    results[key] = bt
    results[`${key}HC`] = transform(bt, ' High Contrast', '#000000', false, true)
    results[`${key}Eggshell`] = transform(bt, ' Eggshell', null, true, false)
  })

  const draculaYamlFile = await readFile(join(__dirname, '..', 'src', 'dracula.yml'), 'utf-8')
  const rawDracula = load(draculaYamlFile, { schema })

  for (const key of Object.keys(rawDracula.colors)) {
    if (!rawDracula.colors[key]) {
      delete rawDracula.colors[key]
    }
  }

  const draculaVariants = {
    'dracula': {
      ..._.cloneDeep(rawDracula),
      name: 'Dracpurp Original'
    }
  }

  Object.entries(draculaVariants).forEach(([key, bt]) => {
    results[key] = bt
    results[`${key}HC`] = transform(bt, ' High Contrast', '#000000', false, true)
    results[`${key}Eggshell`] = transform(bt, ' Eggshell', null, true, false)
  })

  return results
}
