const fs = require('fs');
const path = require('path');

const files = [
  'src/app/admin/layout.tsx',
  'src/components/AdminChatSidebar.tsx',
  'src/app/admin/components/CategoriesTab.tsx',
  'src/app/admin/components/OverviewTab.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/exports/page.tsx'
];

const replacements = [
  { old: 'bg-[#0b1326]', new: 'bg-apex-bg' },
  { old: 'text-[#0b1326]', new: 'text-apex-bg' },
  { old: 'bg-[#131b2e]', new: 'bg-apex-surface-low' },
  { old: 'bg-[#171f33]', new: 'bg-apex-surface' },
  { old: 'bg-[#060e20]', new: 'bg-apex-surface-lowest' },
  { old: 'border-[#2d3449]', new: 'border-apex-surface-highest' },
  { old: 'border-[#131b2e]', new: 'border-apex-surface-low' }
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;
  
  replacements.forEach(r => {
    content = content.split(r.old).join(r.new);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
