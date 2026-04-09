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

const HC_MAP = {
  '#6EABB8': '#80C7D6', // CYAN
  '#49B865': '#54D474', // GREEN
  '#C99851': '#EBB15F', // ORANGE
  '#F279BF': '#FF9CD5', // PINK
  '#B890F0': '#CFADFF', // PURPLE
  '#ED8282': '#FFA3A3', // RED
  '#A1A663': '#BCC274', // YELLOW
}

const EGGSHELL_VAL = '#F0EAD6'
const DRACPURP_ORANGE_VAL = '#C99851'
const DRACULA_ORANGE_VAL = '#FFB86C'

module.exports = async () => {
  const yamlFile = await readFile(join(__dirname, '..', 'src', 'dracpurp.yml'), 'utf-8')

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

        // Handle HC Color Boost
        if (isHC) {
          const originalFg = newTc.settings.foreground?.toUpperCase()
          if (HC_MAP[originalFg]) {
             newTc.settings.foreground = HC_MAP[originalFg]
          }
        }

        // Handle Eggshell Variables
        if (useEggshell) {
          // If we are in Eggshell variant, replace the (possibly boosted) orange with Eggshell
          const currentFg = newTc.settings.foreground?.toUpperCase()
          if (currentFg === DRACPURP_ORANGE_VAL || currentFg === DRACULA_ORANGE_VAL || currentFg === HC_MAP[DRACPURP_ORANGE_VAL]) {
            newTc.settings.foreground = EGGSHELL_VAL
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

  // Add the 4th "Original" variant (Dracula-based)
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
