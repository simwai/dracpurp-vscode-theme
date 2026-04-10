const fs = require('node:fs')
const path = require('node:path')
const generate = require('./generate')

const THEME_DIR = path.join(__dirname, '..', 'theme')

if (!fs.existsSync(THEME_DIR)) {
  fs.mkdirSync(THEME_DIR)
}

module.exports = async () => {
  const themes = await generate()

  const promises = Object.entries(themes).map(([key, data]) => {
    let filename = 'dracpurp'
    if (key !== 'base') {
        filename += `-${key}`
    }
    return fs.promises.writeFile(
      path.join(THEME_DIR, `${filename}.json`),
      JSON.stringify(data, null, 4)
    )
  })

  return Promise.all(promises)
}

if (require.main === module) {
  module.exports()
}
