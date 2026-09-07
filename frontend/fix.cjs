const fs = require('fs');
const files = [
  'src/pages/admin/AdminDashboard.tsx',
  'src/components/layout/AdminLayout.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\\$\{/g, '${');
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed \\${ issues in files');
