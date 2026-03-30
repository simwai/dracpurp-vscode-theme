const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const THEMES = [
    { name: 'dracpurp', file: 'theme/dracpurp.json', output: 'screenshot-dracpurp.png' },
    { name: 'dracpurp-nightOwlItalic', file: 'theme/dracpurp-nightOwlItalic.json', output: 'screenshot-dracpurp-night-owl-italic.png' },
    { name: 'dracpurp-noItalic', file: 'theme/dracpurp-noItalic.json', output: 'screenshot-dracpurp-no-italic.png' }
];

const SAMPLE_CODE_PATH = path.join(__dirname, '..', 'samples', 'battle-strategy.ts');
const sampleCode = fs.readFileSync(SAMPLE_CODE_PATH, 'utf-8');

async function generateScreenshots() {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1400, height: 1000 }
    });
    const page = await context.newPage();

    for (const themeInfo of THEMES) {
        console.log(`Generating screenshot for ${themeInfo.name}...`);
        const themePath = path.join(__dirname, '..', themeInfo.file);
        if (!fs.existsSync(themePath)) {
            console.error(`Theme file not found: ${themePath}. Run build first.`);
            continue;
        }
        const themeData = JSON.parse(fs.readFileSync(themePath, 'utf-8'));

        // Using a more stable playground that provides direct access to monaco
        await page.goto('https://microsoft.github.io/monaco-editor/playground.html');

        // Wait for monaco to be ready
        await page.waitForFunction(() => typeof window.monaco !== 'undefined');

        await page.evaluate(async ({ code, themeData }) => {
            const monaco = window.monaco;

            // Define the theme for Monaco
            // Tokens need careful mapping from VS Code to Monaco's simplified system
            const rules = (themeData.tokenColors || []).flatMap(tc => {
                const scopes = Array.isArray(tc.scope) ? tc.scope : (tc.scope ? [tc.scope] : []);
                return scopes.map(s => ({
                    token: s,
                    foreground: tc.settings.foreground,
                    fontStyle: tc.settings.fontStyle
                }));
            });

            monaco.editor.defineTheme('dracpurp-dynamic', {
                base: 'vs-dark',
                inherit: true,
                rules: rules,
                colors: themeData.colors || {}
            });

            monaco.editor.setTheme('dracpurp-dynamic');

            const models = monaco.editor.getModels();
            if (models.length > 0) {
                models[0].setValue(code);
                monaco.editor.setModelLanguage(models[0], 'typescript');
            }

            // Hide UI elements to focus on the editor area
            // These selectors are specific to the current Monaco Playground layout
            const elementsToHide = [
                'header',
                '.sidebar',
                '.navbar',
                '.footer',
                '.playground-header'
            ];
            elementsToHide.forEach(selector => {
                const el = document.querySelector(selector);
                if (el) el.style.display = 'none';
            });

            // Adjust editor container for a cleaner "full" look
            const container = document.querySelector('.editor-container');
            if (container) {
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
            }

            window.dispatchEvent(new Event('resize'));
        }, { code: sampleCode, themeData });

        // Wait for the theme to apply and the syntax to be colorized
        await page.waitForTimeout(3000);

        const screenshotPath = path.join(__dirname, '..', themeInfo.output);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved: ${screenshotPath}`);
    }

    await browser.close();
    console.log('All screenshots generated successfully.');
}

generateScreenshots().catch(err => {
    console.error('Error generating screenshots:', err);
    process.exit(1);
});
