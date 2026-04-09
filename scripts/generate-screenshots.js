const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const { createHighlighter } = require('shiki')

async function generateScreenshots() {
  const THEME_DIR = path.join(__dirname, '..', 'theme')

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

  const baseThemePath = path.join(THEME_DIR, 'dracpurp.json')
  const baseThemeData = JSON.parse(fs.readFileSync(baseThemePath, 'utf-8'))
  const baseHighlighter = await createHighlighter({
    themes: [baseThemeData],
    langs: ['typescript', 'java', 'csharp'],
  })

  for (const sample of SAMPLES) {
    console.log(`Generating screenshot for ${sample.name}...`)
    const sampleCode = fs.readFileSync(path.join(__dirname, '..', sample.file), 'utf-8')
    const htmlCode = baseHighlighter.codeToHtml(sampleCode, {
      lang: sample.lang,
      theme: baseThemeData.name,
    })

    const colors = baseThemeData.colors || {}
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --bg: ${colors['editor.background'] || '#100e12'};
      --fg: ${colors['editor.foreground'] || '#e8e8e8'};
      --title-bg: ${colors['titleBar.activeBackground'] || '#11021a'};
      --title-fg: ${colors['titleBar.activeForeground'] || '#e8e8e8'};
      --activity-bg: ${colors['activityBar.background'] || '#11021a'};
      --status-bg: ${colors['statusBar.background'] || '#11021a'};
      --line-number: ${colors['editorLineNumber.foreground'] || '#4b2a5e'};
    }
    body { margin: 0; background-color: var(--bg); color: var(--fg); font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .vscode-window { flex: 1; display: flex; flex-direction: column; }
    .title-bar { height: 35px; background-color: var(--title-bg); display: flex; align-items: center; justify-content: center; font-size: 12px; }
    .main-content { flex: 1; display: flex; }
    .activity-bar { width: 48px; background-color: var(--activity-bg); }
    .side-bar { width: 260px; background-color: var(--bg); border-right: 1px solid #35094e; }
    .editor-area { flex: 1; display: flex; flex-direction: column; background-color: var(--bg); }
    .tabs-container { height: 35px; background-color: var(--title-bg); display: flex; }
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
    <div class="title-bar"><span>${sample.name} — Dracpurp</span></div>
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
    await page.waitForTimeout(500)
    const screenshotPath = path.join(__dirname, '..', `screenshot-lang-${sample.lang}.png`)
    await page.screenshot({ path: screenshotPath })
    console.log(`Saved: ${screenshotPath}`)
  }

  // Also regenerate variant screenshots for README
  const variantFiles = [
      { file: 'dracpurp.json', output: 'screenshot-dracpurp.png' },
      { file: 'dracpurp-baseHC.json', output: 'screenshot-dracpurp-baseHC.png' },
      { file: 'dracpurp-baseEggshell.json', output: 'screenshot-dracpurp-baseEggshell.png' },
      { file: 'dracpurp-baseHCEggshell.json', output: 'screenshot-dracpurp-baseHCEggshell.png' }
  ]

  const tsCode = fs.readFileSync(path.join(__dirname, '..', 'samples/battle-strategy.ts'), 'utf-8')

  for (const v of variantFiles) {
      console.log(`Generating variant screenshot: ${v.file}`)
      const themeData = JSON.parse(fs.readFileSync(path.join(THEME_DIR, v.file), 'utf-8'))
      const highlighter = await createHighlighter({ themes: [themeData], langs: ['typescript'] })
      const htmlCode = highlighter.codeToHtml(tsCode, { lang: 'typescript', theme: themeData.name })
      const colors = themeData.colors || {}

      const htmlContent = `
<!DOCTYPE html>
<html>
<head><style>
:root { --bg: ${colors['editor.background']}; --fg: ${colors['editor.foreground']}; --title-bg: ${colors['titleBar.activeBackground']}; --line-number: ${colors['editorLineNumber.foreground']}; }
body { margin: 0; background-color: var(--bg); color: var(--fg); font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.vscode-window { flex: 1; display: flex; flex-direction: column; }
.title-bar { height: 35px; background-color: var(--title-bg); display: flex; align-items: center; justify-content: center; font-size: 12px; }
.main-content { flex: 1; display: flex; }
.activity-bar { width: 48px; background-color: var(--title-bg); }
.side-bar { width: 260px; background-color: var(--bg); border-right: 1px solid #35094e; }
.editor-area { flex: 1; display: flex; flex-direction: column; background-color: var(--bg); }
.tabs-container { height: 35px; background-color: var(--title-bg); display: flex; }
.tab { padding: 0 20px; display: flex; align-items: center; font-size: 12px; color: var(--fg); background-color: var(--bg); border-right: 1px solid #35094e; }
.editor-content { flex: 1; display: flex; font-family: monospace; font-size: 15px; line-height: 1.6; }
.line-numbers { width: 50px; padding: 20px 0; text-align: right; padding-right: 15px; color: var(--line-number); }
.code-view { flex: 1; padding: 20px 10px; }
pre { margin: 0; background-color: transparent !important; }
.status-bar { height: 22px; background-color: var(--title-bg); }
</style></head>
<body><div class="vscode-window"><div class="title-bar"><span>${v.file} — Dracpurp</span></div><div class="main-content"><div class="activity-bar"></div><div class="side-bar"></div><div class="editor-area"><div class="tabs-container"><div class="tab">battle-strategy.ts</div></div><div class="editor-content"><div class="line-numbers">${Array.from({ length: 35 }, (_, i) => `<div>${i + 1}</div>`).join('')}</div><div class="code-view">${htmlCode}</div></div></div></div><div class="status-bar"></div></div></body></html>`

      await page.setContent(htmlContent)
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(__dirname, '..', v.output) })
  }

  await browser.close()
}

generateScreenshots().catch(console.error)
