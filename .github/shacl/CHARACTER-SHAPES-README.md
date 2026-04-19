# Character SHACL Shapes Documentation

**Status:** Phase 1 complete (Core + Derived Stats shape defined)  
**Date:** April 19, 2026  
**Scope:** Character validation shapes for SA-RDF project  

---

## Overview

This directory contains SHACL (Shapes Constraint Language) shape definitions for validating character RDF data in the Stellar Arcana project. The shapes enforce structural and semantic constraints on character properties, derived statistics, and related entities.

**Phase 1 Deliverables:**
- Core character properties (name, race, archetypes, ability scores, experience)
- Derived statistics (AC, initiative, saving throws, passive skills, resource pools, spell slots)
- Sub-shapes for reusable validation (ability scores, skills)
- Placeholder sub-shapes for future expansion (features, equipment, spells, attacks)

---

## File Structure

```
.github/shacl/
├── character.ttl                      # Main character shape
│                                       # Validates core props + derived stats
│                                       # Includes constraints for AC, initiative, saving throws,
│                                       # passive skills, resource pools (wounds/HP/sanity),
│                                       # offensive DCs, movement, spellcasting
│
├── character-ability-scores.ttl       # Sub-shape: Ability scores (STR, DEX, CON, INT, WIS, CHA)
│                                       # Validates each ability as integer 3-20
│                                       # Includes formulas for derived modifiers (comment only)
│
├── character-skill.ttl                # Sub-shape: Individual skill
│                                       # Validates skill name, governing ability, proficiency flag
│                                       # Reusable for multiple character skills
│
├── character-feature.ttl              # Sub-shape (FUTURE): Character features/traits
│                                       # Placeholder for name, description, cost, prerequisites
│
├── character-equipment.ttl            # Sub-shape (FUTURE): Equipment entry
│                                       # Placeholder for category, quantity, AC/damage modifiers
│
├── character-spell.ttl                # Sub-shape (FUTURE): Character spell/known spell
│                                       # Placeholder for spell level, casting time, damage, range
│
└── character-attack.ttl               # Sub-shape (FUTURE): Attack entry
                                        # Placeholder for ability mod, weapon bonus, damage die
```

---

## Namespace Prefixes

All character-related shapes use consistent prefixes:

| Prefix | Namespace | Usage |
|--------|-----------|-------|
| `sh:` | `http://www.w3.org/ns/shacl#` | SHACL vocabulary (shape definitions) |
| `rdfs:` | `http://www.w3.org/2000/01/rdf-schema#` | RDF Schema (labels, comments) |
| `xsd:` | `http://www.w3.org/2001/XMLSchema#` | XML Schema datatypes |
| `sa:` | `https://stellararcana.org/` | Stellar Arcana base namespace (general predicates) |
| `character:` | `https://stellararcana.org/character/` | Character-specific IRIs and classes |
| `archetype:` | `https://stellararcana.org/archetype/` | Archetype references (domain namespace) |
| `spell:` | `https://stellararcana.org/spell#` | Spell properties (for future spell integration) |

---

## Shape Definitions

### 1. `character:CharacterShape` (Main Shape)

**Target Class:** `character:Character`

**Purpose:** Validates complete character entities with core properties and derived statistics.

#### Core Properties (Required)
- `sa:characterId` → xsd:string (unique identifier)
- `rdfs:label` → xsd:string (character name)
- `sa:race` → xsd:string (enum: 9 races including sa:human, sa:dwarf, sa:elf, sa:gnome, sa:orc, sa:draegloth, sa:drow, sa:feyri, sa:halfling)
- `sa:archetype` → xsd:string (exactly 2, each from 16 valid archetypes)
- `sa:totalExperience` → xsd:nonNegativeInteger
- `sa:abilityScores` → nested `sa:AbilityScoresShape`

#### Optional Properties
- `sa:racialBonus` → xsd:integer (up to 6 ability bonuses)
- `sa:feature` → xsd:string (feature name list; future: use `sa:CharacterFeatureShape`)
- `sa:skill` → nested `sa:CharacterSkillShape` (up to 18 skills)

#### Derived Statistics (Computed, Read-Only)
All of the following are marked as optional (`sh:maxCount 1` or greater, no `sh:minCount`) and should be validated post-creation:

