import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'shared-env');

console.log('===================================================');
console.log('📦 Exporting Environment Files for Co-Developer');
console.log('===================================================');

// Ensure target output folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to create .env if missing from .env.example or root .env
function ensureEnvFile(targetFilePath, sourceFilePath) {
  if (!fs.existsSync(targetFilePath) && fs.existsSync(sourceFilePath)) {
    console.log(`ℹ️ Initializing missing ${path.relative(projectRoot, targetFilePath)} from source...`);
    fs.copyFileSync(sourceFilePath, targetFilePath);
  }
}

// Ensure root, backend, and frontend .env files exist locally before export
const rootEnv = path.join(projectRoot, '.env');
const rootEnvExample = path.join(projectRoot, '.env.example');
const backendEnv = path.join(projectRoot, 'backend', '.env');
const backendEnvExample = path.join(projectRoot, 'backend', '.env.example');
const frontendEnv = path.join(projectRoot, 'frontend', '.env');
const frontendEnvExample = path.join(projectRoot, 'frontend', '.env.example');

ensureEnvFile(rootEnv, rootEnvExample);
ensureEnvFile(backendEnv, backendEnvExample);
ensureEnvFile(frontendEnv, frontendEnvExample);

// Scan for all .env files in root, backend, and frontend
const envLocations = [
  { source: rootEnv, exportName: 'root.env', destRel: '.env' },
  { source: backendEnv, exportName: 'backend.env', destRel: 'backend/.env' },
  { source: frontendEnv, exportName: 'frontend.env', destRel: 'frontend/.env' },
  { source: path.join(projectRoot, '.env.local'), exportName: 'root.env.local', destRel: '.env.local' },
  { source: path.join(projectRoot, 'backend', '.env.local'), exportName: 'backend.env.local', destRel: 'backend/.env.local' },
  { source: path.join(projectRoot, 'frontend', '.env.local'), exportName: 'frontend.env.local', destRel: 'frontend/.env.local' }
];

let exportedCount = 0;

envLocations.forEach(({ source, exportName, destRel }) => {
  if (fs.existsSync(source)) {
    const destPath = path.join(outputDir, exportName);
    fs.copyFileSync(source, destPath);
    console.log(`✅ Exported: ${path.relative(projectRoot, source)} -> shared-env/${exportName}`);
    exportedCount++;
  }
});

// Also write a clear instructions file for the recipient co-developer
const instructionsContent = `===================================================================
MIUCC 2026 / MULSU_ICC — SHARED ENVIRONMENT FILES INSTRUCTIONS
===================================================================

This folder contains pre-configured environment (.env) files for the project.
Share this folder with your co-developer securely (via Zip, Slack, or direct message).

PLACEMENT INSTRUCTIONS FOR YOUR CO-DEVELOPER:
-------------------------------------------------------------------
1. Move/rename "root.env" to ".env" in the root directory:
   Destination: / (project root folder) -> .env

2. Move/rename "backend.env" to ".env" inside the backend folder:
   Destination: /backend -> .env

3. Move/rename "frontend.env" to ".env" inside the frontend folder:
   Destination: /frontend -> .env

-------------------------------------------------------------------
QUICK COMMAND TO AUTO-RESTORE ON CO-DEVELOPER'S MACHINE:
In Terminal / PowerShell in project root:

  cp shared-env/root.env .env
  cp shared-env/backend.env backend/.env
  cp shared-env/frontend.env frontend/.env

Then run:
  npm install
  npm run dev
===================================================================
`;

fs.writeFileSync(path.join(outputDir, 'INSTRUCTIONS.txt'), instructionsContent, 'utf8');
console.log(`📄 Created sharing instructions: shared-env/INSTRUCTIONS.txt`);

console.log('===================================================');
console.log(`🎉 Done! ${exportedCount} environment file(s) exported to:`);
console.log(`📁 ${outputDir}`);
console.log('===================================================');
