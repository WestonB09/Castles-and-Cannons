const fs = require('fs');

// Read the file
let content = fs.readFileSync('server/advanced-question-types.ts', 'utf8');

// Fix all hint and tag fields
content = content.replace(/hints: "([^"]+)"/g, (match, p1) => {
  const hints = p1.split(',').map(h => h.trim()).map(h => `"${h}"`).join(', ');
  return `hints: [${hints}]`;
});

content = content.replace(/tags: "([^"]+)"/g, (match, p1) => {
  const tags = p1.split(',').map(t => t.trim()).map(t => `"${t}"`).join(', ');
  return `tags: [${tags}]`;
});

// Write the file back
fs.writeFileSync('server/advanced-question-types.ts', content);
console.log('Fixed all type errors in advanced-question-types.ts');