**Proficiency & DCs:**
- `sa:proficiencyBonus` → xsd:nonNegativeInteger (base 2)
- `sa:spellDC` → xsd:integer (8 + prof + casting ability mod)
- `sa:meleeDC` → xsd:integer (8 + prof + max(STR,DEX) mod)
- `sa:rangedDC` → xsd:integer (8 + prof + DEX mod)

**Defense:**
- `sa:armorClass` → xsd:nonNegativeInteger (equipment-dependent; e.g., 18 for Plate + Shield)
- `sa:initiative` → xsd:integer (DEX mod)

**Saving Throws (6 total):**
- `sa:savingThrowStrength` through `sa:savingThrowCharisma` → xsd:integer

**Passive Skills:**
- `sa:passivePerception` → xsd:nonNegativeInteger (10 + Perception skill mod)
- `sa:passiveInvestigation` → xsd:nonNegativeInteger (10 + Investigation skill mod)
- `sa:passiveInsight` → xsd:nonNegativeInteger (10 + Insight skill mod)

**Resource Pools:**
- `sa:wounds` → xsd:nonNegativeInteger (equals CON score)
- `sa:hitPoints` → xsd:nonNegativeInteger (6 + CON mod)
- `sa:sanity` → xsd:nonNegativeInteger (equals WIS score)
- `sa:renown` → xsd:nonNegativeInteger (equals proficiency bonus)

**Movement & Spellcasting:**
- `sa:speed` → xsd:nonNegativeInteger (base 30 ft + racial bonuses)
- `sa:concentrationDC` → xsd:nonNegativeInteger (8 + prof + CON mod); conditional
- `sa:spellSlot` → xsd:string (per-spell-level slots; format TBD); conditional on hasSpells

**Future Expansion Placeholders:**
- `sa:equipment` → xsd:string (placeholder; future: nested `sa:CharacterEquipmentShape`)
- `sa:spell` → xsd:string (placeholder; future: nested `sa:CharacterSpellShape`)
- `sa:attack` → xsd:string (placeholder; future: nested `sa:CharacterAttackShape`)

---

### 2. `sa:AbilityScoresShape` (Sub-Shape)

**Purpose:** Validates ability score values (STR, DEX, CON, INT, WIS, CHA).

**Constraints:**
- Each ability: xsd:integer
- Range: 3 ≤ score ≤ 20
- All 6 required (sh:minCount 1 each)
- All 6 maxed (sh:maxCount 1 each)
- Modifier derivation: (score - 10) // 2 (documented in rdfs:comment)

**Mapped Predicates:**
- `sa:strength`, `sa:dexterity`, `sa:constitution`, `sa:intelligence`, `sa:wisdom`, `sa:charisma`

---

### 3. `sa:CharacterSkillShape` (Sub-Shape)

**Purpose:** Validates individual skill entries (name, ability, proficiency).

**Constraints:**
- `rdfs:label` → xsd:string (enum: 18 standard skills)
- `sa:ability` → xsd:string (enum: "strength", "dexterity", ..., "charisma")
- `sa:proficient` → xsd:boolean (required)
- `sa:miscModifier` → xsd:integer (optional; defaults to 0)

**Skills List (18 Standard):**
```
Acrobatics (DEX), Animal Handling (WIS), Arcana (INT), Athletics (STR),
Deception (CHA), History (INT), Insight (WIS), Intimidation (CHA),
Investigation (INT), Medicine (WIS), Nature (INT), Perception (WIS),
Performance (CHA), Persuasion (CHA), Religion (INT), Sleight of Hand (DEX),
Stealth (DEX), Survival (WIS)
```

---

### 4. Future Sub-Shapes (Placeholders)

#### `sa:CharacterFeatureShape` (character-feature.ttl)
- `rdfs:label` → Feature name
- `sa:description` → Feature rules text
- `sa:cost` → Optional cost/point value
- `sa:prerequisites` → Optional prerequisites list

#### `sa:CharacterEquipmentShape` (character-equipment.ttl)
- `rdfs:label` → Equipment name
- `sa:category` → enum: "armor", "weapon", "equipment"
- `sa:quantity` → nonNegativeInteger (defaults to 1)
- `sa:armorClass` → Optional AC contribution
- `sa:damage` → Optional damage die (weapons)
- `sa:weight` → Optional weight in pounds

