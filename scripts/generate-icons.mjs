import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'public', 'icons');

const palette = {
  background: '#F8F9F4',
  card: '#FFFFFF',
  primary: '#2A9D8F',
  secondary: '#E9C46A',
  text: '#264653',
};

function buildSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  const stroke = Math.max(2, size * 0.045);
  const dropPath = `
    M ${cx} ${cy - r * 0.55}
    C ${cx + r * 0.5} ${cy - r * 0.1},
      ${cx + r * 0.55} ${cy + r * 0.45},
      ${cx} ${cy + r * 0.6}
    C ${cx - r * 0.55} ${cy + r * 0.45},
      ${cx - r * 0.5} ${cy - r * 0.1},
      ${cx} ${cy - r * 0.55} Z
  `;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.primary}"/>
      <stop offset="70%" stop-color="${palette.text}"/>
      <stop offset="110%" stop-color="${palette.primary}"/>
    </linearGradient>
    <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.card}"/>
      <stop offset="100%" stop-color="${palette.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.card}" stroke-opacity="0.18" stroke-width="${stroke}"/>
  <path d="${dropPath}" fill="url(#drop)" stroke="${palette.card}" stroke-width="${stroke * 0.6}" stroke-linejoin="round"/>
</svg>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const svg = buildSvg(size);
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(path.join(outDir, `icon${size}.png`), buf);
    console.log(`wrote icon${size}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
