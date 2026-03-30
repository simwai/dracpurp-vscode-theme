const tinycolor = require('tinycolor2');

const bg = '#100e12';
const targetLuminance = 0.40;
const colors = {
  CYAN: '#8BE9FD',
  GREEN: '#50FA7B',
  ORANGE: '#ffb347',
  PINK: '#FF79C6',
  PURPLE: '#BD93F9',
  RED: '#ff6b6b',
  YELLOW: '#F1FA8C',
};

function adjustToLuminance(name, hex, target) {
  let color = tinycolor(hex);
  let hsv = color.toHsv();

  let bestHex = hex;
  let minDiff = 1000;

  for (let v = 0; v <= 100; v++) {
      let testColor = tinycolor({ h: hsv.h, s: hsv.s, v: v / 100 });
      let diff = Math.abs(testColor.getLuminance() - target);
      if (diff < minDiff) {
          minDiff = diff;
          bestHex = testColor.toHexString();
      }
  }

  // If we can't reach it (like RED which is too dark at max V), try decreasing saturation
  if (minDiff > 0.01 && color.getLuminance() < target) {
      for (let s = hsv.s * 100; s >= 0; s--) {
          let testColor = tinycolor({ h: hsv.h, s: s / 100, v: 1.0 });
          let diff = Math.abs(testColor.getLuminance() - target);
          if (diff < minDiff) {
              minDiff = diff;
              bestHex = testColor.toHexString();
          }
      }
  }

  return bestHex;
}

console.log('Target Luminance: ' + targetLuminance);
console.log('-----------------------------------------');
for (const [name, hex] of Object.entries(colors)) {
  const newHex = adjustToLuminance(name, hex, targetLuminance);
  const color = tinycolor(newHex);
  console.log(`${name.padEnd(10)}: ${hex} -> ${newHex.toUpperCase()} | New Lum: ${color.getLuminance().toFixed(3)} | New Contrast: ${tinycolor.readability(bg, newHex).toFixed(2)} | S: ${Math.round(color.toHsv().s * 100)} V: ${Math.round(color.toHsv().v * 100)}`);
}
