---
name: spells-json-authoring
description: "Create and refactor public/data/spells.json entries while preserving spell intent. Use for adding new spells, normalizing representation, enforcing implicit schema, and making non-semantic cleanup changes."
argument-hint: "Describe the spell task: add, refactor, normalize, or explicit definition change"
---

# Spells JSON Authoring

Create or refactor spell entries in `public/data/spells.json` with strict schema conformance and minimal semantic drift.

## When To Use
- Add one or more spells to `sa:items`.
- Refactor existing spell entries for consistency, formatting, or RDF/JSON-LD representation.
- Normalize field completeness and value types to match runtime expectations.
- Perform cleanup without changing spell behavior.

## Do Not Use For
- Game-design rewrites, rebalancing, or lore changes unless explicitly requested.
- Broad content rewriting of many spells when intent changes are uncertain.

## Implicit Schema Contract
Every object in `@graph[?@id=="sa:spellList"].sa:items[]` should include:
- `@id`: string
- `@type`: exactly `spell:Spell`
- `rdfs:label`: string
- `spell:castingtime`: string
- `spell:description`: string (can be empty when source is incomplete)
- `spell:duration`: string
- `spell:range`: string
- `spell:ritual`: boolean
- `spell:target`: string
- `sa:effect`: string (empty string allowed)

## Workflow
1. Locate spell list:
- Open `public/data/spells.json`.
- Find `@graph` node with `@id: "sa:spellList"`.
- Operate only inside `sa:items` unless user asked for metadata/context changes.

2. Determine task type:
- `Refactor-only` (default): change representation only, preserve meaning.
- `Definition change` (opt-in): alter effects, range, duration, targeting, or other spell behavior only if user explicitly asks.

3. Apply safe refactors:
- Keep JSON valid and structurally consistent.
- Keep key names exactly as currently used by the app.
- Normalize missing required keys by adding placeholders with correct types.
- Prefer preserving existing wording, punctuation, and capitalization unless fixing obvious typos requested by user.
- Preserve `@id` unless user explicitly requests an identifier migration.

4. Guard against semantic drift:
- Do not change mechanical meaning (damage, area, duration, range, targeting, conditions, action economy) in refactor-only mode.
- If a requested formatting change could alter meaning, stop and ask for confirmation.

5. Validate before finishing:
- Confirm file parses as JSON.
- Confirm each touched spell still has all required keys and expected primitive types.
- Confirm no unintended key renames (for example, `spell:castingtime` must not become `spell:castingTime`).

## Decision Rules
- If instruction is ambiguous between cleanup and mechanical change, treat it as cleanup only and ask a clarifying question.
- If data is incomplete, fill schema-required fields with type-safe placeholders, then flag the entry for follow-up.
- If duplicate or inconsistent IDs are found, report them and request migration approval before changing IDs.

## Output Expectations
- Provide the exact JSON edits made.
- Call out whether changes were `representation-only` or included `explicit definition changes`.
- List any fields still incomplete after refactor.

## Completion Checklist
- JSON remains valid.
- Touched spells conform to implicit schema.
- Intent unchanged unless explicitly instructed.
- Changes are limited to requested scope.
