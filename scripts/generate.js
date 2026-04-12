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
      // Find all scopes that are variables or parameters to ensure they stay synced
      const variableScopes = [
          'variable',
          'variable.parameter',
          'entity.name.variable.parameter',
          'variable.other.readwrite',
          'variable.other.object',
          'variable.other.property'
      ]

      t.tokenColors = t.tokenColors.map(tc => {
        if (!tc.settings) return tc
        const newTc = _.cloneDeep(tc)

        const currentFg = newTc.settings.foreground?.toUpperCase()

        // Check if this token matches a variable/parameter scope
        const isVariableToken = Array.isArray(newTc.scope)
            ? newTc.scope.some(s => variableScopes.some(vs => s.startsWith(vs)))
            : (typeof newTc.scope === 'string' && variableScopes.some(vs => newTc.scope.startsWith(vs)))

        // Handle HC Color Boost
        if (isHC) {
          for (const [name, hex] of Object.entries(baseColors)) {
              if (currentFg === hex.toUpperCase() && hcBoost[name]) {
                  newTc.settings.foreground = hcBoost[name]
                  break
              }
          }
        }

        // Handle Eggshell Variables
        if (useEggshell && (isVariableToken || newTc.settings.foreground === baseColors.ORANGE || (isHC && newTc.settings.foreground === hcBoost.ORANGE))) {
           // Double check current value to avoid overwriting unrelated tokens that happen to be orange (if any)
           // But here the user wants "variable names" to be eggshell.
           const finalFg = newTc.settings.foreground?.toUpperCase()
           if (finalFg === baseColors.ORANGE.toUpperCase() || (isHC && finalFg === hcBoost.ORANGE.toUpperCase())) {
                newTc.settings.foreground = eggshellVal
           }
        }

        return newTc
      })

      // Specifically target C# readwrite variables which might be deeply scoped
      if (useEggshell) {
          t.tokenColors.push({
              name: "C# Variables",
              scope: [
                  "variable.other.readwrite.cs",
                  "variable.other.object.cs",
                  "variable.other.property.cs"
              ],
              settings: {
                  foreground: eggshellVal
              }
          })
      }
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