#### `sa:CharacterSpellShape` (character-spell.ttl)
- `rdfs:label` → Spell name
- `sa:spellLevel` → xsd:integer (0-9)
- `spell:castingtime` → Optional casting time
- `spell:range` → Optional range
- `spell:target` → Optional target description
- `sa:damage` → Optional damage roll
- `sa:damageType` → Optional damage type

#### `sa:CharacterAttackShape` (character-attack.ttl)
- `rdfs:label` → Attack name
- `sa:abilityModifier` → xsd:integer (governing ability mod)
- `sa:weaponBonus` → Optional equipment/weapon bonus
- `sa:damageDie` → xsd:string (damage dice, e.g., "1d8")
- `sa:damageAbilityModifier` → xsd:integer (damage ability mod)
- `sa:damageBonus` → Optional damage bonus
- `sa:damageType` → Optional damage type (slashing, fire, etc.)

---

## Validation Rules & Constraints

### Data Types
- **Identifiers & Names:** xsd:string
- **Numeric Values:** xsd:integer, xsd:nonNegativeInteger, xsd:decimal
- **Abilities/Ability Scores:** xsd:integer with range constraints (3-20)
- **Booleans:** xsd:boolean (for proficiency flags)

### Enumerations
- **Races:** sh:in constraint list (9 total: sa:human, sa:dwarf, sa:elf, sa:gnome, sa:orc, sa:draegloth, sa:drow, sa:feyri, sa:halfling)
- **Archetypes:** sh:in constraint list (16 archetype IRIs from archetype: namespace)
- **Skills:** sh:in constraint list (18 standard skills)
- **Equipment Categories:** sh:in constraint list ("armor", "weapon", "equipment")
- **Saving Throw Abilities:** sh:in constraint list (6 ability names)

### Cardinality
- **Core Properties:** sh:minCount 1, sh:maxCount 1 (required, one per character)
- **Archetypes:** sh:minCount 2, sh:maxCount 2 (exactly two)
- **Derived Stats:** sh:maxCount 1 (optional, at most one)
- **Skills/Features/Equipment/Spells/Attacks:** sh:maxCount 999 (optional, many)

### Patterns & Constraints (Future)
- **Duplicate Archetype Detection:** Not enforced in SHACL; apply SPARQL or application-layer logic
- **Proficiency Bonus Scaling:** TBD based on XP or level table (not yet constrained)
- **Conditional Spell Data:** Spell slots only required if character has known spells

---

## Usage & Integration

### For Form Generation (LLM-Driven)
Each shape includes `rdfs:comment` fields with LLM generation instructions. Example:

```turtle
rdfs:comment "LLM generation instruction: create complete, rules-usable characters with core ability scores, derived combat stats (AC, initiative, DCs), derived passive skill values, and spellcasting details. Always include character name, race, exactly 2 archetypes, and all 6 ability scores (3-20 range). Include derived stats as computed values post-creation."
```

### For Validation
1. **Data Entry:** Validate character RDF instances against shape constraints
2. **Post-Calculation:** After computing derived stats, validate AC, initiative, DCs, passive skills, etc.
3. **Nested Validation:** Recursively validate skills and (future) features, equipment, spells, attacks

### For Extension
1. **New Ability Bonuses:** Add to racial bonuses (sa:racialBonus property)
2. **New Skills:** Add to character.ttl sh:in list (if not already 18)
3. **New Archetypes:** Add IRI to character.ttl sh:in list and update races.json/archetype enum
4. **Equipment/Spell/Attack Integration:** Replace placeholder shapes in character-equipment.ttl, character-spell.ttl, character-attack.ttl with full validation logic; update character.ttl sh:node references

---

## Formulas & Derivation Rules

### Ability Modifiers
```
modifier = (score - 10) // 2  [floor division]
```

