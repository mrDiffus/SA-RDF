---
name: archetypes-json-authoring
description: "Create and refactor public/data/archetypes.json and archetypes/*.json entries while preserving class mechanics and intent. Use for adding archetypes, normalizing representation, enforcing implicit schema, and making non-semantic cleanup changes."
argument-hint: "Describe the archetype task: add, refactor, normalize, or explicit ability change"
---

# Archetypes JSON Authoring

Create or refactor archetype (class) entries in `public/data/archetypes.json` and `public/data/archetypes/*.json` files with strict schema conformance and minimal semantic drift.

## When To Use
- Add one or more archetypes to the data files.
- Add or refactor archetype features, proficiencies, or spellcasting.
- Refactor existing archetype entries for consistency, formatting, or RDF/JSON-LD representation.
- Normalize field completeness and value types to match runtime expectations.
- Perform cleanup without changing class mechanics or proficiencies.

## Do Not Use For
- Game-design rebalancing or mechanical reworking of classes unless explicitly requested.
- Broad rewriting of many archetypes when intent changes are uncertain.

## Implicit Schema Contract
Every archetype object should include:
- `@id`: string (unique identifier)
- `rdfs:label`: string (archetype/class name)
- `archetype:description`: string or string array (class identity and flavor)
- `archetype:proficiencies`: object with optional nested arrays for Skills, Weapons, Armor, Saves
- `sa:features`: array of feature objects (required, may be empty)

Proficiencies structure:
- `archetype:Skills`: array of skill proficiency objects or strings
- `archetype:Weapons`: array of weapon type objects or strings
- `archetype:Armor`: array of armor type objects or strings
- `archetype:Saves`: array of saving throw objects or strings

Each feature object includes:
- `rdfs:label`: string (feature name)
- `sa:description`: string or string array (detailed explanation, split into sentences)
- `sa:cost`: string (optional, e.g., "Level 1 Feature", "Level 5 Feature")
- `sa:prerequisites`: string array (optional, prerequisites to use this feature)

Optional fields on archetype:
- `archetype:spellcasting`: string (spellcasting info or reference)
- `spell-level-*`: arrays of spell objects for each spell level (e.g., `spell-level-0`, `spell-level-1`, etc.)

## Workflow
1. **Locate archetypes**:
   - Open `public/data/archetypes.json` or specific files in `public/data/archetypes/*.json`.
   - The main file may index members via `archetype:members` array pointing to individual files.
   - Archetypes are in the `@graph` array.

2. **Determine task type**:
   - `Refactor-only` (default): change representation, formatting, field structure only.
   - `Mechanics change` (opt-in): alter proficiencies, features, abilities, or spell levels only if user explicitly asks.

3. **Apply safe refactors**:
   - Keep JSON valid and structurally consistent.
   - Keep key names exactly as currently used by the app.
   - Normalize `archetype:description` (support both string and string array).
   - Normalize proficiency arrays to consistent format.
   - Preserve existing wording, punctuation, and capitalization unless fixing obvious typos requested by user.
   - Preserve `@id` unless user explicitly requests an identifier migration.

4. **Guard against semantic drift**:
   - Do not change proficiencies, features, feature costs, or spell access in refactor-only mode.
   - Do not reorder features without explicit approval.
   - If a formatting change could alter mechanics, stop and ask for confirmation.

5. **Validate before finishing**:
   - Confirm file parses as JSON.
   - Confirm each archetype has `@id`, `rdfs:label`, `archetype:description`, `archetype:proficiencies`, and `sa:features`.
   - Confirm each feature has `rdfs:label` and `sa:description`.
   - Confirm `archetype:proficiencies` object structure is consistent (nested arrays for each proficiency type).
   - Confirm `sa:description` is either a string or string array, not mixed types.

## Decision Rules
- If instruction is ambiguous between cleanup and mechanical change, treat it as cleanup and ask a clarifying question.
- If data is incomplete, fill required fields with type-safe placeholders, then flag the entry for follow-up.
- If duplicate or inconsistent IDs are found, report them and request migration approval before changing IDs.

## Output Expectations
- Provide the exact JSON edits made.
- Call out whether changes were `representation-only` or included `explicit mechanics changes`.
- List any fields still incomplete or malformed after refactor.
- Note any newly created or modified features, proficiencies, or spell lists.

## Completion Checklist
- JSON remains valid.
- Touched archetypes conform to implicit schema.
- Proficiencies and features unchanged unless explicitly instructed.
- Changes are limited to requested scope.
