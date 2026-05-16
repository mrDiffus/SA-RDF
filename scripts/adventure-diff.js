#!/usr/bin/env node

/**
 * adventure-diff.js
 * 
 * Shows what changed between old and new adventure JSON-LD objects.
 * Useful for displaying iteration changes to the user.
 * 
 * Usage:
 *   const diff = require('./adventure-diff.js');
 *   const changes = diff.compareAdventures(oldJSON, newJSON);
 */

/**
 * Compare two adventure objects and return changes
 * @param {object} oldAdventure - Previous version
 * @param {object} newAdventure - New version
 * @returns {object} { changed: [], added: [], removed: [] }
 */
function compareAdventures(oldAdventure, newAdventure) {
  const changes = {
    changed: [],
    added: [],
    removed: []
  };

  if (!oldAdventure) {
    changes.added.push('Entire adventure created');
    return changes;
  }

  // Compare top-level properties
  const allKeys = new Set([
    ...Object.keys(oldAdventure || {}),
    ...Object.keys(newAdventure || {})
  ]);

  for (const key of allKeys) {
    const oldVal = oldAdventure?.[key];
    const newVal = newAdventure?.[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (!newVal && oldVal) {
        changes.removed.push(`${key}`);
      } else if (!oldVal && newVal) {
        changes.added.push(`${key}`);
      } else {
        changes.changed.push(`${key}`);
      }
    }
  }

  // Detail changes in arrays
  changes.chapterChanges = compareManyToMany(
    oldAdventure?.['adv:hasPart'] || [],
    newAdventure?.['adv:hasPart'] || [],
    'Chapter'
  );

  changes.npcChanges = compareManyToMany(
    oldAdventure?.['adv:hasNPC'] || [],
    newAdventure?.['adv:hasNPC'] || [],
    'NPC'
  );

  changes.locationChanges = compareManyToMany(
    oldAdventure?.['adv:hasLocation'] || [],
    newAdventure?.['adv:hasLocation'] || [],
    'Location'
  );

  changes.encounterChanges = compareManyToMany(
    oldAdventure?.['adv:hasEncounter'] || [],
    newAdventure?.['adv:hasEncounter'] || [],
    'Encounter'
  );

  return changes;
}

/**
 * Compare arrays of objects
 */
function compareManyToMany(oldArray, newArray, itemType) {
  const changes = { added: [], changed: [], removed: [] };

  if (!Array.isArray(oldArray)) oldArray = [];
  if (!Array.isArray(newArray)) newArray = [];

  const oldIds = new Set(oldArray.map(item => item['@id'] || item['rdfs:label']));
  const newIds = new Set(newArray.map(item => item['@id'] || item['rdfs:label']));

  // Added items
  for (const item of newArray) {
    const id = item['@id'] || item['rdfs:label'];
    if (!oldIds.has(id)) {
      changes.added.push(`${itemType}: ${id || '(unnamed)'}`);
    }
  }

  // Removed items
  for (const item of oldArray) {
    const id = item['@id'] || item['rdfs:label'];
    if (!newIds.has(id)) {
      changes.removed.push(`${itemType}: ${id || '(unnamed)'}`);
    }
  }

  // Changed items (by property count or content)
  for (const oldItem of oldArray) {
    const oldId = oldItem['@id'] || oldItem['rdfs:label'];
    const newItem = newArray.find(i => (i['@id'] || i['rdfs:label']) === oldId);
    if (newItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      changes.changed.push(`${itemType}: ${oldId || '(unnamed)'}`);
    }
  }

  return changes;
}

/**
 * Format diff for display to user
 */
function formatDiffForDisplay(diff) {
  let output = '**What Changed:**\n\n';

  if (diff.changed.length > 0) {
    output += '📝 **Modified:**\n';
    diff.changed.forEach(change => {
      output += `  - ${change}\n`;
    });
    output += '\n';
  }

  if (diff.added.length > 0) {
    output += '✨ **Added:**\n';
    diff.added.forEach(add => {
      output += `  - ${add}\n`;
    });
    output += '\n';
  }

  if (diff.removed.length > 0) {
    output += '❌ **Removed:**\n';
    diff.removed.forEach(remove => {
      output += `  - ${remove}\n`;
    });
    output += '\n';
  }

  // Detail level diffs
  ["chapterChanges", "npcChanges", "locationChanges", "encounterChanges"].forEach(key => {
    const changes = diff[key];
    if (changes && (changes.added.length > 0 || changes.changed.length > 0 || changes.removed.length > 0)) {
      const sectionName = key.replace('Changes', '').toUpperCase();
      
      if (changes.changed.length > 0) {
        output += `\n📝 **${sectionName} Modified:**\n`;
        changes.changed.forEach(c => output += `  - ${c}\n`);
      }
      
      if (changes.added.length > 0) {
        output += `\n✨ **${sectionName} Added:**\n`;
        changes.added.forEach(a => output += `  - ${a}\n`);
      }
      
      if (changes.removed.length > 0) {
        output += `\n❌ **${sectionName} Removed:**\n`;
        changes.removed.forEach(r => output += `  - ${r}\n`);
      }
    }
  });

  return output.trim();
}

// CLI support
if (require.main === module) {
  const fs = require('fs');
  const oldFile = process.argv[2];
  const newFile = process.argv[3];

  if (!oldFile || !newFile) {
    console.error('Usage: node adventure-diff.js <old.jsonld> <new.jsonld>');
    process.exit(1);
  }

  try {
    const oldText = fs.readFileSync(oldFile, 'utf-8');
    const newText = fs.readFileSync(newFile, 'utf-8');
    const oldAdventure = JSON.parse(oldText);
    const newAdventure = JSON.parse(newText);

    const diff = compareAdventures(oldAdventure, newAdventure);
    console.log(formatDiffForDisplay(diff));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  compareAdventures,
  compareManyToMany,
  formatDiffForDisplay
};
