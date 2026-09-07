import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..', '..');
const sourceLogo = path.join(rootDir, 'logo.jpeg');

const frontendLogosDir = path.join(rootDir, 'frontend', 'public', 'logos');
const backendLogosDir = path.join(rootDir, 'backend', 'public', 'logos');

[frontendLogosDir, backendLogosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function processLogo() {
  console.log('Processing official MIUCC logo (removing background)...');
  
  if (!fs.existsSync(sourceLogo)) {
    console.error('Source logo logo.jpeg not found!');
    return;
  }

  const jpegData = fs.readFileSync(sourceLogo);
  const rawData = jpeg.decode(jpegData, { useTolerantUnknown: true });

  const width = rawData.width;
  const height = rawData.height;
  const src = rawData.data;

  const png = new PNG({ width, height });
  const dst = png.data;

  for (let i = 0; i < src.length; i += 4) {
    dst[i] = src[i];
    dst[i + 1] = src[i + 1];
    dst[i + 2] = src[i + 2];
    dst[i + 3] = 255;
  }

  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBackgroundPixel(x, y) {
    const idx = (y * width + x) * 4;
    return dst[idx] < 40 && dst[idx + 1] < 40 && dst[idx + 2] < 40;
  }

  for (let x = 0; x < width; x++) {
    if (isBackgroundPixel(x, 0)) queue.push(x, 0);
    if (isBackgroundPixel(x, height - 1)) queue.push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    if (isBackgroundPixel(0, y)) queue.push(0, y);
    if (isBackgroundPixel(width - 1, y)) queue.push(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const pos = y * width + x;

    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    dst[idx + 3] = 0;

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const npos = ny * width + nx;
        if (!visited[npos] && isBackgroundPixel(nx, ny)) {
          queue.push(nx, ny);
        }
      }
    }
  }

  const pngBuffer = PNG.sync.write(png);

  [frontendLogosDir, backendLogosDir].forEach(targetDir => {
    fs.writeFileSync(path.join(targetDir, 'miucc-logo.png'), pngBuffer);
    fs.copyFileSync(sourceLogo, path.join(targetDir, 'miucc-logo.jpeg'));
  });

  console.log('Transparent logo generated cleanly and updated in public/logos!');
}

processLogo().catch(console.error);
