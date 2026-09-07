import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..', '..');
const uploadedImage = 'C:\\Users\\jeff\\.gemini\\antigravity-ide\\brain\\84cfd167-19a5-469b-a0c0-db81c7f6f7ed\\.user_uploaded\\media_1788165685217.jpg';

const targetDirs = [
  path.join(rootDir, 'frontend', 'public', 'logos'),
  path.join(rootDir, 'backend', 'public', 'logos')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function removeBackground() {
  console.log('Processing logo background removal...');
  let jpegBuffer;
  if (fs.existsSync(uploadedImage)) {
    jpegBuffer = fs.readFileSync(uploadedImage);
  } else {
    jpegBuffer = fs.readFileSync(path.join(rootDir, 'frontend', 'public', 'logos', 'miucc-logo.jpeg'));
  }

  const rawData = jpeg.decode(jpegBuffer, { useTolerantUnknown: true });
  const { width, height, data: src } = rawData;

  const png = new PNG({ width, height });
  const dst = png.data;

  const centerX = width / 2;
  const centerY = height / 2;

  // The golden border is a circle/ellipse centered in the square image
  // Outer radius of the golden border ring
  const radiusX = width * 0.485;
  const radiusY = height * 0.485;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];

      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distSq = dx * dx + dy * dy;

      dst[idx] = r;
      dst[idx + 1] = g;
      dst[idx + 2] = b;

      // Dark outer background removal
      if (distSq > 1.01 || (distSq > 0.94 && r < 50 && g < 50 && b < 50)) {
        dst[idx + 3] = 0; // Fully transparent outer background
      } else if (distSq > 0.985) {
        // Smooth anti-aliased edge
        const alpha = Math.max(0, Math.min(255, Math.floor((1.01 - distSq) / 0.025 * 255)));
        dst[idx + 3] = alpha;
      } else {
        dst[idx + 3] = 255;
      }
    }
  }

  const pngBuffer = PNG.sync.write(png);

  targetDirs.forEach(dir => {
    const targetPath = path.join(dir, 'miucc-logo.png');
    fs.writeFileSync(targetPath, pngBuffer);
    console.log(`Saved transparent logo PNG to ${targetPath}`);
  });
}

removeBackground();
