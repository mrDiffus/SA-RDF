# Description Fixer with Cross-File Resolution

**Status**: ✅ Ready to use  
**Created**: 2026-04-05  
**Version**: 1.0

## Overview

The **description-fixer-cross-file** skill helps you tidy and improve `sa:description` predicates in JSON-LD files by:

1. **Analyzing descriptions** for structural and clarity issues
2. **Cross-referencing resources** via a comprehensive resource index
3. **Suggesting improvements** while preserving mechanical meaning
4. **Providing context** from related definitions in other data files

This skill complements the **description-tidier** agent by adding:
- Single-file focus with cross-file reference resolution
- Automated suggestion detection
- Direct integration with the resource index
- Batch processing capability

## Quick Start

### Load Resource Index

The skill uses `public/data/resource-index.json`, which is built automatically. To regenerate it:

```bash
python scripts/build-resource-index.py
```

**Output**: 128 resources indexed from 51 files

### Using the Skill

Via command line (for testing):

```bash
python .github/skills/description-fixer-cross-file/fix-descriptions.py --file public/data/basics/actions.json --dry-run
```

Via Copilot (when skill is active):

```
/description-fixer-cross-file --file public/data/basics/actions.json
```

### Example Output

```json
{
  "file": "public/data/basics/actions.json",
  "dry_run": true,
  "results_count": 18,
  "results": [
    {
      "status": "needs_review",
      "label": "Ambush",
      "type": "sa:Action",
      "current": "As part of a single attack roll with one weapon, roll a Stealth check at disadvantage...",
      "suggestions": [
        "Important constraints are at the end - move to top or middle for clarity"
      ]
    }
  ]
}
```

## Resource Index

### Structure

```
public/data/resource-index.json
├── resources[] — All 128 resources
├── byId{} — Resources indexed by @id
├── byLabel{} — Resources indexed by rdfs:label
├── byType{} — Resources indexed by @type
├── byFile{} — Resources indexed by file path
└── summary{} — Statistics and type breakdown
```

### Coverage

