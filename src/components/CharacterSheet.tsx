import React, { useEffect, useState } from 'react';
import { Character, AbilityScores, CharacterSkill, CharacterEquipment, CharacterSpell, CharacterAttack } from '../types';
import { fetchRaces, fetchArchetypes, fetchEquipment } from '../data';
import { getProgressionFromXP } from '../utils/progression';
import { calculateEquipmentAC } from '../utils/equipment';
import './CharacterSheet.css';

// Ability modifier calculation: (score - 10) / 2, rounded down
const calculateModifier = (score: number): number => Math.floor((score - 10) / 2);

// Sample character data for initial iteration
const sampleCharacter: Character = {
  id: 'sample-1',
  name: 'Theron Ashbringer',
  race: 'Human',
  archetypes: ['Armsman', 'Spellweaver'],
  totalExperience: 0,
  abilityScores: {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  },
  racialBonuses: {
    strength: 1,
  },
  features: [
    { name: 'Second Wind', description: 'Regain 1d10 + Constitution modifier HP once per rest' },
    { name: 'Fighting Style: Duelist', description: '+2 to damage rolls when wielding a melee weapon' },
  ],
  skills: [
    { name: 'Acrobatics', ability: 'dexterity', proficient: false },
    { name: 'Animal Handling', ability: 'wisdom', proficient: false },
    { name: 'Arcana', ability: 'intelligence', proficient: true },
    { name: 'Athletics', ability: 'strength', proficient: true },
    { name: 'Deception', ability: 'charisma', proficient: false },
    { name: 'History', ability: 'intelligence', proficient: false },
    { name: 'Insight', ability: 'wisdom', proficient: false },
    { name: 'Intimidation', ability: 'charisma', proficient: false },
    { name: 'Investigation', ability: 'intelligence', proficient: false },
    { name: 'Medicine', ability: 'wisdom', proficient: false },
    { name: 'Nature', ability: 'intelligence', proficient: false },
    { name: 'Perception', ability: 'wisdom', proficient: true },
    { name: 'Performance', ability: 'charisma', proficient: false },
    { name: 'Persuasion', ability: 'charisma', proficient: false },
    { name: 'Religion', ability: 'intelligence', proficient: false },
    { name: 'Sleight of Hand', ability: 'dexterity', proficient: false },
    { name: 'Stealth', ability: 'dexterity', proficient: true },
    { name: 'Survival', ability: 'wisdom', proficient: false },
  ],
  equipment: [
    { name: 'Longsword', category: 'weapon', quantity: 1 },
    { name: 'Shortbow', category: 'weapon', quantity: 1 },
    { name: 'Plate Armor', category: 'armor', quantity: 1 },
    { name: 'Shield', category: 'armor', quantity: 1 },
    { name: 'Bedroll', category: 'equipment', quantity: 1 },
    { name: 'Rope (50ft)', category: 'equipment', quantity: 1 },
    { name: 'Healing Potion', category: 'equipment', quantity: 3 },
  ],
  spells: [
    { name: 'Magic Missile', level: 1 },
    { name: 'Shield', level: 1 },
    { name: 'Mage Armor', level: 1 },
    { name: 'Fireball', level: 3 },
  ],
  attacks: [
    { name: 'Longsword', abilityModifier: 3, weaponBonus: 1, damageDie: '1d8', damageAbilityModifier: 4, damageBonuses: 0 },
    { name: 'Shortbow', abilityModifier: 2, weaponBonus: 0, damageDie: '1d6', damageAbilityModifier: 2, damageBonuses: 0 },
  ],
};

interface AbilityScoreRowProps {
  label: string;
  score: number;
  modifier: number;
  dc: number;
}

const AbilityScoreRow: React.FC<AbilityScoreRowProps> = ({ label, score, modifier, dc }) => (
  <div className="ability-row">
    <div className="ability-label">{label}</div>
    <div className="ability-score">{score}</div>
    <div className="ability-modifier">{modifier > 0 ? '+' : ''}{modifier}</div>
    <div className="ability-dc">DC {dc}</div>
  </div>
);

interface SkillRowProps {
  skill: CharacterSkill;
  modifier: number;
  proficiencyBonus: number;
}

