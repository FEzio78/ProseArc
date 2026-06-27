// Icon + logo generator for ProseArc.
//
// Produces the app icons (.ico + .png, in two colour treatments) and the README
// logo lockup from a single source design — the "swash arc" monogram: a serif
// "P" under a sweeping arc with an ink dot. The "P" is outlined from Georgia so
// the artwork is font-independent when rasterized.
//
// One-time build step (deps are NOT in package.json — install on demand):
//   npm install --no-save opentype.js sharp png-to-ico
//   node scripts/make-icons.mjs
//
// Outputs:
//   build/icon.ico        multi-size Windows icon (gold tile)  ← app default
//   build/icon.png        512px (gold tile)
//   build/icon-dark.ico   multi-size (dark tile) alternate
//   build/icon-dark.png   512px (dark tile)
//   assets/mark-gold.svg  transparent mark (gold), no tile
//   assets/mark-dark.svg  transparent mark (dark), no tile
//   assets/logo.svg       horizontal lockup (icon + wordmark)
//   assets/logo.png       880×220 lockup

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');
const assetsDir = path.join(root, 'assets');
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

const GOLD = '#C9A24B';
const INK = '#201E27';

const font = opentype.parse(fs.readFileSync('C:/Windows/Fonts/georgia.ttf'));

// Outline a string into an SVG path 'd', centred on (cx, cy) in the target box.
function centredText(text, fontSize, cx, cy) {
  const p = font.getPath(text, 0, 0, fontSize); // baseline at y=0
  const bb = p.getBoundingBox();
  const w = bb.x2 - bb.x1, h = bb.y2 - bb.y1;
  return { d: p.toPathData(2), tx: cx - (bb.x1 + w / 2), ty: cy - (bb.y1 + h / 2), w, h };
}

// The square app-icon tile (256 box, rounded corners, transparent outside).
function iconSvg(tile, mark) {
  const P = centredText('P', 150, 128, 140);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
<rect x="8" y="8" width="240" height="240" rx="58" fill="${tile}"/>
<path d="M58 92 Q124 20 204 64" fill="none" stroke="${mark}" stroke-width="9" stroke-linecap="round"/>
<circle cx="204" cy="64" r="7.5" fill="${mark}"/>
<g transform="translate(${P.tx.toFixed(2)} ${P.ty.toFixed(2)})" fill="${mark}"><path d="${P.d}"/></g>
</svg>`;
}

// The mark alone (no tile, transparent) for embedding in docs.
function markSvg(mark) {
  const P = centredText('P', 150, 128, 140);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
<path d="M58 92 Q124 20 204 64" fill="none" stroke="${mark}" stroke-width="9" stroke-linecap="round"/>
<circle cx="204" cy="64" r="7.5" fill="${mark}"/>
<g transform="translate(${P.tx.toFixed(2)} ${P.ty.toFixed(2)})" fill="${mark}"><path d="${P.d}"/></g>
</svg>`;
}

// Horizontal lockup: gold-tile icon + "ProseArc" wordmark (gold), transparent bg.
function lockupSvg() {
  const H = 220;
  const iconBox = 200;       // icon drawn 200×200, vertically centred in 220
  const iconY = (H - iconBox) / 2;
  const gap = 36;
  const wmSize = 132;
  const wmW = font.getAdvanceWidth('ProseArc', wmSize);
  const wmX = iconBox + gap;
  const wm = font.getPath('ProseArc', wmX, 0, wmSize); // baseline 0
  const bb = wm.getBoundingBox();
  const wmTy = H / 2 - (bb.y1 + (bb.y2 - bb.y1) / 2);
  const W = Math.ceil(wmX + wmW + 12);

  // Scale the full 256 icon down into the lockup rather than redrawing it.
  const scale = iconBox / 256;
  const iconInner = iconSvg(GOLD, INK)
    .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<g transform="translate(0 ${iconY.toFixed(2)}) scale(${scale.toFixed(4)})">${iconInner}</g>
<g transform="translate(0 ${wmTy.toFixed(2)})" fill="${GOLD}"><path d="${wm.toPathData(2)}"/></g>
</svg>`;
}

async function svgToPng(svg, size) {
  const density = Math.max(72, Math.round(96 * size / 256));
  return sharp(Buffer.from(svg), { density }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function writeIcoSet(svg, icoPath, pngPath) {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngs = await Promise.all(sizes.map((s) => svgToPng(svg, s)));
  fs.writeFileSync(icoPath, await pngToIco(pngs));
  fs.writeFileSync(pngPath, await svgToPng(svg, 512));
}

async function main() {
  const gold = iconSvg(GOLD, INK);
  const dark = iconSvg(INK, GOLD);

  fs.writeFileSync(path.join(assetsDir, 'icon-gold.svg'), gold);
  fs.writeFileSync(path.join(assetsDir, 'icon-dark.svg'), dark);
  fs.writeFileSync(path.join(assetsDir, 'mark-gold.svg'), markSvg(GOLD));
  fs.writeFileSync(path.join(assetsDir, 'mark-dark.svg'), markSvg(INK));

  const lockup = lockupSvg();
  fs.writeFileSync(path.join(assetsDir, 'logo.svg'), lockup);
  const lockupPng = await sharp(Buffer.from(lockup), { density: 300 }).resize({ height: 220 }).png().toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'logo.png'), lockupPng);

  await writeIcoSet(gold, path.join(buildDir, 'icon.ico'), path.join(buildDir, 'icon.png'));
  await writeIcoSet(dark, path.join(buildDir, 'icon-dark.ico'), path.join(buildDir, 'icon-dark.png'));

  console.log('Done. Wrote build/ icons and assets/ logos.');
}

main().catch((e) => { console.error(e); process.exit(1); });
