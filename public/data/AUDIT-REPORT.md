# Stellar Arcana Public Data — Audit Report
**Date:** 2026-06-08

## Overview

109 JSON files, 1 TTL file, 1 changelog. All JSON parses cleanly — no syntax errors. The data uses JSON-LD with the `sa:` namespace (`https://stellararcana.org/`).

### Content Breakdown
| Category | Files | Notes |
|---|---|---|
| Archetypes | 16 + index | All 16 archetypes fully populated |
| Races | 9 + index | 9 race feature files |
| Equipment | 6 | armor, curios, mechs, melee, ranged, WondrousItems |
| Spells | 2 | spells.json + spells.scraped.json (identical content, 101 spells) |
| Skills | 1 | 52 skill entries |
| Rules/Basics | 4 | rules, basics, actions, character-creation |
| General Features | 1 | 29 entries |
| Setting: Characters | 10 | All standalone, all orphaned |
| Setting: Organizations | 12 orgs, 32 files total | Variable member coverage |
| Setting: Planets | 2 (Arcech, Arrur) + 1 TTL (Example-Prime) | 15 place files |
| Resource Index | 1 | 199 resources, 131 unique IDs |

---

## Issues Found

### 1. TWO INCOMPATIBLE FILE FORMATS (Critical)

The dataset is split between two structural conventions with no clear boundary:

- **57 files** use JSON-LD `@graph` style (archetypes, races, equipment, spells, skills, standalone characters, Exodian Church/Velvet Mask members)
- **52 files** use a flat object style with bare `type`, `label`, `description` keys (all orgs, org members, planets, places, resource-index)

These aren't interchangeable. A consumer expecting `@graph` arrays will fail on the flat files, and vice versa. The flat files also lack `@id` on the root object in many cases.

**Action:** Pick one convention and migrate. The `@graph` style is more standard JSON-LD.

### 2. BROKEN sa: TYPE REFERENCES (Critical)

1,337 references use `sa:` prefixed values as `@type` (e.g. `"@type": "sa:Feature"`, `"@type": "sa:Organization"`). Because the files define `"sa": "https://stellararcana.org/"` in `@context`, these resolve to full URIs like `https://stellararcana.org/Feature` — but none of these types are *defined* anywhere as actual RDF classes. They work as convention but would fail any schema validation.

This is fine if you treat sa: types as informal tags. It becomes a problem if you ever want to validate or reason over the data.

### 3. INCONSISTENT PROPERTY NAMING (High)

Five properties appear both with and without the `sa:` prefix across different files: `description`, `prerequisites`, `origin`, `societalImpact`, `Spells`. Because `@vocab` is set to `sa:`, bare `description` and `sa:description` resolve to the same URI — but `description` also sometimes maps to `schema:description` in files that define it in `@context`. This creates ambiguity.

Additionally, 175 properties use the explicit `sa:` prefix while 706 use bare names. The split is file-format-correlated: `@graph`-style files tend to use `sa:` prefixes, flat files use bare names.

### 4. TEN ORPHANED STANDALONE CHARACTERS (Medium)

All 10 characters in `Setting/Characters/` are not referenced by any organization or planet file:

Alrik Blackvein, Brine-Veil Skaar, Veldros Kane (cult-antagonist), Hex Venn, Kaelos, The Lattice Witch, Maw-Captain Zhorr, Reef-Harrower Oth, Silas Venn, Silt-Chorister Vryx

These exist in isolation. They use `@graph` + `schema:Person` typing, while org member files use the flat format — further evidence of the two-format split.

### 5. ORGANIZATIONS WITH NO MEMBER FILES (Medium)

Three orgs have rank/role definitions but zero named member files:
- **Everliving-Faith** — also has an empty `@graph` in its file (0 nodes), making it effectively a skeleton
- **Luminous-Synthesis** — org definition only
- **Verdant-Collective** — org definition only

### 6. DUPLICATE SPELLS FILE (Low)

`spells.json` and `spells.scraped.json` contain the same single spell collection with 101 spells. The `.scraped` variant adds a `dcterms` namespace in context but is otherwise identical. One should be removed or the scraped version should be clearly marked as a source/staging file.

### 7. EXAMPLE-PRIME: ORPHANED TTL, WRONG FORMAT (Low)

`Setting/Planets/Example-Prime/example-prime.ttl` is the only Turtle file in the dataset. It has no JSON-LD counterpart and isn't referenced by the resource index. It also contains a truncated property name (`sa:containedInLocatio` — missing the final `n`). If this is a test file, it should be in a separate directory; if it's meant to be part of the dataset, convert it to JSON-LD.

### 8. @CONTEXT FRAGMENTATION (Low)

17 distinct `@context` variations across 109 files. Some define `xsd`, some don't. Some map `description` to `schema:description`, others don't. Arcech's planet file has a unique context with `CreativeWork`, `Person`, `author`, `about` — different from Arrur's nearly-identical planet file. This makes bulk processing brittle.

### 9. WondrousItems.json NAMING (Trivial)

The only PascalCase filename; all others use kebab-case. Should be `wondrous-items.json`.

---

## Action List

| # | Priority | Action | Scope |
|---|---|---|---|
| 1 | Critical | **Unify file format** — migrate all flat-style files to `@graph` JSON-LD, or vice versa | 52 files |
| 2 | Critical | **Standardize property naming** — pick `sa:` prefix or bare names (not both) and apply consistently | All files |
| 3 | High | **Normalize @context** — create a shared context definition and reference it from all files | All files |
| 4 | High | **Link standalone characters** — connect the 10 orphaned characters to orgs, planets, or factions | 10 character files + org files |
| 5 | Medium | **Populate skeleton orgs** — add member NPCs to Everliving-Faith, Luminous-Synthesis, Verdant-Collective | 3 org dirs |
| 6 | Medium | **Fix Everliving-Faith** — file has empty @graph; needs actual org data | 1 file |
| 7 | Low | **Remove or differentiate spells.scraped.json** | 1 file |
| 8 | Low | **Convert or remove example-prime.ttl** — fix the truncated property name if keeping | 1 file |
| 9 | Low | **Rename WondrousItems.json** to `wondrous-items.json` | 1 file + references |
| 10 | Low | **Reconcile Exodian Church & Velvet Mask member files** — these members use `@graph` style while their parent org files use flat style | 7 files |