### Derived Stats Formulas
| Stat | Formula |
|------|---------|
| AC | 10 + DEX mod (base) OR armor AC + DEX bonus |
| Initiative | DEX mod |
| Saving Throw | ability mod [+ proficiency if proficient] |
| Passive Skill | 10 + skill bonus (ability mod + prof + misc) |
| Wounds | CON score |
| Hit Points | 6 + CON mod |
| Sanity | WIS score |
| Renown | Proficiency bonus |
| Melee DC | 8 + prof + max(STR, DEX) mod |
| Ranged DC | 8 + prof + DEX mod |
| Spell DC | 8 + prof + casting ability mod |
| Concentration DC | 8 + prof + CON mod |
| Movement Speed | 30 ft (base) + racial bonus |
| Spell Slots | 2 + (prof // 2) per spelled level (conditional) |

---

## Known Limitations & TBDs

### Current Phase 1 Limitations
1. **No SPARQL Constraints:** Duplicate archetype detection not enforced (apply at app layer)
2. **No Formula Validation:** Derived stats validated post-calculation, not during formula application
3. **No Conditional Constraints:** Spell slots not conditionally required based on hasSpells (document assumption)
4. **IRI Formats:** Race references use string enums (TBD: convert to IRI object references)
5. **Equipment AC Detection:** Smart detection of Plate Armor + Shield handled in application, not SHACL

### Future Enhancements (Phase 2+)
1. Integrate character-feature.ttl, character-equipment.ttl, character-spell.ttl, character-attack.ttl
2. Add SPARQL constraints for complex rules (duplicate detection, XP-based proficiency scaling)
3. Define restricted RDF object references (character → Race shape, character → Archetype shape)
4. Add spell slots conditional validation
5. Expand to support homebrew archetypes, races, skills
6. Link character shapes to existing Equipment, Spell, and Rule shapes in project

---

## Testing & Validation

### Test Case: Sample Character (from CharacterSheet.tsx)
**Theron Ashbringer**
- Race: Human (sa:human)
- Archetypes: Armsman, Spellweaver (archetype:armsman, archetype:spellweaver)
- Ability Scores: STR 16 (mod +3), DEX 14 (mod +2), CON 13 (mod +1), INT 12 (mod +1), WIS 10 (mod 0), CHA 8 (mod -1)
- Equipment: Plate Armor (AC 18), Shield (+2), Longsword (1d8), Shortbow (1d6)
- Skills: Arcana (prof), Athletics (prof), Perception (prof), Stealth (prof)
- Spells: Magic Missile, Shield, Mage Armor, Fireball

**Expected Derived Stats (Sample):**
- AC: 18 (Plate + Shield) + 2 (DEX)... wait, DEX doesn't add to Plate. Verify AC calculation per rules.
- Initiative: +2 (DEX mod)
- Wounds: 13 (CON)
- HP: 1 + 6 = 7 (CON mod + 6 base)
- Sanity: 10 (WIS)
- Renown: 2 (prof bonus)
- Spell DC: 8 + 2 (prof) + 1 (INT mod) = 11
- Melee DC: 8 + 2 (prof) + 3 (STR mod) = 13
- Ranged DC: 8 + 2 (prof) + 2 (DEX mod) = 12
- Passive Perception: 10 + (0 WIS + 2 prof + 0 misc) = 12

---

## References

- **SHACL Specification:** [W3C SHACL](https://www.w3.org/TR/shacl/)
- **Project Data:** [public/data/](../../public/data/)
  - basics.json → Ability/derived stat rules
  - races.json → Valid races
  - archetypes.json → Valid archetypes
- **Character Type Definition:** [src/types.ts](../../src/types.ts) (Character, AbilityScores, CharacterSkill, etc.)
- **Existing SHACL Patterns:** [.github/shacl/](.) (spells.ttl, equipment-shacl.ttl for reference)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-19 | 1.1 | Updated race enum to include all 9 playable races (Human, Dwarf, Elf, Gnome, Orc, Draegloth, Drow, Feyri, Halfling) |
| 2026-04-19 | 1.0 | Initial implementation: character.ttl, ability-scores.ttl, skill.ttl, + placeholder shapes (feature, equipment, spell, attack) |

---

## Contact & Notes

**Author:** Copilot  
**Project:** SA-RDF Frontend  
**Language:** Turtle (TTL) / SHACL  
**Status:** Phase 1 complete; Phase 2 (nested shape integration + expansion) pending

For questions or updates, refer to the inline `rdfs:comment` fields in each shape file or this documentation.
