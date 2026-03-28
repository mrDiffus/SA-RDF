---
name: races-json-authoring
description: "Create and refactor public/data/races.json and races/*-features.json entries while preserving racial traits and intent. Use for adding races, normalizing representation, enforcing implicit schema, and making non-semantic cleanup changes."
argument-hint: "Describe the race task: add, refactor, normalize, or explicit trait change"
---

# Races JSON Authoring

Create or refactor race entries in `public/data/races.json` and `public/data/races/*-features.json` files with strict schema conformance and minimal semantic drift.

## When To Use
- Add one or more races to the races file or detailed feature files.
- Add or refactor racial features and relation features.
- Refactor existing race entries for consistency, formatting, or RDF/JSON-LD representation.
- Normalize field completeness and value types to match runtime expectations.
- Perform cleanup without changing racial abilities or benefits.

## Do Not Use For
- Game-design rebalancing or mechanical reworking of traits unless explicitly requested.
- Broad rewriting of many races when intent changes are uncertain.

## Implicit Schema Contract
Every race object should include:
- `@id`: string (unique identifier)
- `rdfs:label`: string (race name)
- `sa:features`: array of feature objects (required, may be empty)

Each feature and relationFeature object must include:
- `rdfs:label`: string (feature name)
- `sa:description`: string or string array (detailed explanation, split into sentences)
- `sa:cost`: string (optional, e.g., "Ability Score Increase", "Feat")
- `sa:prerequisites`: string array (optional, prerequisites to use this feature)

Additional optional fields on race:
- `sa:relationFeatures`: array of feature objects (kinship or related-race traits)

## Workflow
1. **Locate races**:
   - Open `public/data/races.json` for overview or `public/data/races/{race}-features.json` for detailed traits.
   - Races are in the `@graph` array.

2. **Determine task type**:
   - `Refactor-only` (default): change representation, field order, formatting, only.
   - `Trait change` (opt-in): alter feature benefits, prerequisites, or costs only if user explicitly asks.

3. **Apply safe refactors**:
   - Keep JSON valid and structurally consistent.
   - Keep key names exactly as currently used by the app (e.g., `sa:description`, `sa:cost`, `sa:prerequisites`).
   - Normalize `sa:description` (support both string and string array; app normalizes either).
   - Normalize missing optional keys with type-safe defaults.
   - Preserve existing wording, punctuation, and capitalization unless fixing obvious typos requested by user.
   - Preserve `@id` unless user explicitly requests an identifier migration.

4. **Guard against semantic drift**:
   - Do not change feature benefits, costs, or prerequisites in refactor-only mode.
   - Do not reorder features without explicit approval.
   - If a formatting change could alter meaning, stop and ask for confirmation.

5. **Validate before finishing**:
   - Confirm file parses as JSON.
   - Confirm each race has `@id`, `rdfs:label`, and `sa:features` array.
   - Confirm each feature has `rdfs:label` and `sa:description`.
   - Confirm `sa:description` is either a string or string array, not mixed types within one array.
   - Confirm numeric `sa:cost` is consistent (should typically be string like "Feat" or ability modifier).

## Decision Rules
- If instruction is ambiguous between cleanup and trait redesign, treat it as cleanup and ask a clarifying question.
- If data is incomplete, fill required fields with type-safe placeholders, then flag the entry for follow-up.
- If duplicate or inconsistent IDs are found, report them and request migration approval before changing IDs.

## Output Expectations
- Provide the exact JSON edits made.
- Call out whether changes were `representation-only` or included `explicit trait changes`.
- List any fields still incomplete or malformed after refactor.
- Note any newly created feature arrays or relation features.

## Completion Checklist
- JSON remains valid.
- Touched races conform to implicit schema.
- Feature traits and benefits unchanged unless explicitly instructed.
- Changes are limited to requested scope.
