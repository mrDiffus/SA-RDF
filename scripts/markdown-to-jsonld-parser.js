#!/usr/bin/env node

/**
 * markdown-to-jsonld-parser.js
 * 
 * Converts a markdown adventure skeleton into a SHACL-conformant JSON-LD adventure object.
 * 
 * Usage:
 *   const parser = require('./markdown-to-jsonld-parser.js');
 *   const jsonld = parser.parseMarkdownToJSON(markdownText);
 *   console.log(JSON.stringify(jsonld, null, 2));
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a URL-safe slug from a title
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Parse markdown adventure skeleton into JSON-LD Adventure object
 * @param {string} markdownText - The markdown skeleton content
 * @returns {object} JSON-LD Adventure object conforming to SHACL Adventure shape
 */
function parseMarkdownToJSON(markdownText) {
  const sections = parseMarkdownSections(markdownText);
  const baseId = `https://stellar-arcana.org/adventure/${slugify(sections.title || 'untitled')}`;

  const adventure = {
    '@context': {
      '@vocab': 'https://stellar-arcana.org/adventure#',
      'adv': 'https://stellar-arcana.org/adventure#',
      'schema': 'http://schema.org/',
      'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#'
    },
    '@id': baseId,
    '@type': 'adv:Adventure',
    'rdfs:label': sections.title || 'Untitled Adventure',
    'schema:title': sections.title || 'Untitled Adventure',
    'schema:description': sections.overview.hook || 'An adventure.',
    'adv:hasPart': [],
    'adv:hasNPC': [],
    'adv:hasLocation': [],
    'adv:hasEncounter': []
  };

  // Process chapters
  if (sections.chapters && sections.chapters.length > 0) {
    adventure['adv:hasPart'] = sections.chapters.map((chapter, idx) => ({
      '@id': `${baseId}/chapter-${idx + 1}`,
      '@type': 'adv:Chapter',
      'rdfs:label': chapter.title || `Chapter ${idx + 1}`,
      'schema:description': chapter.description || `Chapter ${idx + 1} of the adventure.`
    }));
  }

  // Process NPCs
  if (sections.npcs && sections.npcs.length > 0) {
    adventure['adv:hasNPC'] = sections.npcs.map((npc, idx) => ({
      '@id': `${baseId}/npc-${idx + 1}`,
      '@type': 'adv:NPC',
      'rdfs:label': npc.name || `NPC ${idx + 1}`,
      'schema:name': npc.name || `NPC ${idx + 1}`,
      'adv:role': npc.role || 'neutral',
      'schema:description': npc.personality || 'An NPC in the adventure.',
      'adv:faction': npc.faction || 'Independent',
      'adv:appearance': npc.appearance || undefined,
      'adv:statBlock': npc.archetype || undefined
    }));
  }

  // Process locations
  if (sections.locations && sections.locations.length > 0) {
    adventure['adv:hasLocation'] = sections.locations.map((location, idx) => ({
      '@id': `${baseId}/location-${idx + 1}`,
      '@type': 'adv:Location',
      'rdfs:label': location.name || `Location ${idx + 1}`,
      'schema:name': location.name || `Location ${idx + 1}`,
      'schema:description': location.description || 'A location in the adventure.',
      'adv:hasArea': location.areas && location.areas.length > 0
        ? location.areas.map((area, areaIdx) => ({
            '@id': `${baseId}/location-${idx + 1}/area-${areaIdx + 1}`,
            '@type': 'adv:Area',
            'adv:areaNumber': String(areaIdx + 1),
            'adv:areaName': area.name || `Area ${areaIdx + 1}`,
            'schema:description': area.description || 'An area.'
          }))
        : [
            {
              '@id': `${baseId}/location-${idx + 1}/area-1`,
              '@type': 'adv:Area',
              'adv:areaNumber': '1',
              'adv:areaName': location.name || 'Main Area',
              'schema:description': location.description || 'The main area.'
            }
          ]
    }));
  }

  // Process encounters
  if (sections.encounters && sections.encounters.length > 0) {
    adventure['adv:hasEncounter'] = sections.encounters.map((encounter, idx) => {
      const locationRef = sections.locations && sections.locations[0]
        ? `${baseId}/location-1`
        : undefined;

      return {
        '@id': `${baseId}/encounter-${idx + 1}`,
        '@type': 'adv:Encounter',
        'rdfs:label': encounter.name || `Encounter ${idx + 1}`,
        'schema:name': encounter.name || `Encounter ${idx + 1}`,
        'schema:description': encounter.objective || `Encounter ${idx + 1}`,
        'adv:location': locationRef ? { '@id': locationRef } : undefined,
        'adv:hasMonster': encounter.antagonists && encounter.antagonists.length > 0
          ? encounter.antagonists.map((ant, antIdx) => ({
              '@type': 'adv:Monster',
              'schema:name': ant || `Antagonist ${antIdx + 1}`,
              'adv:count': 1,
              'schema:description': ant || 'An antagonist.'
            }))
          : undefined,
        'adv:tactics': encounter.tactics || undefined,
        'schema:description': encounter.description || encounter.objective || 'An encounter.'
      };
    });
  }

  // Clean up undefined properties
  return cleanUndefinedProperties(adventure);
}

/**
 * Parse markdown into structured sections
 * @param {string} markdownText - Raw markdown text
 * @returns {object} Parsed sections
 */