const SkillRow: React.FC<SkillRowProps> = ({ skill, modifier, proficiencyBonus }) => {
  const profBonus = skill.proficient ? proficiencyBonus : 0;
  const miscBonus = skill.miscModifier || 0;
  const total = modifier + profBonus + miscBonus;
  
  return (
    <div className="skill-row">
      <div className="skill-name">{skill.name}</div>
      <div className="skill-total">{total > 0 ? '+' : ''}{total}</div>
      <div className="skill-ability">{modifier > 0 ? '+' : ''}{modifier}</div>
      <div className="skill-prof">{profBonus > 0 ? '+' : ''}{profBonus}</div>
    </div>
  );
};

interface AttackRowProps {
  attack: CharacterAttack;
  proficiencyBonus: number;
}

const AttackRow: React.FC<AttackRowProps> = ({ attack, proficiencyBonus }) => {
  const weaponBonus = attack.weaponBonus || 0;
  const total = attack.abilityModifier + proficiencyBonus + weaponBonus;
  const damageBonuses = attack.damageBonuses || 0;
  const damageTotal = attack.damageAbilityModifier + damageBonuses;
  
  return (
    <div className="attack-row">
      <div className="attack-name">{attack.name}</div>
      <div className="attack-total">{total > 0 ? '+' : ''}{total}</div>
      <div className="attack-ability">{attack.abilityModifier > 0 ? '+' : ''}{attack.abilityModifier}</div>
      <div className="attack-prof">{proficiencyBonus > 0 ? '+' : ''}{proficiencyBonus}</div>
      <div className="attack-bonus">{weaponBonus > 0 ? '+' : ''}{weaponBonus}</div>
      <div className="damage-die">{attack.damageDie}</div>
      <div className="damage-ability">{attack.damageAbilityModifier > 0 ? '+' : ''}{attack.damageAbilityModifier}</div>
      <div className="damage-bonus">{damageBonuses > 0 ? '+' : ''}{damageBonuses}</div>
      <div className="damage-total">{attack.damageDie}{damageTotal > 0 ? '+' : ''}{damageTotal > 0 ? damageTotal : ''}</div>
    </div>
  );
};

interface SavingThrowRowProps {
  ability: string;
  abilityKey: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  modifier: number;
  proficiencyBonus: number;
  proficient?: boolean;
}

const SavingThrowRow: React.FC<SavingThrowRowProps> = ({ ability, modifier, proficiencyBonus, proficient = false }) => {
  const profBonus = proficient ? proficiencyBonus : 0;
  const total = modifier + profBonus;
  
  return (
    <div className="saving-throw-row">
      <div className="save-ability">{ability}</div>
      <div className="save-total">{total > 0 ? '+' : ''}{total}</div>
      <div className="save-prof">{profBonus > 0 ? 'P' : ''}</div>
    </div>
  );
};

interface PassiveSkillRowProps {
  name: string;
  value: number;
}

const PassiveSkillRow: React.FC<PassiveSkillRowProps> = ({ name, value }) => (
  <div className="passive-row">
    <div className="passive-name">{name}</div>
    <div className="passive-value">{value}</div>
  </div>
);