| Resource Type | Count | Source Files |
|---|---|---|
| `sa:Skill` | 58 | skills.json |
| `sa:Feature` | 29 | races/*-features.json, archetype/*.json |
| `archetype:Archetype` | 16 | archetypes/\*.json |
| `sa:Race` | 12 | races.json |
| `sa:Equipment` | 4 | equipment/\*.json |
| `sa:Section` | 3 | rules.json |
| `sa:ActionList` | 1 | basics/actions.json |
| `sa:Basic` | 1 | basics.json |
| `sa:Spells` | 2 | spells.json, spells.scraped.json |
| `sa:WondrousItem` | 1 | equipment/WondrousItems.json |

### All Indexed Files (51 total)

**Core Rules (8 files)**
- `basics.json`, `basics/actions.json`, `basics/character-creation.json`
- `generalfeatures.json`, `rules.json`, `skills.json`, `spells.json`, `spells.scraped.json`

**Archetypes (17 files)**
- `archetypes.json`, `archetypes/academic.json`, `archetypes/ace.json`, `archetypes/arcanist.json`
- `archetypes/armsman.json`, `archetypes/cannoneer.json`, `archetypes/devotee.json`, `archetypes/gunslinger.json`
- `archetypes/martial-artist.json`, `archetypes/medical-personnel.json`, `archetypes/occultist.json`
- `archetypes/personality.json`, `archetypes/primitive.json`, `archetypes/recon.json`, `archetypes/scrounger.json`
- `archetypes/spacer.json`, `archetypes/technician.json`

**Races (10 files)**
- `races.json`
- `races/draegloth-features.json`, `races/drow-features.json`, `races/dwarf-features.json`
- `races/elf-features.json`, `races/feyri-features.json`, `races/gnome-features.json`
- `races/halfling-features.json`, `races/human-features.json`, `races/orc-features.json`

**Equipment (5 files)**
- `equipment/armor.json`, `equipment/melee-weapons.json`, `equipment/ranged-weapons.json`
- `equipment/mechs.json`, `equipment/WondrousItems.json`

**Setting (11 files)**
- `Setting/Organizations/Armanitech/armanitech.json`
- `Setting/Planets/Arcech/arcech.json`, `Setting/Planets/Arrur/arrur.json`
- `Setting/Planets/Arrur/Places/ashcross.json`, `Setting/Planets/Arrur/Places/bloodrift.json`
- `Setting/Planets/Arrur/Places/drowned-bastion.json`, `Setting/Planets/Arrur/Places/hollow-of-the-last-joke.json`
- `Setting/Planets/Arrur/Places/korvhal.json`, `Setting/Planets/Arrur/Places/skarths-hollow.json`
- `Setting/Planets/Arrur/Places/teeth-of-gorthuun.json`, `Setting/Planets/Arrur/Places/thakzas-grin.json`

## How It Works

### 1. Load Index

```python
fixer = DescriptionFixer('public/data/resource-index.json')
```

### 2. Process File

```python
file_data = fixer.load_file('public/data/basics/actions.json')
results = fixer.process_file(file_data)
```

### 3. Handle Nested Structures

The fixer automatically flattens nested arrays:

```
ActionList
  └── sa:actions[]  ← Each action gets processed
RaceList
  └── sa:features[]  ← Each feature gets processed
SkillCollection
  └── sa:skills[]   ← Each skill gets processed
```

### 4. Generate Suggestions

For each description, the fixer detects:

- **Too many lines** — Break into clearer structure
- **Constraints at end** — Move important limitations to top
- **Missing main action** — Ensure first line states the key action
- **Run-on sentences** — Too many short lines, combine for flow

### 5. Find Related Resources

```python
related = fixer.get_related_resources('Attack Action', 'sa:Action')
```

Looks up related resources by:
- Label (exact match in `byLabel`)
- Type (all resources of same type in `byType`)

## Files Included

```
.github/skills/description-fixer-cross-file/
├── SKILL.md  ← This documentation
├── README.md  ← You are here
└── fix-descriptions.py  ← Helper script

scripts/
└── build-resource-index.py  ← Index builder (run to regenerate)

public/data/
└── resource-index.json  ← Generated resource index
```

## Regenerating the Index

When you add or modify resources in the data files, regenerate the index:

```bash
cd c:\workspaces\SA-RDF
python scripts/build-resource-index.py
```

**What this does:**
- Scans all 51 JSON files in `public/data`
- Extracts 128 resources across 11 types
- Builds lookup indexes by ID, label, type, and file
- Writes to `public/data/resource-index.json`
- Outputs: `✅ Index saved to ...`

## Integration with Other Skills

### With `description-tidier` Agent

1. **Use description-tidier** for general tidying of any description
2. **Use description-fixer-cross-file** skill when:
   - You need cross-file reference resolution
   - Working on a single file with many descriptions
   - Want automated structural suggestions

### Workflow

```
1. Open target file (e.g., basics/actions.json)
2. Run: /description-fixer-cross-file --file basics/actions.json
3. Review suggestions
4. Invoke description-tidier agent for final polish
```

## Advanced Usage

### Process Single Resource

```bash
python fix-descriptions.py --file public/data/basics/actions.json --resource "Ambush"
```

### Custom Index Path

```bash
python fix-descriptions.py --file public/data/basics/actions.json --index custom-index.json
```

### Integration with Tests

```bash
# Generate report of all descriptions needing review
python fix-descriptions.py --file public/data/basics/actions.json > report.json
```

## Troubleshooting

### "Resource index not found"

Regenerate the index:
```bash
python scripts/build-resource-index.py
```

### "File not found"

Use absolute or workspace-relative paths:
- ✅ `public/data/basics/actions.json`
- ✅ `c:\workspaces\SA-RDF\public\data\basics\actions.json`
- ❌ `data/basics/actions.json` (wrong relative)

### Suggestions seem generic

The helper script uses simple heuristics. For more nuanced feedback, use the `description-tidier` agent after getting suggestions here.

## Future Enhancements

- [ ] Machine learning-based suggestion detection
- [ ] Direct integration with description-tidier agent
- [ ] Batch processing multiple files
- [ ] Custom suggestion rules via configuration
- [ ] Diff generation for review before saving

## See Also

- [description-tidier Agent](.github/agents/description-tidier.agent.md)
- [Resource Index](.github/skills/description-fixer-cross-file/resource-index.json)
- [Archetypes JSON Authoring](.github/skills/archetypes-json-authoring/SKILL.md)
- [Equipment JSON Authoring](.github/skills/equipment-json-authoring/SKILL.md)
- [Spells JSON Authoring](.github/skills/spells-json-authoring/SKILL.md)
