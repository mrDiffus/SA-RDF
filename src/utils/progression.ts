/**
 * Character Progression Utility
 * Handles XP to proficiency bonus, hit dice, and level lookups
 * Based on ProgressionTable from public/data/basics/character-creation.json
 */

export interface ProgressionData {
  level: number;
  proficiencyBonus: number;
  hitDice: number;
  special?: string;
}

/**
 * Progression table mapping total experience to character progression stats
 * Source: character-creation.json sa:progressionTable
 */
const PROGRESSION_TABLE: Array<{
  totalExperience: number;
  proficiencyBonus: number;
  hitDice: number;
  special?: string;
  level: number;
}> = [
  { totalExperience: 0, proficiencyBonus: 2, hitDice: 1, level: 1 },
  { totalExperience: 2, proficiencyBonus: 2, hitDice: 2, level: 2 },
  { totalExperience: 4, proficiencyBonus: 2, hitDice: 3, level: 3 },
  { totalExperience: 6, proficiencyBonus: 2, hitDice: 4, level: 4, special: '+1 to two different abilities' },
  { totalExperience: 9, proficiencyBonus: 3, hitDice: 5, level: 5 },
  { totalExperience: 12, proficiencyBonus: 3, hitDice: 6, level: 6 },
  { totalExperience: 15, proficiencyBonus: 3, hitDice: 7, level: 7 },
  { totalExperience: 19, proficiencyBonus: 3, hitDice: 8, level: 8, special: '+1 to two different abilities' },
  { totalExperience: 23, proficiencyBonus: 4, hitDice: 9, level: 9 },
  { totalExperience: 27, proficiencyBonus: 4, hitDice: 10, level: 10 },
  { totalExperience: 32, proficiencyBonus: 4, hitDice: 11, level: 11 },
  { totalExperience: 37, proficiencyBonus: 4, hitDice: 12, level: 12, special: '+1 to two different abilities' },
  { totalExperience: 42, proficiencyBonus: 5, hitDice: 13, level: 13 },
  { totalExperience: 48, proficiencyBonus: 5, hitDice: 14, level: 14 },
  { totalExperience: 54, proficiencyBonus: 5, hitDice: 15, level: 15 },
  { totalExperience: 60, proficiencyBonus: 5, hitDice: 16, level: 16, special: '+1 to two different abilities' },
  { totalExperience: 67, proficiencyBonus: 6, hitDice: 17, level: 17 },
  { totalExperience: 74, proficiencyBonus: 6, hitDice: 18, level: 18 },
  { totalExperience: 81, proficiencyBonus: 6, hitDice: 19, level: 19 },
  { totalExperience: 89, proficiencyBonus: 7, hitDice: 20, level: 20, special: '+1 to two different abilities' }
];

/**
 * Get progression data for a given total experience amount
 * Finds the highest progression row where totalExperience <= xp value
 * @param totalXP Total experience points earned
 * @returns ProgressionData with level, proficiency bonus, and hit dice
 */
export function getProgressionFromXP(totalXP: number): ProgressionData {
  // Handle negative XP (shouldn't happen, but safe default)
  if (totalXP < 0) {
    return {
      level: 1,
      proficiencyBonus: 2,
      hitDice: 1
    };
  }

  // Iterate backward to find the highest threshold we've reached
  for (let i = PROGRESSION_TABLE.length - 1; i >= 0; i--) {
    if (totalXP >= PROGRESSION_TABLE[i].totalExperience) {
      const row = PROGRESSION_TABLE[i];
      return {
        level: row.level,
        proficiencyBonus: row.proficiencyBonus,
        hitDice: row.hitDice,
        special: row.special
      };
    }
  }

  // Fallback (shouldn't reach here)
  return {
    level: 1,
    proficiencyBonus: 2,
    hitDice: 1
  };
}

/**
 * Get the XP threshold for the next level
 * Useful for displaying progress bars or advancement info
 * @param level Current character level (1-20)
 * @returns XP needed to reach next level, or undefined if at max level
 */
export function getXPForNextLevel(level: number): number | undefined {
  if (level >= 20) return undefined;
  
  const nextRow = PROGRESSION_TABLE.find(row => row.level === level + 1);
  return nextRow?.totalExperience;
}

/**
 * Check if character can gain ability improvement at current XP
 * @param totalXP Total experience points
 * @returns true if this XP milestone grants an ability increase
 */
export function hasAbilityIncreaseAtXP(totalXP: number): boolean {
  const progression = getProgressionFromXP(totalXP);
  const row = PROGRESSION_TABLE.find(r => r.totalExperience === totalXP);
  return row?.special?.includes('+1 to two different abilities') ?? false;
}
