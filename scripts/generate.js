const { readFile, writeFile } = require('node:fs').promises
const { join } = require('node:path')
const { Type, Schema, load } = require('js-yaml')
const _ = require('lodash')
const tinycolor = require('tinycolor2')

const withAlphaType = new Type('!alpha', {
  kind: 'sequence',
  construct: ([hexRGB, alpha]) => hexRGB + alpha,
  represent: ([hexRGB, alpha]) => hexRGB + alpha,
})

const schema = Schema.create([withAlphaType])

module.exports = async () => {
  const paletteFile = await readFile(join(__dirname, '..', 'src', 'palette.yml'), 'utf-8')
  const palette = load(paletteFile)
  const basePalette = palette.base
  const hcBoost = palette.hc_boost
  const eggshellVal = palette.eggshell.VARIABLE

  const flavors = [
    { id: 'dracpurp', name: 'Dracpurp', palette: basePalette, isDefault: true },
    { id: 'mocha', name: 'Dracpurp Mocha', palette: palette.mocha, bg: '#08070b' },
    { id: 'macchiato', name: 'Dracpurp Macchiato', palette: palette.macchiato, bg: '#0c0b10' },
    { id: 'frappe', name: 'Dracpurp Frappe', palette: palette.frappe, bg: '#0d0c12' }
  ]

  const results = {}
  const yamlSource = await readFile(join(__dirname, '..', 'src', 'dracpurp.yml'), 'utf-8')

  function transform(theme, flavor, nameSuffix, bg, useEggshell, isHC) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`
    if (bg) t.colors['editor.background'] = bg

    const flavorPalette = flavor.palette || basePalette
    const boostMap = flavor.id === 'dracpurp' ? hcBoost : {}

    if (t.tokenColors) {
      const variableScopes = [
          'variable', 'variable.parameter', 'entity.name.variable.parameter',
          'variable.other.readwrite', 'variable.other.object', 'variable.other.property'
      ]

      const peachColor = (flavorPalette.PEACH || flavorPalette.ORANGE || basePalette.ORANGE).toUpperCase()

      t.tokenColors = t.tokenColors.map(tc => {
        if (!tc.settings) return tc
        const newTc = _.cloneDeep(tc)
        const currentFg = newTc.settings.foreground?.toUpperCase()
        if (!currentFg) return newTc

        const isVariableToken = Array.isArray(newTc.scope)
            ? newTc.scope.some(s => variableScopes.some(vs => s.startsWith(vs)))
            : (typeof newTc.scope === 'string' && variableScopes.some(vs => newTc.scope.startsWith(vs)))

        if (isHC) {
          let boosted = null
          for (const [name, hex] of Object.entries(flavorPalette)) {
              if (currentFg === hex.toUpperCase()) {
                  if (boostMap[name]) {
                      boosted = boostMap[name]
                  } else {
                      boosted = tinycolor(hex).lighten(15).toHexString()
                  }
                  break
              }
          }
          if (boosted) newTc.settings.foreground = boosted
        }

        if (useEggshell && (isVariableToken || currentFg === peachColor)) {
            newTc.settings.foreground = eggshellVal
        }
        return newTc
      })

      if (useEggshell) {
          t.tokenColors.push({
              name: "C# Variables",
              scope: ["variable.other.readwrite.cs", "variable.other.object.cs", "variable.other.property.cs"],
              settings: { foreground: eggshellVal }
          })
      }
    }
    return t
  }

  for (const flavor of flavors) {
    let processedYaml = yamlSource
    const flavorPalette = flavor.palette

    for (const [key, hex] of Object.entries(flavorPalette)) {
      const anchorRegex = new RegExp(`&${key}\\s+['"]?#[0-9a-fA-F]{6,8}['"]?`, 'g')
      processedYaml = processedYaml.replace(anchorRegex, `&${key} '${hex}'`)
    }

    if (flavor.bg) {
       processedYaml = processedYaml.replace(/&BG\s+['"]?#[0-9a-fA-F]{6,8}['"]?/g, `&BG '${flavor.bg}'`)
    }

    let rawBase;
    try {
      rawBase = load(processedYaml, { schema })
    } catch (e) {
      await writeFile(join(__dirname, '..', `debug-${flavor.id}.yml`), processedYaml)
      throw e
    }

    for (const key of Object.keys(rawBase.colors)) {
      if (!rawBase.colors[key]) delete rawBase.colors[key]
    }

    const baseKey = flavor.isDefault ? 'dracpurp' : `${flavor.id}`
    const nightOwlKey = flavor.isDefault ? 'nightOwlItalic' : `${flavor.id}-nightOwlItalic`
    const noItalicKey = flavor.isDefault ? 'noItalic' : `${flavor.id}-noItalic`

    const variants = {
      [baseKey]: {
         ..._.cloneDeep(rawBase),
         name: flavor.name,
         tokenColors: rawBase.tokenColors.filter(obj => !obj?.name?.startsWith('OM_SETTING'))
      },
      [nightOwlKey]: {
         ..._.cloneDeep(rawBase),
         name: `${flavor.name} (Night Owl Italic)`
      },
      [noItalicKey]: {
         ..._.cloneDeep(rawBase),
         name: `${flavor.name} (No Italic)`,
         tokenColors: rawBase.tokenColors.map(obj => {
           const newObj = _.cloneDeep(obj)
           if (newObj?.settings?.fontStyle) {
             newObj.settings.fontStyle = newObj.settings.fontStyle.replace('italic', '').trim()
           }
           return newObj
         })
      }
    }

    Object.entries(variants).forEach(([key, bt]) => {
      results[key] = bt
      results[`${key}HC`] = transform(bt, flavor, ' High Contrast', '#000000', false, true)
      results[`${key}Eggshell`] = transform(bt, flavor, ' Eggshell', null, true, false)
    })
  }

  // Handle Dracula Original separately if it exists
  try {
    const draculaYamlFile = await readFile(join(__dirname, '..', 'src', 'dracula.yml'), 'utf-8')
    const rawDracula = load(draculaYamlFile, { schema })
    for (const key of Object.keys(rawDracula.colors)) {
      if (!rawDracula.colors[key]) delete rawDracula.colors[key]
    }
    const draculaBase = { ..._.cloneDeep(rawDracula), name: 'Dracpurp Original' }
    results['dracula'] = draculaBase
    results['draculaHC'] = transform(draculaBase, flavors[0], ' High Contrast', '#000000', false, true)
    results['draculaEggshell'] = transform(draculaBase, flavors[0], ' Eggshell', null, true, false)
  } catch (e) {}

  return results
}
