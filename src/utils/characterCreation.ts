import { AbilityScores } from '../types';

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

export const RACIAL_BONUSES: Record<string, Partial<AbilityScores>> = {
  'sa:human': { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
  'sa:dwarf': { constitution: 2 },
  'sa:elf': { dexterity: 2 },
  'sa:halfling': { dexterity: 2, charisma: 1 },
  'sa:gnome': { intelligence: 2 },
  'sa:orc': { strength: 4, constitution: 2, intelligence: -2, charisma: -2 },
  'sa:drow': { dexterity: 1 },
  'sa:draegloth': { strength: 2, constitution: 1 },
  'sa:feyri': { dexterity: 1, intelligence: 2 }
};

export function rollAbilityScore(): number {
  const rolls = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

export function rollAllAbilities(): AbilityScores {
  return {
    strength: rollAbilityScore(),
    dexterity: rollAbilityScore(),
    constitution: rollAbilityScore(),
    intelligence: rollAbilityScore(),
    wisdom: rollAbilityScore(),
    charisma: rollAbilityScore()
  };
}

export function getDefaultAbilities(): AbilityScores {
  return {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  };
}

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calculateRacialBonuses(raceId: string): Partial<AbilityScores> {
  return RACIAL_BONUSES[raceId] || {};
}

export function applyRacialBonuses(scores: AbilityScores, raceId: string): AbilityScores {
  const bonuses = calculateRacialBonuses(raceId);
  return {
    strength: (scores.strength || 0) + (bonuses.strength || 0),
    dexterity: (scores.dexterity || 0) + (bonuses.dexterity || 0),
    constitution: (scores.constitution || 0) + (bonuses.constitution || 0),
    intelligence: (scores.intelligence || 0) + (bonuses.intelligence || 0),
    wisdom: (scores.wisdom || 0) + (bonuses.wisdom || 0),
    charisma: (scores.charisma || 0) + (bonuses.charisma || 0)
  };
}

export function calculateDerivedStats(scores: AbilityScores) {
  const modifiers = {
    strength: calculateModifier(scores.strength),
    dexterity: calculateModifier(scores.dexterity),
    constitution: calculateModifier(scores.constitution),
    intelligence: calculateModifier(scores.intelligence),
    wisdom: calculateModifier(scores.wisdom),
    charisma: calculateModifier(scores.charisma)
  };

  const proficiencyBonus = 2;

  return {
    modifiers,
    proficiencyBonus,
    ac: 10 + modifiers.dexterity,
    initiative: modifiers.dexterity,
    wounds: scores.constitution,
    hitPoints: 6 + modifiers.constitution,
    savingThrows: {
      strength: proficiencyBonus + modifiers.strength,
      dexterity: proficiencyBonus + modifiers.dexterity,
      constitution: proficiencyBonus + modifiers.constitution,
      intelligence: proficiencyBonus + modifiers.intelligence,
      wisdom: proficiencyBonus + modifiers.wisdom,
      charisma: proficiencyBonus + modifiers.charisma
    }
  };
}

export function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function pointBuyValidator(scores: AbilityScores): { valid: boolean; remainingPoints: number } {
  let spent = 0;
  const abilities = [scores.strength, scores.dexterity, scores.constitution, scores.intelligence, scores.wisdom, scores.charisma];
  for (const score of abilities) {
    if (score < 8 || score > 15) return { valid: false, remainingPoints: 0 };
    spent += POINT_BUY_COSTS[score] || 0;
  }
  const remainingPoints = 27 - spent;
  return { valid: spent <= 27 && remainingPoints >= 0, remainingPoints };
}
