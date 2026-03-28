---
name: equipment-json-authoring
description: "Create and refactor public/data/equipment.json and category files while preserving equipment stats and intent. Use for adding equipment, normalizing representation, enforcing implicit schema, and making non-semantic cleanup changes."
argument-hint: "Describe the equipment task: add, refactor, normalize, or explicit stat change"
---

# Equipment JSON Authoring

Create or refactor equipment entries in `public/data/equipment.json` and `public/data/equipment/*.json` files with strict schema conformance and minimal semantic drift.

## When To Use
- Add one or more equipment items to a category file.
- Refactor existing equipment entries for consistency, formatting, or RDF/JSON-LD representation.
- Normalize field completeness and value types to match runtime expectations.
- Perform cleanup without changing equipment stats or properties.

## Do Not Use For
- Game-design rebalancing or stat changes unless explicitly requested.
- Broad property rewriting of many items when mechanical intent changes are uncertain.

## Implicit Schema Contract
Every equipment object in category files should include:
- `@id`: string (unique identifier)
- `@type`: string (equipment category marker)
- `rdfs:label`: string (display name)
- `sa:description`: string (flavor, mechanics, or usage notes)
- Optional numeric properties: `sa:cost` (number), `sa:weight` (number), `sa:damageAbsorption` (number), `sa:hardness` (number), `sa:maxDexterity` (number)
- Optional string properties: `sa:damage` (string), `sa:damageType` (string), `sa:criticalModifier` (string), `sa:size` (string), `sa:specialProperties` (string)
- Optional object properties: `sa:rangeMeters` (with `normal` and `maximum` fields), `sa:armorClass` (string or number)
- Optional array: `sa:tags` (string array for equipment tags/keywords)

## Workflow
1. **Locate equipment**:
   - Open `public/data/equipment.json` for structure, or the specific category file in `public/data/equipment/*.json`.
   - Items are in the `@graph` array or nested under equipment group nodes.

2. **Determine task type**:
   - `Refactor-only` (default): change representation only, preserve all stats and properties.
   - `Stat change` (opt-in): alter damage, cost, weight, AC, range, or other mechanical properties only if user explicitly asks.

3. **Apply safe refactors**:
   - Keep JSON valid and structurally consistent.
   - Keep key names exactly as currently used by the app.
   - Normalize missing optional keys with type-safe defaults (empty strings, empty arrays, null for numbers).
   - Prefer preserving existing wording, punctuation, and capitalization unless fixing obvious typos requested by user.
   - Preserve `@id` unless user explicitly requests an identifier migration.

4. **Guard against semantic drift**:
   - Do not change mechanical properties (damage, AC, cost, weight, range, criticalModifier, specialProperties) in refactor-only mode.
   - If a formatting change could alter stats, stop and ask for confirmation.

5. **Validate before finishing**:
   - Confirm file parses as JSON.
   - Confirm each touched item has `@id`, `@type`, `rdfs:label`, and `sa:description`.
   - Confirm numeric properties are numbers, not strings (e.g., `"cost": 50` not `"cost": "50"`).
   - Confirm arrays remain arrays and objects remain objects.

## Decision Rules
- If instruction is ambiguous between cleanup and mechanical change, treat it as cleanup and ask a clarifying question.
- If data is incomplete, fill required fields with type-safe placeholders, then flag the entry for follow-up.
- If duplicate or inconsistent IDs are found, report them and request migration approval before changing IDs.

## Output Expectations
- Provide the exact JSON edits made.
- Call out whether changes were `representation-only` or included `explicit stat changes`.
- List any fields still incomplete or malformed after refactor.

## Completion Checklist
- JSON remains valid and properly grouped.
- Touched items conform to implicit schema.
- Stats and properties unchanged unless explicitly instructed.
- Changes are limited to requested scope.
