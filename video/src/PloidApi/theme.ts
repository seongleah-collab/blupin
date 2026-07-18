import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts are self-hosted in public/fonts (latin subsets) so renders don't
// need network access from inside the headless browser.
const load = (family: string, file: string, weight: string, style = 'normal') =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight, style});

for (const w of ['400', '500', '600', '700']) {
  load('Inter', `Inter-${w}.woff2`, w);
}
for (const w of ['400', '500', '700']) {
  load('JetBrains Mono', `JetBrainsMono-${w}.woff2`, w);
}
export const FONT_SANS = `Inter, -apple-system, sans-serif`;
export const FONT_MONO = `'JetBrains Mono', monospace`;
// Display font follows the body font — Fraunces woff2s stay in
// public/fonts if a serif look is ever wanted again.
export const FONT_SERIF = FONT_SANS;

export const COLORS = {
  // Warm paper + ink, punchy orange. Ploid's own look — no dot grid,
  // no terminal, editorial type.
  paper: '#FAF6EE',
  paperCard: '#FFFDF8',
  ink: '#191410',
  inkSoft: '#7A7166',
  orange: '#FF6B1A',
  orangeDeep: '#C74E00',
  orangeWash: '#FFE4CB',

  // Legacy keys still referenced by shared bits.
  cream: '#FAF6EE',
  creamCard: '#FFFDF8',
  grid: 'rgba(60, 50, 30, 0.10)',
  green: '#FF9C42',
  greenBright: '#FF6B1A',
  greenDark: '#C74E00',
  greenWash: '#FFE4CB',
  dark: '#191410',
  darkSoft: '#2E2620',
  darkText: '#F4EEE4',
  darkDim: '#6B6157',
};
