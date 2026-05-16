#!/usr/bin/env node

/**
 * adventure-fragment-builder.js
 * 
 * Exports helper functions to generate SHACL-conformant adventure blocks.
 * Used during iteration to create properly structured NPCs, Encounters, Locations, etc.
 * 
 * Usage:
 *   const builder = require('./adventure-fragment-builder.js');
 *   const npc = builder.generateNPC('Vilak', 'antagonist', 'Armanitech', 'Armsman');
 */

/**
 * Generate a SHACL-conformant NPC block
 */
function generateNPC(name, role, faction, archetype) {
  return {
    '@type': 'adv:NPC',
    'rdfs:label': name,
    'schema:name': name,
    'adv:role': role || 'neutral',
    'schema:description': `An NPC in the adventure.`,
    'adv:faction': faction || 'Independent',
    'adv:archetype': archetype || undefined,
    'adv:appearance': undefined,
    'adv:personality': undefined,
    'adv:statBlock': archetype || undefined
  };
}

/**
 * Generate a SHACL-conformant Chapter block
 */
function generateChapter(baseId, chapterNum, title, description) {
  return {
    '@id': `${baseId}/chapter-${chapterNum}`,
    '@type': 'adv:Chapter',
    'rdfs:label': title || `Chapter ${chapterNum}`,
    'schema:description': description || `Chapter ${chapterNum} of the adventure.`
  };
}

/**
 * Generate a SHACL-conformant Location block
 */
function generateLocation(baseId, locNum, name, description, areas) {
  const location = {
    '@id': `${baseId}/location-${locNum}`,
    '@type': 'adv:Location',
    'rdfs:label': name,
    'schema:name': name,
    'schema:description': description || 'A location in the adventure.',
    'adv:hasArea': []
  };

  if (!areas || areas.length === 0) {
    // Default single area
    location['adv:hasArea'].push({
      '@id': `${baseId}/location-${locNum}/area-1`,
      '@type': 'adv:Area',
      'adv:areaNumber': '1',
      'adv:areaName': name || 'Main Area',
      'schema:description': description || 'The main area.'
    });
  } else {
    // Create area for each provided
    location['adv:hasArea'] = areas.map((area, idx) => ({
      '@id': `${baseId}/location-${locNum}/area-${idx + 1}`,
      '@type': 'adv:Area',
      'adv:areaNumber': String(idx + 1),
      'adv:areaName': area.name || `Area ${idx + 1}`,
      'schema:description': area.description || 'An area.'
    }));
  }

  return location;
}

/**
 * Generate a SHACL-conformant Encounter block
 */
function generateEncounter(baseId, encNum, name, locationId, objective, antagonists, tactics) {
  const encounter = {
    '@id': `${baseId}/encounter-${encNum}`,
    '@type': 'adv:Encounter',
    'rdfs:label': name || `Encounter ${encNum}`,
    'schema:name': name || `Encounter ${encNum}`,
    'schema:description': objective || 'An encounter.',
    'adv:location': locationId ? { '@id': locationId } : undefined,
    'adv:hasMonster': []
  };

  if (antagonists && antagonists.length > 0) {
    encounter['adv:hasMonster'] = antagonists.map((ant, idx) => ({
      '@type': 'adv:Monster',
      'schema:name': ant.name || `Antagonist ${idx + 1}`,
      'adv:count': ant.count || 1,
      'schema:description': ant.description || ant.name || 'An antagonist.'
    }));
  }

  if (tactics) {
    encounter['adv:tactics'] = tactics;
  }

  return encounter;
}

/**
 * Generate a SHACL-conformant Monster block
 */
function generateMonster(name, count, description) {
  return {
    '@type': 'adv:Monster',
    'schema:name': name,
    'adv:count': count || 1,
    'schema:description': description || name
  };
}

/**
 * Generate a SHACL-conformant Area block
 */
function generateArea(baseId, locNum, areaNum, areaName, description) {
  return {
    '@id': `${baseId}/location-${locNum}/area-${areaNum}`,
    '@type': 'adv:Area',
    'adv:areaNumber': String(areaNum),
    'adv:areaName': areaName || `Area ${areaNum}`,
    'schema:description': description || 'An area in the location.'
  };
}

/**
 * Generate a SHACL-conformant General Feature block
 */
function generateGeneralFeature(featureType, description) {
  return {
    '@type': 'adv:GeneralFeature',
    'adv:featureType': featureType,
    'schema:description': description
  };
}

/**
 * Generate a SHACL-conformant Organization block
 */
function generateOrganization(baseId, orgNum, name, type, description) {
  return {
    '@id': `${baseId}/org-${orgNum}`,
    '@type': 'adv:Organization',
    'rdfs:label': name,
    'schema:name': name,
    'adv:organizationType': type || 'Independent',
    'schema:description': description || 'An organization in the adventure.'
  };
}

/**
 * Recursively clean undefined properties
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

// CLI demo mode
if (require.main === module) {
  const builder = require('./adventure-fragment-builder.js');
  
  const exampleNPC = builder.generateNPC('Vex Torson', 'antagonist', 'Armanitech', 'Armsman');
  const exampleEncounter = builder.generateEncounter(
    'https://stellar-arcana.org/adventure/demo',
    1,
    'Corporate Security Checkpoint',
    'https://stellar-arcana.org/adventure/demo/location-1',
    'Bypass security without triggering alarms',
    [
      { name: 'Security Guard Captain', count: 1, description: 'Professional with plasma rifle' },
      { name: 'Security Drone', count: 2, description: 'Automated perimeter guards' }
    ],
    'Guards coordinate and call for backup if threat detected'
  );

  console.log('Example NPC:');
  console.log(JSON.stringify(exampleNPC, null, 2));
  console.log('\nExample Encounter:');
  console.log(JSON.stringify(exampleEncounter, null, 2));
}

module.exports = {
  generateNPC,
  generateChapter,
  generateLocation,
  generateEncounter,
  generateMonster,
  generateArea,
  generateGeneralFeature,
  generateOrganization,
  cleanUndefinedProperties
};
