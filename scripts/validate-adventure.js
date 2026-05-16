#!/usr/bin/env node

/**
 * validate-adventure.js
 * 
 * Validates an adventure JSON-LD against the SHACL Adventure shape.
 * This is a manual validator that checks required properties per the adventure.ttl SHACL shape.
 * 
 * For full SHACL validation, use validate-adventure.py with pyshacl library.
 * 
 * Usage:
 *   node validate-adventure.js <adventure.jsonld>
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_PROPERTIES = {
  'Adventure': {
    required: ['schema:title', 'schema:description', 'adv:hasPart'],
    minCount: { 'adv:hasPart': 1 }
  },
  'Chapter': {
    required: ['rdfs:label', 'schema:description'],
    minCount: {}
  },
  'NPC': {
    required: ['schema:name', 'adv:role', 'schema:description'],
    minCount: {}
  },
  'Location': {
    required: ['schema:name', 'schema:description'],
    minCount: { 'adv:hasArea': 1 }
  },
  'Area': {
    required: ['adv:areaNumber', 'schema:description'],
    minCount: {}
  },
  'Encounter': {
    required: ['schema:name', 'schema:description', 'adv:location'],
    minCount: {}
  },
  'Monster': {
    required: ['schema:name', 'adv:count'],
    minCount: {}
  }
};

class AdventureValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate an adventure JSON-LD object
   * @param {object} adventure - JSON-LD adventure object
   * @returns {object} { valid: boolean, errors: [], warnings: [] }
   */
  validate(adventure) {
    this.errors = [];
    this.warnings = [];

    if (!adventure) {
      this.errors.push('Adventure is null or undefined');
      return this.report();
    }

    // Validate top-level adventure
    this.validateNode(adventure, 'Adventure', 'root');

    // Validate chapters
    if (adventure['adv:hasPart'] && Array.isArray(adventure['adv:hasPart'])) {
      adventure['adv:hasPart'].forEach((chapter, idx) => {
        this.validateNode(chapter, 'Chapter', `hasPart[${idx}]`);
      });
    }

    // Validate NPCs
    if (adventure['adv:hasNPC'] && Array.isArray(adventure['adv:hasNPC'])) {
      adventure['adv:hasNPC'].forEach((npc, idx) => {
        this.validateNode(npc, 'NPC', `hasNPC[${idx}]`);
      });
    }

    // Validate locations
    if (adventure['adv:hasLocation'] && Array.isArray(adventure['adv:hasLocation'])) {
      adventure['adv:hasLocation'].forEach((location, idx) => {
        this.validateNode(location, 'Location', `hasLocation[${idx}]`);
        
        // Validate areas within location
        if (location['adv:hasArea'] && Array.isArray(location['adv:hasArea'])) {
          location['adv:hasArea'].forEach((area, areaIdx) => {
            this.validateNode(area, 'Area', `hasLocation[${idx}].hasArea[${areaIdx}]`);
          });
        }
      });
    }

    // Validate encounters
    if (adventure['adv:hasEncounter'] && Array.isArray(adventure['adv:hasEncounter'])) {
      adventure['adv:hasEncounter'].forEach((encounter, idx) => {
        this.validateNode(encounter, 'Encounter', `hasEncounter[${idx}]`);
        
        // Validate monsters within encounter
        if (encounter['adv:hasMonster'] && Array.isArray(encounter['adv:hasMonster'])) {
          encounter['adv:hasMonster'].forEach((monster, monsterIdx) => {
            this.validateNode(monster, 'Monster', `hasEncounter[${idx}].hasMonster[${monsterIdx}]`);
          });
        }
      });
    }

    return this.report();
  }

  /**
   * Validate a single node against its shape
   * @param {object} node - The node to validate
   * @param {string} type - The type (Adventure, Chapter, NPC, etc.)
   * @param {string} path - The path in the document for error reporting
   */
  validateNode(node, type, path) {
    const shape = REQUIRED_PROPERTIES[type];
    if (!shape) {
      return; // No shape defined for this type
    }

    // Check required properties
    if (shape.required) {
      for (const prop of shape.required) {
        if (!node.hasOwnProperty(prop) || node[prop] === null || node[prop] === undefined) {
          this.errors.push(`${path}: Missing required property '${prop}' for ${type}`);
        }
      }
    }

    // Check minCount
    if (shape.minCount) {
      for (const [prop, minCount] of Object.entries(shape.minCount)) {
        const value = node[prop];
        if (Array.isArray(value)) {
          if (value.length < minCount) {
            this.errors.push(
              `${path}: Property '${prop}' requires minCount of ${minCount}, found ${value.length}`
            );
          }
        } else if (minCount > 0 && (!value || value.length === 0)) {
          this.errors.push(
            `${path}: Property '${prop}' requires minCount of ${minCount}, found none`
          );
        }
      }
    }
  }

  /**
   * Generate validation report
   * @returns {object} { valid: boolean, errors: [], warnings: [] }
   */
  report() {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: `${this.errors.length} errors, ${this.warnings.length} warnings`
    };
  }
}

// CLI support
if (require.main === module) {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node validate-adventure.js <adventure.jsonld>');
    process.exit(1);
  }

  try {
    const jsonldText = fs.readFileSync(inputFile, 'utf-8');
    const adventure = JSON.parse(jsonldText);
    
    const validator = new AdventureValidator();
    const result = validator.validate(adventure);

    console.log(`\n=== Adventure Validation ===\n`);
    console.log(`File: ${inputFile}`);
    console.log(`Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}`);
    console.log(`${result.summary}\n`);

    if (result.errors.length > 0) {
      console.log('ERRORS:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log('\nWARNINGS:');
      result.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    if (result.valid) {
      console.log('✓ All validation checks passed!');
    }

    process.exit(result.valid ? 0 : 1);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

module.exports = AdventureValidator;
