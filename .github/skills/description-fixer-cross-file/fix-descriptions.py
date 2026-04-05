#!/usr/bin/env python3
"""
Helper script for description-fixer-cross-file skill
Tidies descriptions in a single JSON-LD file using the resource index
Usage: python fix-descriptions.py --file <path> [--dry-run] [--resource <name>]
"""

import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
import sys


class DescriptionFixer:
    def __init__(self, index_path: str):
        """Initialize with path to resource index"""
        self.index_path = Path(index_path)
        self.index = self._load_index()
    
    def _load_index(self) -> Dict[str, Any]:
        """Load the resource index"""
        if not self.index_path.exists():
            raise FileNotFoundError(f"Resource index not found at {self.index_path}")
        
        with open(self.index_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def load_file(self, file_path: str) -> Dict[str, Any]:
        """Load target JSON-LD file"""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_related_resources(self, label: str, res_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Find related resources by label or type"""
        results = []
        
        # Search by label
        if label in self.index['byLabel']:
            results.extend(self.index['byLabel'][label])
        
        # Search by type if provided
        if res_type and res_type in self.index['byType']:
            type_resources = self.index['byType'][res_type]
            # Filter to ones we didn't already find by label
            for res in type_resources:
                if res not in results:
                    results.append(res)
        
        return results
    
    def suggest_improvements(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest improvements for a resource item"""
        if 'sa:description' not in item:
            return {'status': 'no_description', 'item': item}
        
        description = item['sa:description']
        label = item.get('rdfs:label', 'Unknown')
        res_type = item.get('@type', 'Unknown')
        
        # Find related resources
        related = self.get_related_resources(label, res_type)
        
        return {
            'status': 'needs_review',
            'label': label,
            'type': res_type,
            'current': description,
            'related_resources': related,
            'suggestions': self._generate_suggestions(description, item)
        }
    
    def _generate_suggestions(self, description: str, item: Dict[str, Any]) -> List[str]:
        """Generate specific improvement suggestions"""
        suggestions = []
        
        # Check for common issues
        lines = description.split('\n')
        
        # Issue 1: Too many separate lines (run-on structure)
        if len(lines) > 5:
            suggestions.append("Description has many lines - consider consolidating related concepts")
        
        # Issue 2: Constraints at the end
        if any(line.strip().startswith(('If', 'Cannot', 'Cannot use', 'This action')) for line in lines[-2:]):
            suggestions.append("Important constraints are at the end - move to top or middle for clarity")
        
        # Issue 3: Missing main action in first line
        first_line = lines[0] if lines else ""
        if not any(verb in first_line.lower() for verb in ['make', 'roll', 'declare', 'designate', 'spend']):
            suggestions.append("First line should clearly state the main action")
        
        # Issue 4: Norwegian-like structure (multiple short sentences)
        very_short_lines = [l for l in lines if len(l.strip()) < 40 and l.strip()]
        if len(very_short_lines) > 3:
            suggestions.append("Multiple short sentences - consider combining for better flow")
        
        return suggestions
    
    def process_file(self, file_data: Dict[str, Any], dry_run: bool = True, resource_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Process all descriptions in a file"""
        results = []
        
        # Handle @graph format
        items = file_data.get('@graph', [])
        if not items:
            # Try single resource
            if file_data.get('sa:description'):
                items = [file_data]
        
        # Flatten nested structures (e.g., sa:actions, sa:features, sa:skills in containers)
        flattened_items = []
        for item in items:
            if not isinstance(item, dict):
                continue
            
            flattened_items.append(item)
            
            # Check for nested arrays like sa:actions, sa:features, sa:skills
            for key in ['sa:actions', 'sa:features', 'sa:skills', 'sa:spells']:
                if key in item and isinstance(item[key], list):
                    flattened_items.extend(item[key])
        
        for item in flattened_items:
            if not isinstance(item, dict):
                continue
            
            label = item.get('rdfs:label')
            
            # Filter if needed
            if resource_filter and label != resource_filter:
                continue
            
            if 'sa:description' in item:
                suggestion = self.suggest_improvements(item)
                results.append(suggestion)
        
        return results
    
    def save_file(self, file_path: str, file_data: Dict[str, Any]) -> None:
        """Save modified file"""
        file_path = Path(file_path)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(file_data, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description='Tidy descriptions in JSON-LD file with cross-reference resolution')
    parser.add_argument('--file', required=True, help='JSON-LD file to process')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes only')
    parser.add_argument('--resource', help='Process only this resource by label')
    parser.add_argument('--index', default='public/data/resource-index.json', help='Path to resource index')
    
    args = parser.parse_args()
    
    try:
        # Initialize fixer
        fixer = DescriptionFixer(args.index)
        
        # Load file
        file_data = fixer.load_file(args.file)
        
        # Process descriptions
        results = fixer.process_file(file_data, dry_run=args.dry_run, resource_filter=args.resource)
        
        # Output results
        print(json.dumps({
            'file': args.file,
            'dry_run': args.dry_run,
            'results_count': len(results),
            'results': results
        }, indent=2, ensure_ascii=False))
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
