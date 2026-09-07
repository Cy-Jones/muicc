import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..', '..');
const sourceLogo = path.join(rootDir, 'logo.jpeg');

const jpegData = fs.readFileSync(sourceLogo);
const rawImageData = jpeg.decode(jpegData, { useTolerantUnknown: true });

console.log(`Image dimensions: ${rawImageData.width}x${rawImageData.height}`);

// Sample corner pixels to determine background color
const width = rawImageData.width;
const height = rawImageData.height;
const data = rawImageData.data;

function getPixel(x, y) {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3]
  };
}

console.log('Top-Left Corner (0,0):', getPixel(0, 0));
console.log('Top-Right Corner (w-1,0):', getPixel(width - 1, 0));
console.log('Bottom-Left Corner (0,h-1):', getPixel(0, height - 1));
console.log('Bottom-Right Corner (w-1,h-1):', getPixel(width - 1, height - 1));
