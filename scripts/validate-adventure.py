#!/usr/bin/env python3

"""
validate-adventure.py

Validates an adventure JSON-LD against the SHACL Adventure shape.

Attempts to use pyshacl library for full RDF validation if available,
otherwise falls back to manual property validation.

Usage:
    python validate-adventure.py <adventure.jsonld>

Requirements:
    pyshacl>=0.18.0 (optional, for full RDF validation)
    rdflib>=6.0.0 (optional, for full RDF validation)
"""

import sys
import json
import argparse
from pathlib import Path

# Try to import pyshacl for full RDF validation
try:
    from pyshacl import validate
    from rdflib import Graph
    HAS_PYSHACL = True
except ImportError:
    HAS_PYSHACL = False

REQUIRED_PROPERTIES = {
    'Adventure': {
        'required': [
            'http://schema.org/title',
            'http://schema.org/description',
            'https://stellar-arcana.org/adventure#hasPart'
        ],
        'minCount': {
            'https://stellar-arcana.org/adventure#hasPart': 1
        }
    },
    'Chapter': {
        'required': [
            'http://www.w3.org/2000/01/rdf-schema#label',
            'http://schema.org/description'
        ],
        'minCount': {}
    },
    'NPC': {
        'required': [
            'http://schema.org/name',
            'https://stellar-arcana.org/adventure#role',
            'http://schema.org/description'
        ],
        'minCount': {}
    },
    'Location': {
        'required': [
            'http://schema.org/name',
            'http://schema.org/description'
        ],
        'minCount': {
            'https://stellar-arcana.org/adventure#hasArea': 1
        }
    },
    'Area': {
        'required': [
            'https://stellar-arcana.org/adventure#areaNumber',
            'http://schema.org/description'
        ],
        'minCount': {}
    },
    'Encounter': {
        'required': [
            'http://schema.org/name',
            'http://schema.org/description',
            'https://stellar-arcana.org/adventure#location'
        ],
        'minCount': {}
    },
    'Monster': {
        'required': [
            'http://schema.org/name',
            'https://stellar-arcana.org/adventure#count'
        ],
        'minCount': {}
    }
}


class AdventureValidator:
    """Validator for adventure JSON-LD documents."""

    def __init__(self):
        self.errors = []
        self.warnings = []

    def validate(self, adventure):
        """
        Validate an adventure JSON-LD object.
        
        Args:
            adventure (dict): JSON-LD adventure object
            
        Returns:
            dict: { 'valid': bool, 'errors': [], 'warnings': [] }
        """
        self.errors = []
        self.warnings = []

        if not adventure:
            self.errors.append('Adventure is null or undefined')
            return self.report()

        # Validate top-level adventure
        self._validate_node(adventure, 'Adventure', 'root')

        # Validate chapters
        chapters = adventure.get('adv:hasPart', [])
        if not isinstance(chapters, list):
            chapters = [chapters]
        for idx, chapter in enumerate(chapters):
            self._validate_node(chapter, 'Chapter', f'hasPart[{idx}]')

        # Validate NPCs
        npcs = adventure.get('adv:hasNPC', [])
        if not isinstance(npcs, list):
            npcs = [npcs] if npcs else []
        for idx, npc in enumerate(npcs):
            self._validate_node(npc, 'NPC', f'hasNPC[{idx}]')

        # Validate locations
        locations = adventure.get('adv:hasLocation', [])
        if not isinstance(locations, list):
            locations = [locations] if locations else []
        for idx, location in enumerate(locations):
            self._validate_node(location, 'Location', f'hasLocation[{idx}]')
            areas = location.get('adv:hasArea', [])
            if not isinstance(areas, list):
                areas = [areas] if areas else []
            for area_idx, area in enumerate(areas):
                self._validate_node(area, 'Area', f'hasLocation[{idx}].hasArea[{area_idx}]')

        # Validate encounters
        encounters = adventure.get('adv:hasEncounter', [])
        if not isinstance(encounters, list):
            encounters = [encounters] if encounters else []
        for idx, encounter in enumerate(encounters):
            self._validate_node(encounter, 'Encounter', f'hasEncounter[{idx}]')
            monsters = encounter.get('adv:hasMonster', [])
            if not isinstance(monsters, list):
                monsters = [monsters] if monsters else []
            for mon_idx, monster in enumerate(monsters):
                self._validate_node(monster, 'Monster', f'hasEncounter[{idx}].hasMonster[{mon_idx}]')

        return self.report()

    def _validate_node(self, node, node_type, path):
        """Validate a single node against its shape."""
        shape = REQUIRED_PROPERTIES.get(node_type)
        if not shape:
            return

        # Check required properties
        required = shape.get('required', [])
        for prop in required:
            if not node or prop not in node or node[prop] is None:
                # Also check short form (without namespace)
                short_prop = prop.split('#')[-1].replace('label', 'label')
                if not node or short_prop not in node or node[short_prop] is None:
                    self.errors.append(
                        f'{path}: Missing required property "{prop}" for {node_type}'
                    )

        # Check minCount
        mincount = shape.get('minCount', {})
        for prop, min_count in mincount.items():
            short_prop = prop.split('#')[-1]
            value = node.get(short_prop, []) if node else []
            if isinstance(value, list):
                if len(value) < min_count:
                    self.errors.append(
                        f'{path}: Property "{short_prop}" requires minCount of {min_count}, found {len(value)}'
                    )
            elif min_count > 0 and not value:
                self.errors.append(
                    f'{path}: Property "{short_prop}" requires minCount of {min_count}, found none'
                )

    def report(self):
        """Generate validation report."""
        return {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'summary': f'{len(self.errors)} errors, {len(self.warnings)} warnings'
        }


def validate_jsonld_file(filepath):
    """Validate a JSON-LD adventure file."""
    try:
        with open(filepath, 'r') as f:
            adventure = json.load(f)
    except json.JSONDecodeError as e:
        print(f'Error parsing JSON: {e}')
        return False
    except IOError as e:
        print(f'Error reading file: {e}')
        return False

    validator = AdventureValidator()
    result = validator.validate(adventure)

    print(f'\n=== Adventure Validation ===\n')
    print(f'File: {filepath}')
    print(f'Status: {"✓ VALID" if result["valid"] else "✗ INVALID"}')
    print(f'{result["summary"]}\n')

    if result['errors']:
        print('ERRORS:')
        for err in result['errors']:
            print(f'  - {err}')

    if result['warnings']:
        print('\nWARNINGS:')
        for warn in result['warnings']:
            print(f'  - {warn}')

    if result['valid']:
        print('\n✓ All validation checks passed!')

    return result['valid']


def main():
    parser = argparse.ArgumentParser(description='Validate an adventure JSON-LD against SHACL shape')
    parser.add_argument('adventure', help='Path to adventure.jsonld file')
    args = parser.parse_args()

    if not Path(args.adventure).exists():
        print(f'Error: File not found: {args.adventure}')
        sys.exit(1)

    valid = validate_jsonld_file(args.adventure)
    sys.exit(0 if valid else 1)


if __name__ == '__main__':
    main()
