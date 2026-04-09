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

async function generateFlavor(filename) {
  const yamlFile = await readFile(join(__dirname, '..', 'src', filename), 'utf-8')

  /** @type {Theme} */
  const base = load(yamlFile, { schema })

  // Remove nulls and other falsy values from colors
  for (const key of Object.keys(base.colors)) {
    if (!base.colors[key]) {
      delete base.colors[key]
    }
  }

  const baseClone1 = _.cloneDeep(base)
  const baseClone2 = _.cloneDeep(base)
  const baseClone3 = _.cloneDeep(base)

  const nightOwlItalic = {
    ...baseClone3,
    name: `${baseClone3.name} (Night Owl Italic)`
  }

  const noItalic = {
    ...baseClone2,
    name: `${baseClone2.name} (No Italic)`,
    tokenColors: baseClone2.tokenColors.map((obj) => {
      const newObj = _.cloneDeep(obj)
      if (newObj?.settings?.fontStyle) {
        newObj.settings.fontStyle = newObj.settings.fontStyle.replace('italic', '').trim()
      }
      return newObj
    }),
  }

  const newBase = {
    ...baseClone1,
    name: baseClone1.name,
    tokenColors: baseClone1.tokenColors.filter((obj) => {
      return !obj?.name?.startsWith('OM_SETTING')
    }),
  }

  return {
    base: newBase,
    nightOwlItalic,
    noItalic,
  }
}

module.exports = async () => {
  const dracpurp = await generateFlavor('dracpurp.yml')
  const mocha = await generateFlavor('mocha.yml')
  const macchiato = await generateFlavor('macchiato.yml')
  const frappe = await generateFlavor('frappe.yml')

  return {
    dracpurp,
    mocha,
    macchiato,
    frappe
  }
}