export const CharacterSheet: React.FC<{ character?: Character; onChange?: (character: Character) => void }> = ({ character: propCharacter, onChange }) => {
  // State
  const [editMode, setEditMode] = useState(false);
  const [totalXP, setTotalXP] = useState(propCharacter?.totalExperience ?? 0);
  const [raceLabel, setRaceLabel] = useState(propCharacter?.race ?? '');
  const [archetypeLabels, setArchetypeLabels] = useState<string[]>(propCharacter?.archetypes ?? []);
  const [equipmentData, setEquipmentData] = useState<any[]>([]);
  
  const character = { ...(propCharacter ?? sampleCharacter), totalExperience: totalXP };

  // Notify parent of changes when XP updates
  useEffect(() => {
    if (onChange && totalXP !== propCharacter?.totalExperience) {
      onChange(character);
    }
  }, [totalXP, onChange, character, propCharacter?.totalExperience]);

  // Fetch and update race/archetype labels
  useEffect(() => {
    Promise.all([fetchRaces(), fetchArchetypes(), fetchEquipment()]).then(([races, archetypes, equipment]) => {
      const race = races.find(r => r.id === character.race);
      if (race) setRaceLabel(race.label);

      const labels = character.archetypes.map(id => {
        const found = archetypes.find(a => a.id === id);
        return found ? found.label : id;
      });
      setArchetypeLabels(labels);
      setEquipmentData(equipment);
    });
  }, [character.race, character.archetypes]);

  // Apply racial bonuses to ability scores
  const finalScores: AbilityScores = {
    strength: character.abilityScores.strength + (character.racialBonuses?.strength || 0),
    dexterity: character.abilityScores.dexterity + (character.racialBonuses?.dexterity || 0),
    constitution: character.abilityScores.constitution + (character.racialBonuses?.constitution || 0),
    intelligence: character.abilityScores.intelligence + (character.racialBonuses?.intelligence || 0),
    wisdom: character.abilityScores.wisdom + (character.racialBonuses?.wisdom || 0),
    charisma: character.abilityScores.charisma + (character.racialBonuses?.charisma || 0),
  };

  // Calculate modifiers
  const modifiers = {
    strength: calculateModifier(finalScores.strength),
    dexterity: calculateModifier(finalScores.dexterity),
    constitution: calculateModifier(finalScores.constitution),
    intelligence: calculateModifier(finalScores.intelligence),
    wisdom: calculateModifier(finalScores.wisdom),
    charisma: calculateModifier(finalScores.charisma),
  };

  // Get progression data from XP - use totalXP state directly 
  const progression = getProgressionFromXP(totalXP);
  const proficiencyBonus = progression.proficiencyBonus;
  const hitDice = progression.hitDice;

  // Calculate DCs
  const meleedc = 8 + proficiencyBonus + Math.max(modifiers.strength, modifiers.dexterity);
  const rangeddc = 8 + proficiencyBonus + modifiers.dexterity;
  const spelldc = 8 + proficiencyBonus + modifiers.intelligence; // Default to INT for casting ability

  // Calculate resources
  const wounds = finalScores.constitution;
  // HP: First HD = 6 + CON mod, each additional HD = 3.5 average + CON mod
  const hitPoints = Math.floor(6 + (hitDice - 1) * 3.5 + hitDice * modifiers.constitution);
  const sanity = finalScores.wisdom;
  const renown = proficiencyBonus;

  // New derived stats
  // 1. Armor Class (AC) - calculate from equipment
  const equipmentAC = character.equipment && equipmentData.length > 0 
    ? calculateEquipmentAC(character.equipment, equipmentData)
    : { ac: 10, maxDexterity: undefined };
  
  const maxDexBonus = equipmentAC.maxDexterity ? Math.min(modifiers.dexterity, equipmentAC.maxDexterity as number) : modifiers.dexterity;
  const armorAC = equipmentAC.ac + maxDexBonus;

  // 2. Saving Throws (no proficiency by default, can be added to character data)
  const savingThrows = {
    strength: modifiers.strength,
    dexterity: modifiers.dexterity,
    constitution: modifiers.constitution,
    intelligence: modifiers.intelligence,
    wisdom: modifiers.wisdom,
    charisma: modifiers.charisma,
  };

  // 3. Initiative
  const initiative = modifiers.dexterity;

  // 4. Passive Skills (10 + modifier)
  const getSkillModifier = (skillName: string): number => {
    const skill = character.skills?.find(s => s.name === skillName);
    if (!skill) return 0;
    const abilityMod = modifiers[skill.ability];
    const profBonus = skill.proficient ? proficiencyBonus : 0;
    const miscBonus = skill.miscModifier || 0;
    return abilityMod + profBonus + miscBonus;
  };

  const passivePerception = 10 + getSkillModifier('Perception');
  const passiveInvestigation = 10 + getSkillModifier('Investigation');
  const passiveInsight = 10 + getSkillModifier('Insight');

  // 5. Speed (base 30 feet + racial bonuses)
  const baseSpeed = 30;
  const speed = baseSpeed; // Can add racial speed bonuses here

  // 6. Spell Slots (basic calculation based on highest spell level)
  const hasSpells = character.spells && character.spells.length > 0;
  const highestSpellLevel = hasSpells 
    ? Math.max(...character.spells.map(s => s.level || 0))
    : 0;

  // Spell slots per level (simplified: 2 per spell level known)
  const spellSlots: Record<number, number> = {};
  if (hasSpells) {
    for (let level = 1; level <= highestSpellLevel; level++) {
      spellSlots[level] = 2 + Math.floor(proficiencyBonus / 2);
    }
  }

  // 7. Concentration DC (8 + proficiency + constitution modifier)
  const concentrationDC = 8 + proficiencyBonus + modifiers.constitution;

  return (
    <div className="character-sheet">
      <div className="sheet-header">
        <div className="header-title">
          <h1>{character.name}</h1>
          <button 
            className="edit-button"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="character-info">
          <div className="info-item">
            <span className="label">Race:</span>
            <span className="value">{raceLabel}</span>
          </div>
          <div className="info-item">
            <span className="label">Archetypes:</span>
            <span className="value">{archetypeLabels.join(' / ')}</span>
          </div>
          <div className="info-item info-xp">
            <span className="label">Experience:</span>
            <input
              type="number"
              className="xp-input"
              value={totalXP}
              onChange={(e) => {
                const newXP = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                setTotalXP(newXP);
              }}
              title="Click to edit XP. Stats update automatically."
            />
          </div>
        </div>
      </div>

      <div className="sheet-content">
        {/* Ability Scores Section */}
        <section className="ability-scores-section">
          <h2>Ability Scores</h2>
          <div className="ability-scores">
            <div className="ability-header">
              <div className="ability-label">Score</div>
              <div className="ability-score">Score</div>
              <div className="ability-modifier">Mod</div>
              <div className="ability-dc">DC</div>
            </div>
            <AbilityScoreRow 
              label="Strength" 
              score={finalScores.strength} 
              modifier={modifiers.strength}
              dc={meleedc}
            />
            <AbilityScoreRow 
              label="Dexterity" 
              score={finalScores.dexterity} 
              modifier={modifiers.dexterity}
              dc={rangeddc}
            />
            <AbilityScoreRow 
              label="Constitution" 
              score={finalScores.constitution} 
              modifier={modifiers.constitution}
              dc={8 + proficiencyBonus + modifiers.constitution}
            />
            <AbilityScoreRow 
              label="Intelligence" 
              score={finalScores.intelligence} 
              modifier={modifiers.intelligence}
              dc={spelldc}
            />
            <AbilityScoreRow 
              label="Wisdom" 
              score={finalScores.wisdom} 
              modifier={modifiers.wisdom}
              dc={8 + proficiencyBonus + modifiers.wisdom}
            />
            <AbilityScoreRow 
              label="Charisma" 
              score={finalScores.charisma} 
              modifier={modifiers.charisma}
              dc={8 + proficiencyBonus + modifiers.charisma}
            />
          </div>
        </section>

        <div className="sheet-columns">
          {/* Static Values Section */}
          <section className="static-section">
            <h2>Static Values</h2>
            <div className="static-grid">
              <div className="static-item">
                <div className="static-label">Proficiency Bonus</div>
                <div className="static-value">+{proficiencyBonus}</div>
              </div>
              <div className="static-item">
                <div className="static-label">Renown</div>
                <div className="static-value">{renown}</div>
              </div>
            </div>
          </section>

          {/* Resources Section */}
          <section className="resources-section">
            <h2>Resources</h2>
            <div className="resource-grid">
              <div className="resource-item">
                <div className="resource-label">Wounds</div>
                <div className="resource-value">{wounds}</div>
              </div>
              <div className="resource-item">
                <div className="resource-label">Hit Points</div>
                <div className="resource-value">{hitPoints}</div>
              </div>
              <div className="resource-item">
                <div className="resource-label">Sanity</div>
                <div className="resource-value">{sanity}</div>
              </div>
              <div className="resource-item">
                <div className="resource-label">Spell Points</div>
                <div className="resource-value">—</div>
              </div>
            </div>
          </section>

          {/* Defense DCs Section */}
          <section className="defense-section">
            <h2>Offensive DCs</h2>
            <div className="dc-grid">
              <div className="dc-item">
                <div className="dc-label">Melee DC</div>
                <div className="dc-value">{meleedc}</div>
              </div>
              <div className="dc-item">
                <div className="dc-label">Ranged DC</div>
                <div className="dc-value">{rangeddc}</div>
              </div>
              <div className="dc-item">
                <div className="dc-label">Spell DC</div>
                <div className="dc-value">{spelldc}</div>
              </div>
            </div>
          </section>
        </div>

        {/* AC and Initiative Section */}
        <div className="sheet-columns">
          <section className="defense-values-section">
            <h2>Defense</h2>
            <div className="defense-grid">
              <div className="defense-item">
                <div className="defense-label">Armor Class</div>
                <div className="defense-value">{armorAC}</div>
              </div>
              <div className="defense-item">
                <div className="defense-label">Initiative</div>
                <div className="defense-value">{initiative > 0 ? '+' : ''}{initiative}</div>
              </div>
            </div>
          </section>

          {/* Saving Throws Section */}
          <section className="saves-section">
            <h2>Saving Throws</h2>
            <div className="saves-list">
              <SavingThrowRow ability="STR" abilityKey="strength" modifier={savingThrows.strength} proficiencyBonus={proficiencyBonus} proficient={character.savingThrowProficiencies?.strength ?? false} />
              <SavingThrowRow ability="DEX" abilityKey="dexterity" modifier={savingThrows.dexterity} proficiencyBonus={proficiencyBonus} proficient={character.savingThrowProficiencies?.dexterity ?? false} />
              <SavingThrowRow ability="CON" abilityKey="constitution" modifier={savingThrows.constitution} proficiencyBonus={proficiencyBonus} proficient={character.savingThrowProficiencies?.constitution ?? false} />
              <SavingThrowRow ability="INT" abilityKey="intelligence" modifier={savingThrows.intelligence} proficiencyBonus={proficiencyBonus} proficient={character.savingThrowProficiencies?.intelligence ?? false} />
              <SavingThrowRow ability="WIS" abilityKey="wisdom" modifier={savingThrows.wisdom} proficiencyBonus={proficiencyBonus} proficient={character.savingThrowProficiencies?.wisdom ?? false} />
              <SavingThrowRow ability="CHA" abilityKey="charisma" modifier={savingThrows.charisma} proficiencyBonus={proficiencyBonus} proficient={character.savingThrowProficiencies?.charisma ?? false} />
            </div>
          </section>

          {/* Passive Skills Section */}
          <section className="passive-skills-section">
            <h2>Passive Skills</h2>
            <div className="passive-list">
              <PassiveSkillRow name="Perception" value={passivePerception} />
              <PassiveSkillRow name="Investigation" value={passiveInvestigation} />
              <PassiveSkillRow name="Insight" value={passiveInsight} />
            </div>
          </section>
        </div>

        {/* Movement and Spellcasting Section */}
        <div className="sheet-columns">
          <section className="movement-section">
            <h2>Movement</h2>
            <div className="movement-grid">
              <div className="movement-item">
                <div className="movement-label">Speed</div>
                <div className="movement-value">{speed} ft</div>
              </div>
            </div>
          </section>

          {hasSpells && (
            <section className="spellcasting-section">
              <h2>Spellcasting</h2>
              <div className="casting-grid">
                <div className="casting-item">
                  <div className="casting-label">Concentration DC</div>
                  <div className="casting-value">{concentrationDC}</div>
                </div>
                <div className="casting-item">
                  <div className="casting-label">Spell Save DC</div>
                  <div className="casting-value">{spelldc}</div>
                </div>
              </div>
              {Object.keys(spellSlots).length > 0 && (
                <div className="spell-slots">
                  <h3>Spell Slots</h3>
                  <div className="slots-grid">
                    {Object.entries(spellSlots).map(([level, slots]) => (
                      <div key={level} className="slot-item">
                        <div className="slot-label">Level {level}</div>
                        <div className="slot-count">{slots}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Attacks Row */}
        <section className="attacks-section">
          <h2>Attacks</h2>
          <div className="attacks-header">
            <div className="attack-name-header">Attack</div>
            <div className="attack-total-header">Bonus</div>
            <div className="attack-ability-header">Ability</div>
            <div className="attack-prof-header">Prof</div>
            <div className="attack-bonus-header">Weapon</div>
            <div className="damage-die-header">Damage Die</div>
            <div className="damage-ability-header">Dmg Mod</div>
            <div className="damage-bonus-header">Dmg Bonus</div>
            <div className="damage-total-header">Total Damage</div>
          </div>
          <div className="attacks-list">
            {character.attacks && character.attacks.length > 0 ? (
              character.attacks.map((attack, idx) => (
                <AttackRow
                  key={idx}
                  attack={attack}
                  proficiencyBonus={proficiencyBonus}
                />
              ))
            ) : (
              <div className="empty-state">No attacks</div>
            )}
          </div>
        </section>

        {/* Features and Skills Row */}
        <div className="sheet-row">
          {/* Features Section */}
          <section className="features-section">
            <h2>Features</h2>
            <div className="features-list">
              {character.features && character.features.length > 0 ? (
                character.features.map((feature, idx) => (
                  <div key={idx} className="feature-item">
                    <div className="feature-name">{feature.name}</div>
                    <div className="feature-description">{feature.description}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No features</div>
              )}
            </div>
          </section>

          {/* Skills Section */}
          <section className="skills-section">
            <h2>Skills</h2>
            <div className="skills-header">
              <div className="skill-name-header">Skill</div>
              <div className="skill-total-header">Total</div>
              <div className="skill-ability-header">Ability</div>
              <div className="skill-prof-header">Prof</div>
            </div>
            <div className="skills-list">
              {character.skills && character.skills.length > 0 ? (
                character.skills.map((skill, idx) => {
                  const skillModifier = modifiers[skill.ability];
                  return (
                    <SkillRow 
                      key={idx} 
                      skill={skill} 
                      modifier={skillModifier}
                      proficiencyBonus={proficiencyBonus}
                    />
                  );
                })
              ) : (
                <div className="empty-state">No skills</div>
              )}
            </div>
          </section>
        </div>

        {/* Equipment and Spells Row */}
        <div className="sheet-row">
          {/* Equipment Section */}
          <section className="equipment-section">
            <h2>Equipment</h2>
            <div className="equipment-list">
              {character.equipment && character.equipment.length > 0 ? (
                <>
                  {/* Armor */}
                  {character.equipment.filter(e => e.category === 'armor').length > 0 && (
                    <div className="equipment-category">
                      <h3>Armor</h3>
                      <div className="equipment-items">
                        {character.equipment
                          .filter(e => e.category === 'armor')
                          .map((item, idx) => (
                            <div key={idx} className="equipment-item">
                              <span className="equipment-name">{item.name}</span>
                              {item.quantity && item.quantity > 1 && (
                                <span className="equipment-qty">x{item.quantity}</span>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Weapons */}
                  {character.equipment.filter(e => e.category === 'weapon').length > 0 && (
                    <div className="equipment-category">
                      <h3>Weapons</h3>
                      <div className="equipment-items">
                        {character.equipment
                          .filter(e => e.category === 'weapon')
                          .map((item, idx) => (
                            <div key={idx} className="equipment-item">
                              <span className="equipment-name">{item.name}</span>
                              {item.quantity && item.quantity > 1 && (
                                <span className="equipment-qty">x{item.quantity}</span>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Equipment */}
                  {character.equipment.filter(e => e.category === 'equipment').length > 0 && (
                    <div className="equipment-category">
                      <h3>Equipment</h3>
                      <div className="equipment-items">
                        {character.equipment
                          .filter(e => e.category === 'equipment')
                          .map((item, idx) => (
                            <div key={idx} className="equipment-item">
                              <span className="equipment-name">{item.name}</span>
                              {item.quantity && item.quantity > 1 && (
                                <span className="equipment-qty">x{item.quantity}</span>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">No equipment</div>
              )}
            </div>
          </section>

          {/* Spells Section */}
          <section className="spells-section">
            <h2>Spells</h2>
            <div className="spells-list">
              {character.spells && character.spells.length > 0 ? (
                character.spells.map((spell, idx) => (
                  <div key={idx} className="spell-item">
                    <div className="spell-name">{spell.name}</div>
                    <div className="spell-level">Lvl {spell.level}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No spells</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
