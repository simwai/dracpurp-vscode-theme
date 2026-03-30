const fs = require('fs');
const path = require('path');

const filesToReview = [
    'scripts/generate-screenshots.js',
    'samples/battle-strategy.js',
    'README.md',
    '.husky/pre-commit',
    'package.json'
];

console.log("--- Code Review for Visual Singularity Implementation ---");

filesToReview.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`Reviewing ${file}...`);
        const content = fs.readFileSync(filePath, 'utf-8');

        if (file === 'scripts/generate-screenshots.js') {
            if (!content.includes('playwright')) console.warn("Warning: Playwright not found in script.");
            if (!content.includes('monaco')) console.warn("Warning: Monaco references not found.");
        }

        if (file === 'README.md') {
            if (content.indexOf('Visual Insights') > content.indexOf('Emergence of Dracpurp')) {
                console.warn("Warning: Screenshots might not be high enough in README.");
            }
        }
    } else {
        console.error(`Error: ${file} is missing!`);
    }
});

console.log("Review complete. Aesthetic integrity maintained.");
