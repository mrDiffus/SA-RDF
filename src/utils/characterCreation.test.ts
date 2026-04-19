import { describe, it, expect } from 'vitest';
import {
  rollAbilityScore,
  rollAllAbilities,
  getDefaultAbilities,
  calculateModifier,
  calculateRacialBonuses,
  applyRacialBonuses,
  calculateDerivedStats,
  generateCharacterId,
  pointBuyValidator,
  POINT_BUY_COSTS,
  RACIAL_BONUSES
} from './characterCreation';

describe('Character Creation Utilities', () => {
  describe('pointBuyCosts', () => {
    it('should have correct costs for each score', () => {
      expect(POINT_BUY_COSTS[8]).toBe(0);
      expect(POINT_BUY_COSTS[9]).toBe(1);
      expect(POINT_BUY_COSTS[10]).toBe(2);
      expect(POINT_BUY_COSTS[11]).toBe(3);
      expect(POINT_BUY_COSTS[12]).toBe(4);
      expect(POINT_BUY_COSTS[13]).toBe(5);
      expect(POINT_BUY_COSTS[14]).toBe(7);
      expect(POINT_BUY_COSTS[15]).toBe(9);
    });
  });

  describe('rollAbilityScore', () => {
    it('should return a number between 3 and 18', () => {
      for (let i = 0; i < 100; i++) {
        const score = rollAbilityScore();
        expect(score).toBeGreaterThanOrEqual(3);
        expect(score).toBeLessThanOrEqual(18);
      }
    });
  });

  describe('rollAllAbilities', () => {
    it('should return 6 ability scores', () => {
      const abilities = rollAllAbilities();
      expect(Object.keys(abilities)).toHaveLength(6);
    });

    it('should have all required abilities', () => {
      const abilities = rollAllAbilities();
      expect(abilities).toHaveProperty('strength');
      expect(abilities).toHaveProperty('dexterity');
      expect(abilities).toHaveProperty('constitution');
      expect(abilities).toHaveProperty('intelligence');
      expect(abilities).toHaveProperty('wisdom');
      expect(abilities).toHaveProperty('charisma');
    });

    it('all scores should be between 3 and 18', () => {
      const abilities = rollAllAbilities();
      Object.values(abilities).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(3);
        expect(score).toBeLessThanOrEqual(18);
      });
    });
  });

  describe('getDefaultAbilities', () => {
    it('should return all abilities as 10', () => {
      const defaults = getDefaultAbilities();
      expect(defaults.strength).toBe(10);
      expect(defaults.dexterity).toBe(10);
      expect(defaults.constitution).toBe(10);
      expect(defaults.intelligence).toBe(10);
      expect(defaults.wisdom).toBe(10);
      expect(defaults.charisma).toBe(10);
    });
  });

  describe('calculateModifier', () => {
    it('should calculate correct modifiers', () => {
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(20)).toBe(5);
    });
  });

  describe('calculateRacialBonuses', () => {
    it('should return human with +1 to all abilities', () => {
      const bonuses = calculateRacialBonuses('sa:human');
      expect(bonuses).toEqual({ strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 });
    });

    it('should return dwarf with CON bonus', () => {
      const bonuses = calculateRacialBonuses('sa:dwarf');
      expect(bonuses.constitution).toBe(2);
    });

    it('should return elf with DEX bonus', () => {
      const bonuses = calculateRacialBonuses('sa:elf');
      expect(bonuses.dexterity).toBe(2);
    });

    it('should return gnome with INT bonus', () => {
      const bonuses = calculateRacialBonuses('sa:gnome');
      expect(bonuses.intelligence).toBe(2);
    });

    it('should return orc with STR, CON, INT, CHA bonuses', () => {
      const bonuses = calculateRacialBonuses('sa:orc');
      expect(bonuses.strength).toBe(4);
      expect(bonuses.constitution).toBe(2);
      expect(bonuses.intelligence).toBe(-2);
      expect(bonuses.charisma).toBe(-2);
    });

    it('should return empty object for unknown race', () => {
      const bonuses = calculateRacialBonuses('sa:unknown');
      expect(bonuses).toEqual({});
    });
  });

  describe('applyRacialBonuses', () => {
    it('should apply racial bonuses correctly', () => {
      const baseScores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const final = applyRacialBonuses(baseScores, 'sa:dwarf');
      expect(final.constitution).toBe(12);
      expect(final.strength).toBe(10); // Unchanged
    });

    it('should handle human with +1 to all abilities', () => {
      const baseScores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const final = applyRacialBonuses(baseScores, 'sa:human');
      expect(final).toEqual({
        strength: 11,
        dexterity: 11,
        constitution: 11,
        intelligence: 11,
        wisdom: 11,
        charisma: 11
      });
    });
  });

  describe('calculateDerivedStats', () => {
    it('should calculate AC correctly', () => {
      const scores = {
        strength: 10,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 0);
      expect(stats.ac).toBe(12); // 10 + 2 (DEX mod)
    });

    it('should calculate initiative correctly', () => {
      const scores = {
        strength: 10,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 0);
      expect(stats.initiative).toBe(2); // DEX modifier
    });

    it('should calculate HP correctly at 0 XP (level 1, HD=1)', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 0);
      expect(stats.hitPoints).toBe(8); // 6 + (1-1)*3.5 + 1*2 = 6 + 0 + 2
      expect(stats.hitDice).toBe(1);
    });

    it('should calculate HP correctly at 9 XP (level 5, HD=5)', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 9);
      expect(stats.hitPoints).toBe(30); // 6 + (5-1)*3.5 + 5*2 = 6 + 14 + 10
      expect(stats.hitDice).toBe(5);
    });

    it('should include proficiency bonus of 2 at 0 XP', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 0);
      expect(stats.proficiencyBonus).toBe(2);
    });

    it('should include proficiency bonus of 3 at 9 XP', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 9);
      expect(stats.proficiencyBonus).toBe(3);
    });

    it('should include proficiency bonus of 4 at 23 XP', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const stats = calculateDerivedStats(scores, 23);
      expect(stats.proficiencyBonus).toBe(4);
    });
  });

  describe('generateCharacterId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateCharacterId();
      const id2 = generateCharacterId();
      expect(id1).not.toBe(id2);
    });

    it('should start with char_ prefix', () => {
      const id = generateCharacterId();
      expect(id).toMatch(/^char_/);
    });
  });

  describe('pointBuyValidator', () => {
    it('should validate correct point buy', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const result = pointBuyValidator(scores);
      expect(result.valid).toBe(true);
    });

    it('should reject overspend', () => {
      const scores = {
        strength: 15,
        dexterity: 15,
        constitution: 15,
        intelligence: 15,
        wisdom: 15,
        charisma: 15
      };

      const result = pointBuyValidator(scores);
      expect(result.valid).toBe(false);
    });

    it('should reject scores below 8', () => {
      const scores = {
        strength: 7,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const result = pointBuyValidator(scores);
      expect(result.valid).toBe(false);
    });

    it('should reject scores above 15', () => {
      const scores = {
        strength: 16,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const result = pointBuyValidator(scores);
      expect(result.valid).toBe(false);
    });

    it('should calculate remaining points correctly', () => {
      const scores = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      };

      const result = pointBuyValidator(scores);
      expect(result.remainingPoints).toBe(15); // 27 - (6*2)
    });
  });

  describe('racialBonusesTable', () => {
    it('should have all 9 races', () => {
      expect(Object.keys(RACIAL_BONUSES)).toHaveLength(9);
    });

    it('should have correct races', () => {
      expect(RACIAL_BONUSES).toHaveProperty('sa:human');
      expect(RACIAL_BONUSES).toHaveProperty('sa:dwarf');
      expect(RACIAL_BONUSES).toHaveProperty('sa:elf');
      expect(RACIAL_BONUSES).toHaveProperty('sa:halfling');
      expect(RACIAL_BONUSES).toHaveProperty('sa:drow');
      expect(RACIAL_BONUSES).toHaveProperty('sa:gnome');
      expect(RACIAL_BONUSES).toHaveProperty('sa:draegloth');
      expect(RACIAL_BONUSES).toHaveProperty('sa:orc');
      expect(RACIAL_BONUSES).toHaveProperty('sa:feyri');
    });
  });
});
