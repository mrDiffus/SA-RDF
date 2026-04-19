import { describe, it, expect } from 'vitest';
import { getProgressionFromXP, getXPForNextLevel, hasAbilityIncreaseAtXP } from '../utils/progression';

describe('Progression Utility', () => {
  describe('getProgressionFromXP', () => {
    it('should return level 1 at 0 XP', () => {
      const progression = getProgressionFromXP(0);
      expect(progression.level).toBe(1);
      expect(progression.proficiencyBonus).toBe(2);
      expect(progression.hitDice).toBe(1);
    });

    it('should return correct values at 2 XP', () => {
      const progression = getProgressionFromXP(2);
      expect(progression.level).toBe(2);
      expect(progression.proficiencyBonus).toBe(2);
      expect(progression.hitDice).toBe(2);
    });

    it('should return level 5 at 9 XP', () => {
      const progression = getProgressionFromXP(9);
      expect(progression.level).toBe(5);
      expect(progression.proficiencyBonus).toBe(3);
      expect(progression.hitDice).toBe(5);
    });

    it('should return level 9 at 23 XP', () => {
      const progression = getProgressionFromXP(23);
      expect(progression.level).toBe(9);
      expect(progression.proficiencyBonus).toBe(4);
      expect(progression.hitDice).toBe(9);
    });

    it('should return level 16 at 60 XP', () => {
      const progression = getProgressionFromXP(60);
      expect(progression.level).toBe(16);
      expect(progression.proficiencyBonus).toBe(5);
      expect(progression.hitDice).toBe(16);
    });

    it('should return level 17 at 67 XP', () => {
      const progression = getProgressionFromXP(67);
      expect(progression.level).toBe(17);
      expect(progression.proficiencyBonus).toBe(6);
      expect(progression.hitDice).toBe(17);
    });

    it('should return level 20 at 89 XP', () => {
      const progression = getProgressionFromXP(89);
      expect(progression.level).toBe(20);
      expect(progression.proficiencyBonus).toBe(7);
      expect(progression.hitDice).toBe(20);
    });

    it('should cap at level 20 for very high XP', () => {
      const progression = getProgressionFromXP(999);
      expect(progression.level).toBe(20);
      expect(progression.proficiencyBonus).toBe(7);
      expect(progression.hitDice).toBe(20);
    });

    it('should handle negative XP gracefully', () => {
      const progression = getProgressionFromXP(-10);
      expect(progression.level).toBe(1);
      expect(progression.proficiencyBonus).toBe(2);
      expect(progression.hitDice).toBe(1);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return XP for next level from level 1', () => {
      const nextXP = getXPForNextLevel(1);
      expect(nextXP).toBe(2);
    });

    it('should return XP for next level from level 5', () => {
      const nextXP = getXPForNextLevel(5);
      expect(nextXP).toBe(12);
    });

    it('should return undefined for level 20', () => {
      const nextXP = getXPForNextLevel(20);
      expect(nextXP).toBeUndefined();
    });
  });

  describe('hasAbilityIncreaseAtXP', () => {
    it('should return true at XP 6 (level 4 gain)', () => {
      const hasIncrease = hasAbilityIncreaseAtXP(6);
      expect(hasIncrease).toBe(true);
    });

    it('should return true at XP 19 (level 8 gain)', () => {
      const hasIncrease = hasAbilityIncreaseAtXP(19);
      expect(hasIncrease).toBe(true);
    });

    it('should return true at XP 37 (level 12 gain)', () => {
      const hasIncrease = hasAbilityIncreaseAtXP(37);
      expect(hasIncrease).toBe(true);
    });

    it('should return false at XP 9 (level 5, no ability gain)', () => {
      const hasIncrease = hasAbilityIncreaseAtXP(9);
      expect(hasIncrease).toBe(false);
    });

    it('should return false at XP 0 (level 1, no ability gain)', () => {
      const hasIncrease = hasAbilityIncreaseAtXP(0);
      expect(hasIncrease).toBe(false);
    });
  });
});