function parseMarkdownSections(markdownText) {
  const lines = markdownText.split('\n');
  const sections = {
    title: null,
    overview: { hook: '', party: '', setting: '' },
    chapters: [],
    locations: [],
    npcs: [],
    encounters: [],
    organizations: [],
    notes: ''
  };

  let currentSection = null;
  let currentItem = null;
  let buffer = [];

  for (const line of lines) {
    // Main section headers (##)
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).toLowerCase().trim();
      currentItem = null;
      buffer = [];
      continue;
    }

    // Title (# Level)
    if (line.startsWith('# ')) {
      sections.title = line.substring(2).trim();
      continue;
    }

    // Subsection headers (###)
    if (line.startsWith('### ')) {
      const itemTitle = line.substring(4).trim();

      if (currentSection === 'chapters') {
        if (currentItem) {
          sections.chapters.push(currentItem);
        }
        currentItem = {
          title: itemTitle,
          description: ''
        };
      } else if (currentSection === 'locations') {
        if (currentItem) {
          sections.locations.push(currentItem);
        }
        currentItem = {
          name: itemTitle,
          description: '',
          areas: []
        };
      } else if (currentSection === 'npcs') {
        if (currentItem) {
          sections.npcs.push(currentItem);
        }
        currentItem = {
          name: itemTitle,
          role: '',
          faction: '',
          archetype: '',
          personality: '',
          appearance: '',
          goal: ''
        };
      } else if (currentSection === 'encounters') {
        if (currentItem) {
          sections.encounters.push(currentItem);
        }
        currentItem = {
          name: itemTitle,
          objective: '',
          antagonists: [],
          complications: [],
          tactics: '',
          description: ''
        };
      }
      buffer = [];
      continue;
    }

    // Property lines (e.g., "**Role**: ...")
    if (currentItem && line.startsWith('**')) {
      const match = line.match(/\*\*([^*]+)\*\*:\s*(.*)/);
      if (match) {
        const [, key, value] = match;
        const lowerKey = key.toLowerCase().trim();
        const cleanValue = value.trim();

        if (lowerKey === 'role' && currentItem.role !== undefined) {
          currentItem.role = cleanValue;
        } else if (lowerKey === 'faction' && currentItem.faction !== undefined) {
          currentItem.faction = cleanValue;
        } else if (lowerKey === 'archetype' && currentItem.archetype !== undefined) {
          currentItem.archetype = cleanValue;
        } else if (lowerKey === 'personality' && currentItem.personality !== undefined) {
          currentItem.personality = cleanValue;
        } else if (lowerKey === 'appearance' && currentItem.appearance !== undefined) {
          currentItem.appearance = cleanValue;
        } else if (lowerKey === 'goal in adventure' && currentItem.goal !== undefined) {
          currentItem.goal = cleanValue;
        } else if (lowerKey === 'objective' && currentItem.objective !== undefined) {
          currentItem.objective = cleanValue;
        } else if (lowerKey === 'antagonists' && Array.isArray(currentItem.antagonists)) {
          // Next lines will be list items
          buffer = [];
        } else if (lowerKey === 'complications' && Array.isArray(currentItem.complications)) {
          buffer = [];
        } else if (lowerKey === 'description' && currentItem.description !== undefined) {
          currentItem.description = cleanValue;
        } else if (lowerKey === 'hook' && sections.overview.hook !== undefined) {
          sections.overview.hook = cleanValue;
        } else if (lowerKey === 'party context') {
          sections.overview.party = cleanValue;
        } else if (lowerKey === 'setting') {
          sections.overview.setting = cleanValue;
        }
      }
      continue;
    }

    // List items (-)
    if (line.trim().startsWith('- ')) {
      const item = line.trim().substring(2).trim();
      if (currentItem && Array.isArray(currentItem.antagonists)) {
        currentItem.antagonists.push(item);
      } else if (currentItem && Array.isArray(currentItem.complications)) {
        currentItem.complications.push(item);
      } else if (currentItem && currentItem.areas && currentSection === 'locations') {
        // Parse as location area
        currentItem.areas.push({
          name: item,
          description: item
        });
      }
      continue;
    }

    // Buffer remaining text for descriptions
    if (line.trim() && currentItem && !line.startsWith('#')) {
      buffer.push(line);
    }
  }

  // Push final item
  if (currentItem) {
    if (currentSection === 'chapters') {
      sections.chapters.push(currentItem);
    } else if (currentSection === 'locations') {
      sections.locations.push(currentItem);
    } else if (currentSection === 'npcs') {
      sections.npcs.push(currentItem);
    } else if (currentSection === 'encounters') {
      sections.encounters.push(currentItem);
    }
  }

  return sections;
}

/**
 * Remove undefined properties from an object (recursive)
 */
function cleanUndefinedProperties(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedProperties).filter(item => item !== null);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = cleanUndefinedProperties(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// CLI support
if (require.main === module) {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node markdown-to-jsonld-parser.js <markdown-file>');
    process.exit(1);
  }

  try {
    const markdown = fs.readFileSync(inputFile, 'utf-8');
    const jsonld = parseMarkdownToJSON(markdown);
    console.log(JSON.stringify(jsonld, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  parseMarkdownToJSON,
  parseMarkdownSections,
  slugify
};
