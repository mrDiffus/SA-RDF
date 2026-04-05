#!/usr/bin/env node

/**
 * Build a comprehensive resource index from all JSON-LD files in public/data
 * Usage: node scripts/build-resource-index.js
 */

const fs = require('fs');
const path = require('path');

// Use current working directory as workspace root
const WORKSPACE_ROOT = process.cwd();
const DATA_DIR = path.join(WORKSPACE_ROOT, 'public', 'data');

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Error: DATA_DIR not found at ${DATA_DIR}`);
  console.error(`Current directory: ${WORKSPACE_ROOT}`);
  process.exit(1);
}

const resourceIndex = {
  generatedAt: new Date().toISOString(),
  version: '1.0',
  resources: [],
  byId: {},
  byLabel: {},
  byType: {},
  byFile: {}
};

/**
 * Recursively find all JSON files
 */
function findJsonFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'resource-index.json') {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract all resources from a JSON-LD file
 */
function extractResources(filePath, relativeFilePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!data['@graph'] && !data['@type']) {
      return [];
    }

    const resources = [];

    // Handle @graph array format
    if (Array.isArray(data['@graph'])) {
      for (const item of data['@graph']) {
        resources.push(processResource(item, relativeFilePath));
      }
    }
    // Handle single resource with @type/rdfs:label
    else if (data['@type'] || data['rdfs:label']) {
      resources.push(processResource(data, relativeFilePath));
    }

    return resources.filter(Boolean);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return [];
  }
}

/**
 * Process a single resource object
 */
function processResource(item, filePath) {
  if (!item || typeof item !== 'object') return null;

  const resource = {
    file: filePath,
    '@type': item['@type'] || 'unknown',
    'rdfs:label': item['rdfs:label'] || item.name || item.id || '(unlabeled)',
    '@id': item['@id'] || null,
    predicates: Object.keys(item).filter(k => !k.startsWith('@'))
  };

  // Include key properties for common resource types
  if (item['sa:description']) {
    resource['sa:description'] = item['sa:description'].substring(0, 100) + '...';
  }
  if (item['sa:requirements']) {
    resource['sa:requirements'] = item['sa:requirements'];
  }
  if (item['sa:actionType']) {
    resource['sa:actionType'] = item['sa:actionType'];
  }
  if (item['sa:spellLevel']) {
    resource['sa:spellLevel'] = item['sa:spellLevel'];
  }

  return resource;
}

/**
 * Build index from all files
 */
function buildIndex() {
  const jsonFiles = findJsonFiles(DATA_DIR);

  for (const filePath of jsonFiles) {
    const relativeFilePath = path.relative(DATA_DIR, filePath).replace(/\\/g, '/');
    const resources = extractResources(filePath, relativeFilePath);

    for (const resource of resources) {
      resourceIndex.resources.push(resource);

      // Index by @id
      if (resource['@id']) {
        if (!resourceIndex.byId[resource['@id']]) {
          resourceIndex.byId[resource['@id']] = [];
        }
        resourceIndex.byId[resource['@id']].push(resource);
      }

      // Index by label
      const label = resource['rdfs:label'];
      if (label) {
        if (!resourceIndex.byLabel[label]) {
          resourceIndex.byLabel[label] = [];
        }
        resourceIndex.byLabel[label].push(resource);
      }

      // Index by type
      const type = resource['@type'];
      if (type) {
        if (!resourceIndex.byType[type]) {
          resourceIndex.byType[type] = [];
        }
        resourceIndex.byType[type].push(resource);
      }

      // Index by file
      if (!resourceIndex.byFile[relativeFilePath]) {
        resourceIndex.byFile[relativeFilePath] = [];
      }
      resourceIndex.byFile[relativeFilePath].push(resource);
    }
  }

  // Add summary stats
  resourceIndex.summary = {
    totalFiles: jsonFiles.length,
    totalResources: resourceIndex.resources.length,
    uniqueTypes: Object.keys(resourceIndex.byType).length,
    typeBreakdown: Object.entries(resourceIndex.byType).reduce((acc, [type, items]) => {
      acc[type] = items.length;
      return acc;
    }, {})
  };
}

// Run
try {
  buildIndex();
  console.log(JSON.stringify(resourceIndex, null, 2));
} catch (err) {
  console.error('Error building index:', err.message);
  console.error(err.stack);
  process.exit(1);
}
