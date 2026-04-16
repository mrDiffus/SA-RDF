import React, { useState } from 'react';
import { Character, AbilityScores, CharacterSkill, CharacterEquipment, CharacterSpell, CharacterAttack } from '../types';
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

export const CharacterSheet: React.FC<{ character?: Character }> = ({ character = sampleCharacter }) => {
  const [editMode, setEditMode] = useState(false);

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

  // Fixed values from character creation
  const proficiencyBonus = 2;

  // Calculate DCs
  const meleedc = 8 + proficiencyBonus + Math.max(modifiers.strength, modifiers.dexterity);
  const rangeddc = 8 + proficiencyBonus + modifiers.dexterity;
  const spelldc = 8 + proficiencyBonus + modifiers.intelligence; // Default to INT for casting ability

  // Calculate resources
  const wounds = finalScores.constitution;
  const hitPoints = modifiers.constitution + 6;
  const sanity = finalScores.wisdom;
  const renown = proficiencyBonus;

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
            <span className="value">{character.race}</span>
          </div>
          <div className="info-item">
            <span className="label">Archetypes:</span>
            <span className="value">{character.archetypes.join(' / ')}</span>
          </div>
          <div className="info-item">
            <span className="label">Experience:</span>
            <span className="value">{character.totalExperience}</span>
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
