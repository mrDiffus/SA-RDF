#!/usr/bin/env python3
"""
Build a comprehensive resource index from all JSON-LD files in public/data
Usage: python scripts/build-resource-index.py
Output: public/data/resource-index.json
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import sys


class ResourceIndexBuilder:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.index = {
            "generatedAt": datetime.now().isoformat(),
            "version": "1.0",
            "resources": [],
            "byId": {},
            "byLabel": {},
            "byType": {},
            "byFile": {},
            "summary": {}
        }
        
    def find_json_files(self) -> List[Path]:
        """Recursively find all JSON files in data directory"""
        json_files = []
        for root, dirs, files in os.walk(self.data_dir):
            for file in files:
                if file.endswith('.json') and file != 'resource-index.json':
                    json_files.append(Path(root) / file)
        return sorted(json_files)
    
    def extract_resources_from_file(self, file_path: Path, relative_path: str) -> List[Dict[str, Any]]:
        """Extract resources from a single JSON-LD file"""
        resources = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle @graph array
            if isinstance(data.get('@graph'), list):
                items = data['@graph']
            elif data.get('@type') or data.get('rdfs:label'):
                items = [data]
            else:
                return []
            
            for item in items:
                if not isinstance(item, dict):
                    continue
                
                resource = {
                    'file': relative_path,
                    '@type': item.get('@type', 'unknown'),
                    'rdfs:label': item.get('rdfs:label') or item.get('name') or item.get('id') or '(unlabeled)',
                    '@id': item.get('@id'),
                    'predicates': [k for k in item.keys() if not k.startswith('@')]
                }
                
                # Include key predicates
                if 'sa:description' in item:
                    desc = item['sa:description']
                    resource['sa:description'] = desc[:100] + '...' if len(desc) > 100 else desc
                if 'sa:requirements' in item:
                    resource['sa:requirements'] = item['sa:requirements']
                if 'sa:actionType' in item:
                    resource['sa:actionType'] = item['sa:actionType']
                if 'sa:spellLevel' in item:
                    resource['sa:spellLevel'] = item['sa:spellLevel']
                
                resources.append(resource)
        
        except Exception as e:
            print(f"⚠️  Error processing {file_path}: {e}", file=sys.stderr)
        
        return resources
    
    def build(self) -> None:
        """Build the complete resource index"""
        json_files = self.find_json_files()
        print(f"Found {len(json_files)} JSON files", file=sys.stderr)
        
        for file_path in json_files:
            relative_path = file_path.relative_to(self.data_dir).as_posix()
            resources = self.extract_resources_from_file(file_path, relative_path)
            
            for resource in resources:
                self.index['resources'].append(resource)
                
                # Index by @id
                if resource['@id']:
                    if resource['@id'] not in self.index['byId']:
                        self.index['byId'][resource['@id']] = []
                    self.index['byId'][resource['@id']].append(resource)
                
                # Index by label
                label = resource['rdfs:label']
                if label:
                    if label not in self.index['byLabel']:
                        self.index['byLabel'][label] = []
                    self.index['byLabel'][label].append(resource)
                
                # Index by type
                res_type = resource['@type']
                if res_type:
                    if res_type not in self.index['byType']:
                        self.index['byType'][res_type] = []
                    self.index['byType'][res_type].append(resource)
                
                # Index by file
                if relative_path not in self.index['byFile']:
                    self.index['byFile'][relative_path] = []
                self.index['byFile'][relative_path].append(resource)
        
        # Add summary
        self.index['summary'] = {
            'totalFiles': len(json_files),
            'totalResources': len(self.index['resources']),
            'uniqueTypes': len(self.index['byType']),
            'typeBreakdown': {t: len(items) for t, items in self.index['byType'].items()}
        }
        
        print(f"Indexed {self.index['summary']['totalResources']} resources from {json_files.__len__()} files", file=sys.stderr)
    
    def save(self, output_path: str) -> None:
        """Save index to JSON file"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.index, f, indent=2)
        
        print(f"✅ Index saved to {output_path}", file=sys.stderr)


def main():
    # Get workspace root
    script_dir = Path(__file__).parent
    workspace_root = script_dir.parent
    data_dir = workspace_root / 'public' / 'data'
    output_file = data_dir / 'resource-index.json'
    
    if not data_dir.exists():
        print(f"Error: Data directory not found at {data_dir}", file=sys.stderr)
        sys.exit(1)
    
    builder = ResourceIndexBuilder(str(data_dir))
    builder.build()
    builder.save(str(output_file))


if __name__ == '__main__':
    main()
