#!/usr/bin/env node

/**
 * jsonld-to-markdown-exporter.js
 * 
 * Converts a JSON-LD adventure object back into readable markdown format.
 * Useful for archival, documentation, and version control.
 * 
 * Usage:
 *   const exporter = require('./jsonld-to-markdown-exporter.js');
 *   const markdown = exporter.exportToMarkdown(adventureJSON);
 */

/**
 * Export JSON-LD adventure to readable markdown
 */
function exportToMarkdown(adventure) {
  let output = '';

  // Title
  const title = adventure['schema:title'] || adventure['rdfs:label'] || 'Untitled Adventure';
  output += `# ${title}\n\n`;

  // Overview
  output += '## Overview\n\n';
  if (adventure['schema:description']) {
    output += `**Hook**: ${adventure['schema:description']}\n\n`;
  }
  output += '\n';

  // Chapters
  const chapters = adventure['adv:hasPart'] || [];
  if (Array.isArray(chapters) && chapters.length > 0) {
    output += '## Chapters\n\n';
    chapters.forEach((chapter, idx) => {
      const chapterTitle = chapter['rdfs:label'] || chapter['schema:name'] || `Chapter ${idx + 1}`;
      output += `### ${chapterTitle}\n\n`;
      if (chapter['schema:description']) {
        output += `${chapter['schema:description']}\n\n`;
      }
      output += '**Key Beats:**\n';
      output += '- [Scene or encounter]\n\n';
    });
  }

  // Locations
  const locations = adventure['adv:hasLocation'] || [];
  if (Array.isArray(locations) && locations.length > 0) {
    output += '## Locations\n\n';
    locations.forEach((location, idx) => {
      const locName = location['schema:name'] || location['rdfs:label'] || `Location ${idx + 1}`;
      output += `### Location: ${locName}\n\n`;
      
      if (location['schema:description']) {
        output += `**Description**: ${location['schema:description']}\n\n`;
      }

      const areas = location['adv:hasArea'] || [];
      if (Array.isArray(areas) && areas.length > 0) {
        output += '**Key Areas**:\n';
        areas.forEach(area => {
          const areaName = area['adv:areaName'] || area['schema:name'] || 'Area';
          output += `- ${areaName}\n`;
        });
        output += '\n';
      }
    });
  }

  // NPCs
  const npcs = adventure['adv:hasNPC'] || [];
  if (Array.isArray(npcs) && npcs.length > 0) {
    output += '## NPCs\n\n';
    npcs.forEach((npc, idx) => {
      const npcName = npc['schema:name'] || npc['rdfs:label'] || `NPC ${idx + 1}`;
      output += `### ${npcName}\n\n`;
      
      if (npc['adv:role']) {
        output += `**Role**: ${npc['adv:role']}\n\n`;
      }
      
      if (npc['adv:faction']) {
        output += `**Faction**: ${npc['adv:faction']}\n\n`;
      }
      
      if (npc['adv:statBlock'] || npc['adv:archetype']) {
        output += `**Archetype**: ${npc['adv:statBlock'] || npc['adv:archetype']}\n\n`;
      }
      
      if (npc['schema:description']) {
        output += `**Personality**: ${npc['schema:description']}\n\n`;
      }
    });
  }

  // Encounters
  const encounters = adventure['adv:hasEncounter'] || [];
  if (Array.isArray(encounters) && encounters.length > 0) {
    output += '## Combat Encounters\n\n';
    encounters.forEach((encounter, idx) => {
      const encName = encounter['schema:name'] || encounter['rdfs:label'] || `Encounter ${idx + 1}`;
      output += `### Encounter: ${encName}\n\n`;
      
      if (encounter['schema:description']) {
        output += `**Objective**: ${encounter['schema:description']}\n\n`;
      }

      const monsters = encounter['adv:hasMonster'] || [];
      if (Array.isArray(monsters) && monsters.length > 0) {
        output += '**Antagonists**:\n';
        monsters.forEach(monster => {
          const monName = monster['schema:name'] || 'Antagonist';
          const count = monster['adv:count'] || 1;
          output += `- ${monName}${count > 1 ? ` (x${count})` : ''}\n`;
        });
        output += '\n';
      }

      if (encounter['adv:tactics']) {
        output += `**Tactics**: ${encounter['adv:tactics']}\n\n`;
      }
    });
  }

  return output;
}

/**
 * Export with detailed formatting options
 */
function exportToMarkdownDetailed(adventure, options) {
  options = options || {};
  const includeMetadata = options.includeMetadata !== false;
  const includeIds = options.includeIds || false;

  let output = '';

  // Metadata
  if (includeMetadata) {
    output += '---\n';
    output += `id: ${adventure['@id'] || 'unknown'}\n`;
    output += `created: ${new Date().toISOString()}\n`;
    output += '---\n\n';
  }

  // Rest of content
  output += exportToMarkdown(adventure);

  return output;
}

// CLI support
if (require.main === module) {
  const fs = require('fs');
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.error('Usage: node jsonld-to-markdown-exporter.js <adventure.jsonld> [output.md]');
    process.exit(1);
  }

  try {
    const jsonldText = fs.readFileSync(inputFile, 'utf-8');
    const adventure = JSON.parse(jsonldText);
    const markdown = exportToMarkdown(adventure);

    if (outputFile) {
      fs.writeFileSync(outputFile, markdown, 'utf-8');
      console.log(`Exported to ${outputFile}`);
    } else {
      console.log(markdown);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  exportToMarkdown,
  exportToMarkdownDetailed
};
