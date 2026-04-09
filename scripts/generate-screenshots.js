const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const { createHighlighter } = require('shiki')

const THEMES = [
  { name: 'Dracpurp', file: 'theme/dracpurp.json', output: 'screenshot-dracpurp.png' },
  {
    name: 'Dracpurp (Night Owl Italic)',
    file: 'theme/dracpurp-nightOwlItalic.json',
    output: 'screenshot-dracpurp-night-owl-italic.png',
  },
  {
    name: 'Dracpurp (No Italic)',
    file: 'theme/dracpurp-noItalic.json',
    output: 'screenshot-dracpurp-no-italic.png',
  },
  {
    name: 'Dracpurp High Contrast',
    file: 'theme/dracpurp-highContrast.json',
    output: 'screenshot-dracpurp-high-contrast.png',
  },
]

const SAMPLE_CODE_PATH = path.join(__dirname, '..', 'samples', 'battle-strategy.ts')
const sampleCode = fs.readFileSync(SAMPLE_CODE_PATH, 'utf-8')

async function generateScreenshots() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 2, // High resolution for sharp screenshots
  })
  const page = await context.newPage()

  for (const themeInfo of THEMES) {
    console.log(`Generating screenshot for ${themeInfo.name}...`)
    const themePath = path.join(__dirname, '..', themeInfo.file)
    if (!fs.existsSync(themePath)) {
      console.error(`Theme file not found: ${themePath}. Run build first.`)
      continue
    }
    const themeData = JSON.parse(fs.readFileSync(themePath, 'utf-8'))

    // Create highlighter with the custom theme
    const highlighter = await createHighlighter({
      themes: [themeData],
      langs: ['typescript'],
    })

    const htmlCode = highlighter.codeToHtml(sampleCode, {
      lang: 'typescript',
      theme: themeData.name,
    })

    const colors = themeData.colors || {}

    // Mock VS Code UI Template with improved accuracy (Line Numbers, etc.)
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
      --activity-fg: ${colors['activityBar.foreground'] || '#ffffff'};
      --activity-inactive: ${colors['activityBar.inactiveForeground'] || '#8b6b9e'};
      --sidebar-bg: ${colors['sideBar.background'] || '#11021a'};
      --sidebar-fg: ${colors['sideBar.foreground'] || '#e8e8e8'};
      --sidebar-border: ${colors['sideBar.border'] || '#35094e'};
      --tabs-bg: ${colors['editorGroupHeader.tabsBackground'] || '#11021a'};
      --tab-active-bg: ${colors['tab.activeBackground'] || '#100e12'};
      --tab-active-fg: ${colors['tab.activeForeground'] || '#ffffff'};
      --tab-inactive-bg: ${colors['tab.inactiveBackground'] || '#11021a'};
      --tab-inactive-fg: ${colors['tab.inactiveForeground'] || '#8b6b9e'};
      --tab-border: ${colors['tab.border'] || '#35094e'};
      --status-bg: ${colors['statusBar.background'] || '#11021a'};
      --status-fg: ${colors['statusBar.foreground'] || '#e8e8e8'};
      --line-number: ${colors['editorLineNumber.foreground'] || '#4b2a5e'};
      --line-highlight: ${colors['editor.lineHighlightBackground'] || '#2d074460'};
      --selection: ${colors['editor.selectionBackground'] || '#2d0744'};
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .vscode-window {
      flex: 1;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .title-bar {
      height: 35px;
      background-color: var(--title-bg);
      color: var(--title-fg);
      display: flex;
      align-items: center;
      padding: 0 15px;
      font-size: 12px;
      border-bottom: 1px solid var(--sidebar-border);
      justify-content: center;
      position: relative;
    }
    .window-controls {
      position: absolute;
      left: 15px;
      display: flex;
      gap: 8px;
    }
    .control {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .close { background-color: #ff5f56; }
    .minimize { background-color: #ffbd2e; }
    .maximize { background-color: #27c93f; }

    .main-content {
      flex: 1;
      display: flex;
    }
    .activity-bar {
      width: 48px;
      background-color: var(--activity-bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 10px;
      border-right: 1px solid var(--sidebar-border);
    }
    .activity-icon {
      width: 24px;
      height: 24px;
      margin-bottom: 20px;
      background-color: var(--activity-inactive);
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
    }
    .activity-icon.explorer {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M17.5 0h-9L7 1.5V6H2.5L1 7.5v15L2.5 24h12l1.5-1.5V18h4.5l1.5-1.5v-15L20.5 0h-3zM14.5 22.5h-12V7.5H7V18l1.5 1.5h6v3zM20.5 16.5h-12V1.5h9l3 3v12z'/%3E%3C/svg%3E");
    }
    .activity-icon.active {
      background-color: var(--activity-fg);
      border-left: 2px solid ${colors['activityBar.activeBorder'] || '#a025e7'};
    }
    .side-bar {
      width: 260px;
      background-color: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
    }
    .side-bar-header {
      padding: 10px 20px;
      color: var(--sidebar-fg);
      text-transform: uppercase;
      font-weight: 500;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .file-tree {
      flex: 1;
      padding: 0;
    }
    .file-item {
      padding: 6px 20px;
      font-size: 13px;
      display: flex;
      align-items: center;
      color: var(--sidebar-fg);
      opacity: 0.8;
    }
    .file-item.active {
      background-color: ${colors['list.activeSelectionBackground'] || '#2d074480'};
      color: ${colors['list.activeSelectionForeground'] || '#ffffff'};
      opacity: 1;
    }
    .editor-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--bg);
    }
    .tabs-container {
      height: 35px;
      background-color: var(--tabs-bg);
      display: flex;
      border-bottom: 1px solid var(--sidebar-border);
    }
    .tab {
      padding: 0 20px;
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--tab-inactive-fg);
      background-color: var(--tab-inactive-bg);
      border-right: 1px solid var(--tab-border);
      cursor: pointer;
    }
    .tab.active {
      color: var(--tab-active-fg);
      background-color: var(--tab-active-bg);
      position: relative;
    }
    .tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background-color: ${colors['tab.activeBorder'] || '#a025e7'};
    }
    .editor-content {
      flex: 1;
      overflow: hidden;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
      font-size: 15px;
      line-height: 1.6;
      display: flex;
    }
    .line-numbers {
      width: 50px;
      padding: 20px 0;
      text-align: right;
      padding-right: 15px;
      color: var(--line-number);
      font-size: 13px;
      user-select: none;
      background-color: var(--bg);
      border-right: 1px solid transparent;
    }
    .code-view {
      flex: 1;
      padding: 20px 10px;
      background-color: var(--bg);
    }
    pre {
      margin: 0;
      background-color: transparent !important;
    }
    .shiki {
      background-color: transparent !important;
    }
    .status-bar {
      height: 22px;
      background-color: var(--status-bg);
      color: var(--status-fg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      font-size: 11px;
    }
    .status-left, .status-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .status-item-blue {
      background-color: ${colors['statusBarItem.remoteBackground'] || '#a025e7'};
      height: 100%;
      padding: 0 10px;
      display: flex;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="vscode-window">
    <div class="title-bar">
      <div class="window-controls">
        <div class="control close"></div>
        <div class="control minimize"></div>
        <div class="control maximize"></div>
      </div>
      <span>battle-strategy.ts — Dracpurp</span>
    </div>
    <div class="main-content">
      <div class="activity-bar">
        <div class="activity-icon explorer active"></div>
        <div class="activity-icon" style="mask-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\'/%3E%3C/svg%3E')"></div>
        <div class="activity-icon" style="mask-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z\'/%3E%3C/svg%3E')"></div>
      </div>
      <div class="side-bar">
        <div class="side-bar-header">Explorer</div>
        <div class="file-tree">
          <div class="file-item">samples</div>
          <div class="file-item active">battle-strategy.ts</div>
          <div class="file-item">README.md</div>
        </div>
      </div>
      <div class="editor-area">
        <div class="tabs-container">
          <div class="tab active">battle-strategy.ts</div>
          <div class="tab">README.md</div>
        </div>
        <div class="editor-content">
          <div class="line-numbers">
            ${Array.from({ length: 35 }, (_, i) => `<div>${i + 1}</div>`).join('')}
          </div>
          <div class="code-view">
            ${htmlCode}
          </div>
        </div>
      </div>
    </div>
    <div class="status-bar">
      <div class="status-left">
        <div class="status-item-blue">WS: Dracpurp</div>
        <span>Main*</span>
        <span>0 \u24BE 0 \u26A0</span>
      </div>
      <div class="status-right">
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span>TypeScript</span>
      </div>
    </div>
  </div>
</body>
</html>
`

    await page.setContent(htmlContent)
    // Wait for any potential rendering
    await page.waitForTimeout(500)

    const screenshotPath = path.join(__dirname, '..', themeInfo.output)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Saved: ${screenshotPath}`)
  }

  await browser.close()
  console.log('All screenshots generated successfully.')
}

generateScreenshots().catch((err) => {
  console.error('Error generating screenshots:', err)
  process.exit(1)
})
