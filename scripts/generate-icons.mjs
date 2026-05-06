import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'public', 'icons');

const palette = {
  wine: '#6E0D25',
  cream: '#FFFFB3',
  bronze: '#774E24',
  walnut: '#6A381F',
  sand: '#DCAB6B',
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
      <stop offset="0%" stop-color="${palette.wine}"/>
      <stop offset="60%" stop-color="${palette.walnut}"/>
      <stop offset="100%" stop-color="${palette.bronze}"/>
    </linearGradient>
    <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.cream}"/>
      <stop offset="100%" stop-color="${palette.sand}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.cream}" stroke-opacity="0.18" stroke-width="${stroke}"/>
  <path d="${dropPath}" fill="url(#drop)" stroke="${palette.cream}" stroke-width="${stroke * 0.6}" stroke-linejoin="round"/>
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
