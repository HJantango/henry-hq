const fs = require('fs');
const path = require('path');

const BRAIN_PATH = path.join(__dirname, '../src/second-brain');
const OUTPUT_PATH = path.join(__dirname, '../src/app/api/brain/content.json');

function buildTree(dirPath, basePath = '') {
  if (!fs.existsSync(dirPath)) return [];
  
  const items = fs.readdirSync(dirPath);
  const nodes = [];
  
  for (const item of items) {
    if (item.startsWith('.')) continue;
    
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      nodes.push({
        name: item,
        path: relativePath,
        type: 'folder',
        children: buildTree(fullPath, relativePath),
      });
    } else if (item.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      nodes.push({
        name: item.replace('.md', ''),
        path: relativePath,
        type: 'file',
        content,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }
  
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

const tree = buildTree(BRAIN_PATH);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ tree }, null, 2));
console.log('Bundled brain content to', OUTPUT_PATH);
