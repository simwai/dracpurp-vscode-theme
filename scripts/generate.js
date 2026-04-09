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

  /** @type {Theme} */
  const rawBase = load(yamlFile, { schema })

  // Remove nulls and other falsy values from colors
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

  const EGGSHELL_VAL = '#F0EAD6'
  const DRACPURP_ORANGE_VAL = '#C99851'
  const DRACULA_ORANGE_VAL = '#FFB86C'

  function transform(theme, nameSuffix, bg, useEggshell) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`

    if (bg) {
      t.colors['editor.background'] = bg
    }

    if (useEggshell) {
      t.tokenColors = t.tokenColors.map(tc => {
        if (tc.settings && (tc.settings.foreground === DRACPURP_ORANGE_VAL || tc.settings.foreground === DRACULA_ORANGE_VAL)) {
          const newTc = _.cloneDeep(tc)
          newTc.settings.foreground = EGGSHELL_VAL
          return newTc
        }
        return tc
      })
    }
    return t
  }

  Object.entries(baseVariants).forEach(([key, bt]) => {
    results[key] = bt
    results[`${key}HC`] = transform(bt, ' High Contrast', '#000000', false)
    results[`${key}Eggshell`] = transform(bt, ' Eggshell', null, true)
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
    results[`${key}HC`] = transform(bt, ' High Contrast', '#000000', false)
    results[`${key}Eggshell`] = transform(bt, ' Eggshell', null, true)
  })

  return results
}
