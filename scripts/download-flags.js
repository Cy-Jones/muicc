import fs from 'fs';
import path from 'path';
import https from 'https';

const nations = [
  { name: 'Liberia', code: 'LBR', iso: 'lr' },
  { name: 'Eswatini', code: 'SWZ', iso: 'sz' },
  { name: 'Tanzania', code: 'TZA', iso: 'tz' },
  { name: 'South Sudan', code: 'SSD', iso: 'ss' },
  { name: 'Zimbabwe', code: 'ZWE', iso: 'zw' },
  { name: 'India', code: 'IND', iso: 'in' },
  { name: 'Mozambique', code: 'MOZ', iso: 'mz' },
  { name: 'Nigeria', code: 'NGA', iso: 'ng' },
  { name: 'Uganda', code: 'UGA', iso: 'ug' },
  { name: 'Zambia', code: 'ZMB', iso: 'zm' }
];

const dirs = [
  path.resolve(process.cwd(), 'frontend/public/images/flags')
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  console.log('Downloading flags for 10 nations...');
  for (const nation of nations) {
    const url = `https://flagcdn.com/w320/${nation.iso}.png`;
    
    const frontendPath = path.resolve(process.cwd(), 'frontend/public/images/flags', `${nation.code.toLowerCase()}.png`);

    console.log(`Downloading ${nation.name} (${url})...`);
    await download(url, frontendPath);
  }
  console.log('All 10 country flags downloaded successfully!');
}

run().catch(err => {
  console.error('Error downloading flags:', err);
  process.exit(1);
});
