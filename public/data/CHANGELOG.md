# Changelog

All notable changes to the Stellar Arcana data repository are documented here.

## [2026-04-19]

### Added
- **Skills Identifier Expansion**: Introduced foundational skill collection structure alongside refined core mechanics.

### Changed
- **Arcech-Sylandris Population & Infrastructure**: Scaled from ~150,000 to ~850 million residents to reflect true megacity architecture. Updated descriptions to emphasize 8D vertical infrastructure, maglev rail networks, and altitude-based power hierarchy. Introduced Aether-Fog atmosphere concept creating visual/sensory division between Roots and spires.
- **Arcech-Sylandris Districts (5 locations)**: Enhanced sensory language for The Palace Quarter, The Commerce Ring, The Cultural Mile, The Common Markets, and The Twilight Districts. Descriptions now emphasize vertical oppression, material contrast (ancient enchanted stone vs. Armanitech alloys), and architectural vertigo.
- **Secondary Arcech Cities Population Scaling**: 
  - Starfall: ~100,000 → ~450 million (major interstellar port)
  - Ironhold: ~120,000 → ~380 million (industrial workforce)
  - Blackwater: ~85,000 → ~290 million (sprawling underworld)
  - Emerald Heights: ~60,000 → ~175 million (research-focused)
  - Skyhaven: ~50,000 → ~120 million (elite city)
- **Armor Equipment Data**: Refined and deduplicated armor definitions and specifications.
- **Spells Data**: Minor mechanical adjustments and clarifications to spell entries.
- **Spell Descriptions (5 Spells)**: Comprehensive mechanical clarifications and expanded rulings for Eldricht Blade, Eldricht Portal, Meat Receptacle, Thunder Blast, and Tools of the Blessed. Added missing casting times, ranges, durations, target specifications, and damage mechanics. Eldricht Portal downgraded from Ritual to Action casting time. Tools of the Blessed reduced to Bonus action for faster combat resolution.

- **Archetype Exclusivity Groups**: Added explicit `sa:exclusivityGroup` metadata to mutually exclusive features across Arcanist, Devotee, and Occultist archetypes. Clarifies that selecting one path/patron prevents selection of alternatives (e.g., Arcanist's path - Seer, Elementalist, Sage are mutually exclusive within arcanist-paths group).
- **Occultist Patron System Restructuring**: Refactored Occultist patron selection into discrete, mutually exclusive features (Patron - Elder Being, Patron - Chthonic, Patron - Eldritch God) with individual descriptions. Patron-dependent abilities (Protected, Empowered) now explicitly reference chosen patron prerequisites, improving mechanical clarity and preventing feature conflicts.
- **Spell Mechanical Clarifications (13 entries)**: Enhanced spell descriptions with precise mechanics, damage calculations, and action economy details:
  - **Chromatic Orb**: Clarified spellpoint scaling (damage increases by 1d8 per additional spellpoint).
  - **Counterspell**: Simplified resolution rules—automatic success with matching spellpoint spend, DC 10 + spell level check otherwise.
  - **Detect Magic**: Expanded passive detection mechanic to 30 feet with active aura perception option; clarified divination immunity interactions.
  - **Ethereal Blades**: Added cone geometry (15 ft), melee spell attack mechanics, and spellpoint damage scaling.
  - **Guiding Bolt**: Specified damage (3d6 radiant), attack roll requirement, and advantage-granting mechanism for next attack.
  - **Malediction**: Clarified 1d6 necrotic damage trigger (on hit with any attack, not just spells).
  - **Mind Sear**: Added saving throw mechanism (Wisdom DC), psychic damage (2d6), and frightened condition.
  - **Phantom Steed**: Specified conjuration rules (AC 13, 15 HP, 60 ft speed), capacity (1 Medium or 2 Small), action economy, and dismissal timing.
  - **Shield**: Clarified +5 AC bonus duration (1 round), magic missile interaction (blocks up to 5 missiles).
  - **Shutdown**: Added burst area (20 ft), saving throw mechanism (Intelligence DC), and device interaction rules; clarified magical device immunity.
  - **Thaumaturgy**: Expanded effect options (tremors, voice amplification, visual effects) with range and duration specifications.

### Fixed
- **Skills Cleanup**: Removed 19 outdated skill entries originally scraped from deprecated site version. Consolidated disparate skill references into canonical core skill set, improving data integrity and eliminating redundancy.

---

**Notes for players who like lore**:
- Population updates across Arcech cities establish consistent megacity scale (~2.265 billion total) aligned with planet description of "immense Hive cities" and vertical infrastructure.
- Arcech-Sylandris descriptions now form a cohesive narrative emphasizing 8D verticality, Aether-Fog atmosphere, material juxtaposition (ancient/modern), and oppressive beauty—all reinforcing the "Grit-meets-Grandeur" aesthetic.
- Skills consolidation resolves historical data quality issues; no mechanical impact on character creation.
