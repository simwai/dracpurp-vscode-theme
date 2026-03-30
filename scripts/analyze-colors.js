const tinycolor = require('tinycolor2');

const bg = '#100e12';
const colors = {
  CYAN: '#8BE9FD',
  GREEN: '#50FA7B',
  ORANGE: '#ffb347',
  PINK: '#FF79C6',
  PURPLE: '#BD93F9',
  RED: '#ff6b6b',
  YELLOW: '#F1FA8C',
  FG: '#e8e8e8'
};

console.log('Color Analysis (against BG: ' + bg + '):');
console.log('-----------------------------------------');
for (const [name, hex] of Object.entries(colors)) {
  const color = tinycolor(hex);
  const luminance = color.getLuminance();
  const contrast = tinycolor.readability(bg, hex);
  const hsv = color.toHsv();
  console.log(`${name.padEnd(10)}: ${hex} | Luminance: ${luminance.toFixed(3)} | Contrast: ${contrast.toFixed(2)} | Saturation: ${Math.round(hsv.s * 100)}% | Value: ${Math.round(hsv.v * 100)}%`);
}
