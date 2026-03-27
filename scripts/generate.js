const { readFile } = require('fs').promises;
const { join } = require('path');
const { Type, Schema, load } = require('js-yaml');
const _ = require('lodash');
const tinycolor = require('tinycolor2');

const withAlphaType = new Type('!alpha', {
    kind: 'sequence',
    construct: ([hexRGB, alpha]) => hexRGB + alpha,
    represent: ([hexRGB, alpha]) => hexRGB + alpha,
});

const schema = Schema.create([withAlphaType]);

module.exports = async () => {
    const yamlFile = await readFile(
        join(__dirname, '..', 'src', 'dracpurp.yml'),
        'utf-8'
    );

    /** @type {Theme} */
    const base = load(yamlFile, { schema });

    // Remove nulls and other falsy values from colors
    for (const key of Object.keys(base.colors)) {
        if (!base.colors[key]) {
            delete base.colors[key];
        }
    }

    const baseClone1 = _.cloneDeep(base);
    const baseClone2 = _.cloneDeep(base);
    const baseClone3 = _.cloneDeep(base);

    const nightOwlItalic = baseClone3;
    const noItalic = {
        ...baseClone2,
        name: "Dracpurp (No Italic)",
        tokenColors: baseClone2.tokenColors.map(obj => {
            const newObj = _.cloneDeep(obj);
            if (newObj?.settings?.fontStyle) {
                newObj.settings.fontStyle = newObj.settings.fontStyle.replace('italic', '').trim();
            }
            return newObj;
        })
    };

    const newBase = {
        ...baseClone1,
        name: "Dracpurp",
        tokenColors: baseClone1.tokenColors.filter(obj => {
            return !obj?.name?.startsWith('OM_SETTING');
        })
    };

    return {
        base: newBase,
        nightOwlItalic: { ...nightOwlItalic, name: "Dracpurp (Night Owl Italic)" },
        noItalic
    };
};
