const fs = require('fs');
const files = ['src/app/terms/page.tsx', 'src/app/privacy/page.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Prutam Enterprise Limited/g, 'Interior Finishes Supermarket');
  content = content.replace(/Prutam Enterprise Ltd/g, 'Interior Finishes Supermarket');
  content = content.replace(/“Prutam,”/g, '“IFS,”');
  fs.writeFileSync(file, content);
}
console.log('Replaced in terms and privacy');
