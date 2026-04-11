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
  const dracpurpYamlFile = await readFile(join(__dirname, '..', 'src', 'dracpurp.yml'), 'utf-8')
  const draculaYamlFile = await readFile(join(__dirname, '..', 'src', 'dracula.yml'), 'utf-8')
  const paletteFile = await readFile(join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')

  const palette = load(paletteFile)
  const eggshellVal = palette.eggshell.VARIABLE

  /** @type {Theme} */
  const rawOptimized = load(dracpurpYamlFile, { schema })
  const rawOriginal = load(draculaYamlFile, { schema })

  function cleanTheme(theme) {
      for (const key of Object.keys(theme.colors)) {
          if (!theme.colors[key]) {
              delete theme.colors[key]
          }
      }
      return theme
  }

  const results = {}

  function transform(theme, nameSuffix, bg, useEggshell, isHC, lineageColors, skipBoost = false) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`

    if (bg) {
      t.colors['editor.background'] = bg
    }

    if (t.tokenColors) {
      // Narrow scopes to target actual variable names, not properties or language keywords
      const variableScopes = [
          'variable',
          'variable.parameter',
          'entity.name.variable.parameter',
          'variable.other.readwrite'
      ]

      t.tokenColors = t.tokenColors.map(tc => {
        if (!tc.settings) return tc
        const newTc = _.cloneDeep(tc)
        const currentFg = newTc.settings.foreground?.toUpperCase()

        const isVariableToken = Array.isArray(newTc.scope)
            ? newTc.scope.some(s => variableScopes.some(vs => s === vs || s.startsWith(vs + '.')))
            : (typeof newTc.scope === 'string' && variableScopes.some(vs => newTc.scope === vs || newTc.scope.startsWith(vs + '.')))

        // Handle HC Color Boost (Optimized only)
        if (isHC && !skipBoost) {
          for (const [name, hex] of Object.entries(lineageColors)) {
              if (currentFg === hex.toUpperCase() && palette.hc_boost[name]) {
                  newTc.settings.foreground = palette.hc_boost[name]
                  break
              }
          }
        }

        // Handle Eggshell Variables: Target ORANGE (Rajah/Dracula Orange) that are also variables
        if (useEggshell) {
           const finalFg = newTc.settings.foreground?.toUpperCase()
           const orangeTarget = skipBoost ? palette.dracula.ORANGE.toUpperCase() : palette.optimized.ORANGE.toUpperCase()
           const hcOrangeTarget = palette.hc_boost.ORANGE.toUpperCase()

           const isOrange = finalFg === orangeTarget || (isHC && !skipBoost && finalFg === hcOrangeTarget)

           if (isVariableToken && isOrange) {
                newTc.settings.foreground = eggshellVal
           }
        }

        return newTc
      })
    }
    return t
  }

  // Optimized Lineage
  const baseOptimized = {
    ...cleanTheme(rawOptimized),
    name: 'Dracpurp',
    tokenColors: rawOptimized.tokenColors.filter(obj => !obj?.name?.startsWith('OM_SETTING'))
  }

  const optimizedVariants = {
      'base': baseOptimized,
      'nightOwlItalic': { ...baseOptimized, name: 'Dracpurp (Night Owl Italic)', tokenColors: rawOptimized.tokenColors },
      'noItalic': {
          ...baseOptimized,
          name: 'Dracpurp (No Italic)',
          tokenColors: rawOptimized.tokenColors.map(obj => {
              const newObj = _.cloneDeep(obj)
              if (newObj?.settings?.fontStyle) {
                  newObj.settings.fontStyle = newObj.settings.fontStyle.replace('italic', '').trim()
              }
              return newObj
          })
      }
  }

  Object.entries(optimizedVariants).forEach(([key, bt]) => {
      results[key] = bt
      results[`${key}HC`] = transform(bt, ' High Contrast', '#000000', false, true, palette.optimized)
      results[`${key}Eggshell`] = transform(bt, ' Eggshell', null, true, false, palette.optimized)
  })

  // Original Lineage
  const baseOriginal = {
      ...cleanTheme(rawOriginal),
      name: 'Dracpurp Original'
  }

  const draculaVariants = {
    'dracula': baseOriginal
  }

  Object.entries(draculaVariants).forEach(([key, bt]) => {
    results[key] = bt
    results[`${key}HC`] = transform(bt, ' High Contrast', '#000000', false, true, palette.dracula, true)
    results[`${key}Eggshell`] = transform(bt, ' Eggshell', null, true, false, palette.dracula)
  })

  return results
}
