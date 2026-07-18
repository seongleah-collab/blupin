import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts are self-hosted in public/fonts (latin subsets) so renders don't
// need network access from inside the headless browser.
const load = (family: string, file: string, weight: string) =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight});

for (const w of ['400', '500', '600', '700']) {
  load('Inter', `Inter-${w}.woff2`, w);
}
for (const w of ['400', '500', '700']) {
  load('JetBrains Mono', `JetBrainsMono-${w}.woff2`, w);
}

export const FONT_SANS = `Inter, -apple-system, sans-serif`;
export const FONT_MONO = `'JetBrains Mono', monospace`;

export const COLORS = {
  cream: '#F5F6EF',
  creamCard: '#FDFDF9',
  ink: '#1A1A1A',
  inkSoft: '#6B6B62',
  grid: 'rgba(60, 70, 40, 0.10)',
  // Accent family: bright orange (keys kept for history; values are orange).
  green: '#FFA13D',
  greenBright: '#FF8C1A',
  greenDark: '#C2570F',
  greenWash: '#FFE3C0',
  orange: '#C25E33',
  dark: '#1D1F1C',
  darkSoft: '#2A2D29',
  darkText: '#E8EAE4',
  darkDim: '#5C6058',
};
