import os

files = [
  'src/app/admin/layout.tsx',
  'src/components/AdminChatSidebar.tsx',
  'src/app/admin/components/CategoriesTab.tsx',
  'src/app/admin/components/OverviewTab.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/exports/page.tsx'
]

replacements = {
  'bg-[#0b1326]': 'bg-apex-bg',
  'text-[#0b1326]': 'text-apex-bg',
  'bg-[#131b2e]': 'bg-apex-surface-low',
  'bg-[#171f33]': 'bg-apex-surface',
  'bg-[#060e20]': 'bg-apex-surface-lowest',
  'border-[#2d3449]': 'border-apex-surface-highest',
  'border-[#131b2e]': 'border-apex-surface-low'
}

for f in files:
  if not os.path.exists(f): continue
  with open(f, 'r', encoding='utf-8') as file:
    content = file.read()
  
  for old, new in replacements.items():
    content = content.replace(old, new)
    
  with open(f, 'w', encoding='utf-8') as file:
    file.write(content)
print("Done")
