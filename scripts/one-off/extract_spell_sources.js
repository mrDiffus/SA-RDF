const fs = require('fs');

const path = 'public/data/spells.scraped.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!data['@context'] || typeof data['@context'] !== 'object') {
  throw new Error('Missing @context object');
}
if (!data['@context']['dcterms']) {
  data['@context']['dcterms'] = 'http://purl.org/dc/terms/';
}

const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
const listNode = graph.find(
  (n) => n && n['@id'] === 'sa:spellList' && Array.isArray(n['sa:items'])
);
if (!listNode) {
  throw new Error('Could not locate sa:spellList.sa:items');
}

const items = listNode['sa:items'];
let extracted = 0;
let unchanged = 0;

for (const item of items) {
  const desc = item && item['spell:description'];
  if (typeof desc !== 'string') {
    continue;
  }

  const sourcePatterns = [
    /^Source:\s*(Player's Handbook)\s+([\s\S]+)$/i,
    /^Source:\s*(Forgotten Realms\s*-\s*Heroes of Faerun)\s+([\s\S]+)$/i,
    /^Source:\s*([^\.]{2,80})\.\s*([\s\S]+)$/i,
  ];

  let matched = false;
  for (const rx of sourcePatterns) {
    const m = desc.match(rx);
    if (!m) {
      continue;
    }

    const source = m[1].replace(/\s+/g, ' ').trim();
    const body = m[2].replace(/\s+/g, ' ').trim();
    if (!source || !body) {
      continue;
    }

    item['dcterms:source'] = source;
    item['spell:description'] = body;
    extracted += 1;
    matched = true;
    break;
  }

  if (!matched && /^Source:/i.test(desc)) {
    unchanged += 1;
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log(`Updated ${path}`);
console.log(`Extracted source from ${extracted} items.`);
console.log(`Descriptions still starting with Source: ${unchanged}`);
