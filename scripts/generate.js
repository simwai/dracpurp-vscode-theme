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
  const DRACPURP_ORANGE_VAL = '#DE9C3E'
  const DRACULA_ORANGE_VAL = '#FFB86C'

  function transform(theme, nameSuffix, bg, useEggshell) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`

    // Only background and syntax highlighting (tokenColors) can change
    // We must preserve all other UI colors as they are in the base theme.
    // However, the user specifically allowed changing "bg purple shade".
    // In VS Code themes, 'editor.background' is the primary bg.

    if (bg) {
      t.colors['editor.background'] = bg
    }

    if (useEggshell) {
      t.tokenColors = t.tokenColors.map(tc => {
        // Broadly replace orange with eggshell to ensure all variable related scopes (definition and usage)
        // are updated consistently.
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
    results[`${key}HCEggshell`] = transform(bt, ' High Contrast Eggshell', '#000000', true)
  })

  // Add the 4th "Original" variant (Dracula-based)
  const draculaYamlFile = await readFile(join(__dirname, '..', 'src', 'dracula.yml'), 'utf-8')
  const rawDracula = load(draculaYamlFile, { schema })

  // Minimal cleanup for Dracula
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
    results[`${key}HCEggshell`] = transform(bt, ' High Contrast Eggshell', '#000000', true)
  })

  return results
}
