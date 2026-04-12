const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const { createHighlighter } = require('shiki')

async function generateScreenshots() {
  const ROOT_DIR = path.join(__dirname, '..')
  const THEME_DIR = path.join(ROOT_DIR, 'theme')
  const themeFiles = fs.readdirSync(THEME_DIR).filter(f => f.endsWith('.json'))

  // Delete old screenshots before regeneration
  const oldScreenshots = fs.readdirSync(ROOT_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
  for (const screenshot of oldScreenshots) {
    fs.unlinkSync(path.join(ROOT_DIR, screenshot))
    console.log(`Deleted old screenshot: ${screenshot}`)
  }

  const SAMPLES = [
    { name: 'battle-strategy.ts', file: 'samples/battle-strategy.ts', lang: 'typescript' },
    { name: 'SwordArtOnline.java', file: 'samples/SwordArtOnline.java', lang: 'java' },
    { name: 'CyberpunkEdgerunners.cs', file: 'samples/CyberpunkEdgerunners.cs', lang: 'csharp' }
  ]

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // Optimization: Pre-load highlighter with all themes to avoid multiple instances
  const themes = themeFiles.map(f => JSON.parse(fs.readFileSync(path.join(THEME_DIR, f), 'utf-8')))
  const highlighter = await createHighlighter({
    themes: themes,
    langs: ['typescript', 'java', 'csharp'],
  })

  for (const themeData of themes) {
    const themeName = themeData.name
    const themeKey = themeFiles.find(f => JSON.parse(fs.readFileSync(path.join(THEME_DIR, f), 'utf-8')).name === themeName).replace('.json', '')

    console.log(`Generating screenshots for theme: ${themeName}...`)

    for (const sample of SAMPLES) {
      const sampleCode = fs.readFileSync(path.join(ROOT_DIR, sample.file), 'utf-8')
      const htmlCode = highlighter.codeToHtml(sampleCode, {
        lang: sample.lang,
        theme: themeName,
      })

      const colors = themeData.colors || {}
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --bg: ${colors['editor.background'] || '#100e12'};
      --fg: ${colors['editor.foreground'] || '#e8e8e8'};
      --title-bg: ${colors['titleBar.activeBackground'] || '#11021a'};
      --line-number: ${colors['editorLineNumber.foreground'] || '#4b2a5e'};
    }
    body { margin: 0; background-color: var(--bg); color: var(--fg); font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .vscode-window { flex: 1; display: flex; flex-direction: column; }
    .title-bar { height: 35px; background-color: var(--title-bg); display: flex; align-items: center; justify-content: center; font-size: 12px; }
    .main-content { flex: 1; display: flex; }
    .activity-bar { width: 48px; background-color: var(--title-bg); }
    .side-bar { width: 260px; background-color: ${colors['sideBar.background'] || 'var(--bg)'}; border-right: 1px solid #35094e; }
    .editor-area { flex: 1; display: flex; flex-direction: column; background-color: var(--bg); }
    .tabs-container { height: 35px; background-color: ${colors['titleBar.activeBackground'] || 'var(--title-bg)'}; display: flex; }
    .tab { padding: 0 20px; display: flex; align-items: center; font-size: 12px; color: var(--fg); background-color: var(--bg); border-right: 1px solid #35094e; }
    .editor-content { flex: 1; display: flex; font-family: monospace; font-size: 15px; line-height: 1.6; }
    .line-numbers { width: 50px; padding: 20px 0; text-align: right; padding-right: 15px; color: var(--line-number); }
    .code-view { flex: 1; padding: 20px 10px; }
    pre { margin: 0; background-color: transparent !important; }
    .status-bar { height: 22px; background-color: var(--status-bg); }
  </style>
</head>
<body>
  <div class="vscode-window">
    <div class="title-bar"><span>${sample.name} — ${themeName}</span></div>
    <div class="main-content">
      <div class="activity-bar"></div>
      <div class="side-bar"></div>
      <div class="editor-area">
        <div class="tabs-container"><div class="tab">${sample.name}</div></div>
        <div class="editor-content">
          <div class="line-numbers">
            ${Array.from({ length: 35 }, (_, i) => `<div>${i + 1}</div>`).join('')}
          </div>
          <div class="code-view">${htmlCode}</div>
        </div>
      </div>
    </div>
    <div class="status-bar"></div>
  </div>
</body>
</html>
`
      await page.setContent(htmlContent)
      await page.waitForTimeout(300)
      const screenshotPath = path.join(ROOT_DIR, `screenshot-${themeKey}-${sample.lang}.png`)
      await page.screenshot({ path: screenshotPath })
      console.log(`Saved: ${screenshotPath}`)
    }
  }

  highlighter.dispose()
  await browser.close()
  console.log('All screenshots generated successfully.')
}

generateScreenshots().catch(console.error)
