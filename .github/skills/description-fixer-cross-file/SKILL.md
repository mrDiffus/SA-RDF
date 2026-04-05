---
name: description-fixer-cross-file
description: "Use when: fixing and tidying sa:description predicates in a single JSON-LD file while fetching definitions and constraints from related resources in other data files. Good for restructuring verbose descriptions with proper reference resolution."
---

# Description Fixer with Cross-File Resolution

This skill helps you tidy and improve `sa:description` predicates in JSON-LD files by leveraging a comprehensive resource index to cross-reference related definitions, constraints, and mechanics from other data files.

## What This Skill Does

1. **Loads the target file** — the JSON-LD file you want to fix
2. **Fetches the resource index** — built at `public/data/resource-index.json`
3. **Resolves cross-references** — looks up related resources by ID, label, or type
4. **Contextualizes descriptions** — understands constraints from related files
5. **Suggests improvements** — restructures descriptions for clarity while preserving intent
6. **Applies fixes** — updates descriptions in your target file

## How to Use This Skill

### Basic Usage

```
/description-fixer-cross-file --file public/data/basics/actions.json
```

### With Specific Resource

```
/description-fixer-cross-file --file public/data/basics/actions.json --resource "Cunning Action"
```

### Dry Run (Preview Only)

```
/description-fixer-cross-file --file public/data/basics/actions.json --dry-run
```

## Resource Index Structure

The generated index (`public/data/resource-index.json`) contains:

```json
{
  "generatedAt": "ISO timestamp",
  "version": "1.0",
  "resources": [
    {
      "file": "path/to/file.json",
      "@type": "sa:Type",
      "rdfs:label": "Resource Name",
      "@id": "optional-id",
      "sa:description": "First 100 chars...",
      "predicates": ["list", "of", "all", "predicates"]
    }
  ],
  "byId": { "@id": [resources] },
  "byLabel": { "Resource Name": [resources] },
  "byType": { "sa:Type": [resources] },
  "byFile": { "path/to/file.json": [resources] },
  "summary": {
    "totalResources": 128,
    "totalFiles": 51,
    "typeBreakdown": { "sa:Type": count, ... }
  }
}
```

## Key Resource Types

| Type | Count | Examples |
|------|-------|----------|
| `sa:Skill` | 58 | Skills from skills.json |
| `sa:Feature` | 29 | Race/archetype features |
| `archetype:Archetype` | 16 | Archetypes from each archetype/*.json |
| `sa:Race` | 12 | Races from races.json |
| `sa:Equipment` | 4 | Equipment types from equipment/*.json |
| `sa:Action` | (via ActionList) | Actions from basics/actions.json |
| `sa:Section` | 3 | Rules sections from rules.json |

## Files Indexed

### Core Rules
- `basics.json` — Basic game mechanics index
- `basics/actions.json` — Combat and roleplay actions
- `basics/character-creation.json` — Character creation rules
- `generalfeatures.json` — General features available to all
- `rules.json` — Game rules and mechanics
- `skills.json` — Skill definitions (58 skills indexed)
- `spells.json` — Spell definitions
- `spells.scraped.json` — Additional spells

### Player Options
- `archetypes.json` — Archetype index
- `archetypes/*.json` — Individual archetype definitions (16 files)
- `races.json` — Race index
- `races/*-features.json` — Race-specific features (9 files)

### Equipment & Items
- `equipment/armor.json` — Armor definitions
- `equipment/melee-weapons.json` — Melee weapons
- `equipment/ranged-weapons.json` — Ranged weapons
- `equipment/mechs.json` — Mech definitions
- `equipment/WondrousItems.json` — Magical items

### Setting
- `Setting/Organizations/Armanitech/armanitech.json` — Organization data
- `Setting/Planets/Arcech/arcech.json` — Planet data
- `Setting/Planets/Arrur/arrur.json` — Planet data
- `Setting/Planets/Arrur/Places/*.json` — Location data (8 files)

## How to Regenerate the Index

The resource index is automatically built and cached at `public/data/resource-index.json`. To regenerate it manually:

```bash
cd c:\workspaces\SA-RDF
python scripts/build-resource-index.py
```

This scans all 51 JSON-LD files and extracts 128 resources, organized by:
- **@id** — for looking up resources by unique identifier
- **rdfs:label** — for looking up resources by display name
- **@type** — for finding all resources of a particular type
- **file** — for finding all resources in a file

## Tips for Using This Skill

1. **Load your target file** in the editor before invoking the skill
2. **Provide context** — if a description references weapons, spells, or mechanics, mention which file they're from
3. **Ask for clarification** — the skill will flag misalignments and ask questions about intent
4. **Iterate** — tidied descriptions are shown for review before applying
5. **Regenerate on major changes** — if you add many new resources, regenerate the index

## Example Workflow

1. Open `public/data/basics/actions.json` in editor
2. Run `/description-fixer-cross-file --file public/data/basics/actions.json`
3. Skill loads the file and index, then presents suggestions like:
   ```
   **Current (Attack action):**
   Make an attack with a wielded weapon. If you are proficient...

   **Tidied:**
   Make an attack with a wielded weapon. Use your attack roll...

   **Cross-references resolved:**
   - Proficiency Bonus (from generalfeatures.json)
   - Ability Modifiers (from basics/character-creation.json)
   - Weapon properties (from equipment/*.json)
   ```
4. Review and approve changes
5. File is updated with improved descriptions

## Regenerate Index Command

Keep the index current with your latest data changes:

```bash
python scripts/build-resource-index.py
```

**Output:** `public/data/resource-index.json` (indexed 128 resources from 51 files)

