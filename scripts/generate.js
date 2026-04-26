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

  function transform(theme, nameSuffix, bgSet, useEggshell, isHC, lineageColors, isItalic = false) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`

    if (isHC && bgSet) {
      t.colors['editor.background'] = bgSet.BG
      t.colors['sideBar.background'] = bgSet.BG_SIDEBAR
      t.colors['activityBar.background'] = bgSet.BG_TITLE
      t.colors['titleBar.activeBackground'] = bgSet.BG_TITLE
      t.colors['panel.background'] = bgSet.BG_SIDEBAR
    } else if (isHC) {
        t.colors['editor.background'] = '#000000'
    }

    if (t.tokenColors) {
      const italicScopes = ['keyword', 'parameter', 'comment']
      const nonItalicScopes = ['class', 'method', 'function', 'interface', 'namespace', 'struct']

      t.tokenColors = t.tokenColors.map(tc => {
        if (!tc.settings) return tc
        const newTc = _.cloneDeep(tc)
        const scope = Array.isArray(newTc.scope) ? newTc.scope.join(' ') : (newTc.scope || '')

        // Enforce Non-Italic
        if (nonItalicScopes.some(s => scope.includes(s))) {
            newTc.settings.fontStyle = ''
        } else if (isItalic && italicScopes.some(s => scope.includes(s))) {
            newTc.settings.fontStyle = 'italic'
        }

        // Handle Eggshell Variables
        if (useEggshell) {
           const variableScopes = ['variable', 'variable.parameter', 'entity.name.variable.parameter', 'variable.other.readwrite']
           const isVariableToken = variableScopes.some(vs => scope.includes(vs))
           const currentFg = newTc.settings.foreground?.toUpperCase()
           const orangeTarget = lineageColors.ORANGE.toUpperCase()

           if (isVariableToken && currentFg === orangeTarget) {
                newTc.settings.foreground = eggshellVal
           }
        }

        return newTc
      })

      if (t.semanticTokenColors) {
          for (const key of Object.keys(t.semanticTokenColors)) {
              if (nonItalicScopes.some(s => key.includes(s))) {
                  if (typeof t.semanticTokenColors[key] === 'string') {
                      t.semanticTokenColors[key] = { foreground: t.semanticTokenColors[key], fontStyle: '' }
                  } else {
                      t.semanticTokenColors[key].fontStyle = ''
                  }
              } else if (isItalic && italicScopes.some(s => key.includes(s))) {
                  if (typeof t.semanticTokenColors[key] === 'string') {
                      t.semanticTokenColors[key] = { foreground: t.semanticTokenColors[key], fontStyle: 'italic' }
                  } else {
                      t.semanticTokenColors[key].fontStyle = 'italic'
                  }
              }
          }
      }
    }
    return t
  }

  // Optimized Lineage
  const baseOptimized = cleanTheme(rawOptimized)
  baseOptimized.semanticTokenColors = {
      "variable": palette.optimized.WORKHORSE,
      "variable.readonly": palette.optimized.WORKHORSE,
      "variable.declaration": palette.optimized.WORKHORSE,
      "property": palette.optimized.WORKHORSE,
      "property.readonly": palette.optimized.WORKHORSE,
      "member": palette.optimized.WORKHORSE,
      "string": palette.optimized.WORKHORSE,
      "number": palette.optimized.WORKHORSE,
      "regexp": palette.optimized.WORKHORSE,
      "parameter": palette.optimized.PARAMETER,
      "method": palette.optimized.FUNCTION,
      "function": palette.optimized.FUNCTION,
      "keyword": palette.optimized.KEYWORD,
      "class": palette.optimized.CLASS,
      "interface": palette.optimized.CLASS,
      "namespace": palette.optimized.CLASS,
      "type": palette.optimized.TYPE,
      "type.defaultLibrary": palette.optimized.KEYWORD,
      "enum": palette.optimized.TYPE,
      "struct": palette.optimized.TYPE,
      "typeParameter": palette.optimized.TYPE,
      "comment": palette.optimized.COMMENT
  }

  const optBG = {
      BG: palette.optimized.BG,
      BG_SIDEBAR: palette.optimized.BG_SIDEBAR || palette.optimized.BG,
      BG_TITLE: palette.optimized.BG_TITLE || palette.optimized.BG
  }
  const optBGHC = {
      BG: palette.hc_optimized.BG,
      BG_SIDEBAR: palette.hc_optimized.BG_SIDEBAR,
      BG_TITLE: palette.hc_optimized.BG_TITLE
  }

  const optVariants = {
      'base': baseOptimized,
      'nightOwlItalic': { ...baseOptimized, name: 'Dracpurp (Night Owl Italic)' },
      'noItalic': {
          ...baseOptimized,
          name: 'Dracpurp (No Italic)',
          tokenColors: baseOptimized.tokenColors.map(obj => {
              const newObj = _.cloneDeep(obj)
              if (newObj?.settings?.fontStyle) {
                  newObj.settings.fontStyle = newObj.settings.fontStyle.replace('italic', '').trim()
              }
              return newObj
          })
      }
  }

  Object.entries(optVariants).forEach(([key, bt]) => {
      const isItalic = key === 'nightOwlItalic'
      results[key] = transform(bt, '', optBG, false, false, palette.optimized, isItalic)
      results[`${key}HC`] = transform(bt, ' High Contrast', optBGHC, false, true, palette.optimized, isItalic)
      results[`${key}Eggshell`] = transform(bt, ' Eggshell', optBG, true, false, palette.optimized, isItalic)
  })

  // Original Lineage (Completely untouched except for name)
  const baseOriginal = { ...cleanTheme(rawOriginal), name: 'Dracpurp Original' }
  results['dracula'] = baseOriginal
  results['draculaHC'] = transform(baseOriginal, ' High Contrast', null, false, true, palette.dracula)
  results['draculaEggshell'] = transform(baseOriginal, ' Eggshell', null, true, false, palette.dracula)

  return results
}
