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

  function transform(theme, nameSuffix, backgrounds, isItalic) {
    const t = _.cloneDeep(theme)
    t.name = `${theme.name}${nameSuffix}`

    // Apply Tiered Backgrounds
    if (backgrounds) {
      t.colors['editor.background'] = backgrounds.BG
      t.colors['sideBar.background'] = backgrounds.BG_SIDEBAR
      t.colors['activityBar.background'] = backgrounds.BG_TITLE
      t.colors['titleBar.activeBackground'] = backgrounds.BG_TITLE
      t.colors['panel.background'] = backgrounds.BG_SIDEBAR
    }

    if (isItalic) {
        // Apply Italic Flow to Keywords, Parameters, and Comments
        const italicScopes = ['keyword', 'parameter', 'comment']

        // Semantic Token Mapping
        if (t.semanticTokenColors) {
            for (const key of Object.keys(t.semanticTokenColors)) {
                if (italicScopes.some(s => key.includes(s))) {
                    if (typeof t.semanticTokenColors[key] === 'string') {
                        t.semanticTokenColors[key] = {
                            foreground: t.semanticTokenColors[key],
                            fontStyle: 'italic'
                        }
                    } else {
                        t.semanticTokenColors[key].fontStyle = 'italic'
                    }
                }
            }
        }

        // TextMate Mapping
        t.tokenColors = t.tokenColors.map(tc => {
            const scope = Array.isArray(tc.scope) ? tc.scope.join(' ') : (tc.scope || '')
            if (italicScopes.some(s => scope.includes(s))) {
                return {
                    ...tc,
                    settings: { ...tc.settings, fontStyle: 'italic' }
                }
            }
            return tc
        })
    }

    return t
  }

  // Optimized Lineage
  const baseOptimized = cleanTheme(rawOptimized)
  baseOptimized.semanticTokenColors = {
      "variable": palette.optimized.WORKHORSE,
      "property": palette.optimized.WORKHORSE,
      "string": palette.optimized.WORKHORSE,
      "number": palette.optimized.WORKHORSE,
      "regexp": palette.optimized.WORKHORSE,
      "parameter": palette.optimized.PARAMETER,
      "method": palette.optimized.FUNCTION,
      "function": palette.optimized.FUNCTION,
      "keyword": palette.optimized.KEYWORD,
      "class": palette.optimized.PURPLE,
      "interface": palette.optimized.PURPLE,
      "namespace": palette.optimized.PURPLE,
      "type": palette.optimized.CYAN,
      "enum": palette.optimized.CYAN,
      "struct": palette.optimized.CYAN,
      "typeParameter": palette.optimized.CYAN,
      "comment": palette.optimized.COMMENT
  }

  const optBG = {
      BG: palette.optimized.BG,
      BG_SIDEBAR: palette.optimized.BG_SIDEBAR,
      BG_TITLE: palette.optimized.BG_TITLE
  }
  const optBGHC = {
      BG: palette.hc_optimized.BG,
      BG_SIDEBAR: palette.hc_optimized.BG_SIDEBAR,
      BG_TITLE: palette.hc_optimized.BG_TITLE
  }

  results['base'] = transform(baseOptimized, '', optBG, false)
  results['nightOwlItalic'] = transform(baseOptimized, ' (Night Owl Italic)', optBG, true)
  results['baseHC'] = transform(baseOptimized, ' High Contrast', optBGHC, false)
  results['nightOwlItalicHC'] = transform(baseOptimized, ' High Contrast Italic', optBGHC, true)

  // Original Lineage (Simplified)
  const baseOriginal = cleanTheme(rawOriginal)
  baseOriginal.name = 'Dracpurp Original'; results['dracula'] = baseOriginal

  return results
}
