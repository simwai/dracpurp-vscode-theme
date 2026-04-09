const fs = require('node:fs')
const path = require('node:path')
const generate = require('./generate')

const THEME_DIR = path.join(__dirname, '..', 'theme')

if (!fs.existsSync(THEME_DIR)) {
  fs.mkdirSync(THEME_DIR)
}

module.exports = async () => {
  const flavors = await generate()

  const writePromises = []

  for (const [key, variants] of Object.entries(flavors)) {
    const prefix = key === 'dracpurp' ? 'dracpurp' : `dracpurp-${key}`

    writePromises.push(
      fs.promises.writeFile(
        path.join(THEME_DIR, `${prefix}.json`),
        JSON.stringify(variants.base, null, 4)
      ),
      fs.promises.writeFile(
        path.join(THEME_DIR, `${prefix}-noItalic.json`),
        JSON.stringify(variants.noItalic, null, 4),
      ),
      fs.promises.writeFile(
        path.join(THEME_DIR, `${prefix}-nightOwlItalic.json`),
        JSON.stringify(variants.nightOwlItalic, null, 4),
      ),
    )
  }

  return Promise.all(writePromises)
}

if (require.main === module) {
  module.exports()
}
