/**
 * Equipment AC Lookup Utility
 * Provides dynamic armor class lookup from equipment data
 */

import { Equipment } from '../types';

export interface EquipmentACData {
  ac: number | string;
  maxDexterity?: number | string;
}

/**
 * Parse armor class value which can be a number (e.g., 18) or a modifier string (e.g., "+2 AC")
 * @param acValue The armorClass value from equipment data
 * @returns AC bonus as a number if it's a modifier (e.g., "+2" -> 2), or the AC number itself
 */
function parseACValue(acValue: number | string | undefined): { isModifier: boolean; value: number } | null {
  if (acValue === undefined || acValue === null) return null;

  if (typeof acValue === 'number') {
    return { isModifier: false, value: acValue };
  }

  const str = acValue.toString().trim();
  
  // Check if it's a modifier like "+2" or "+2 AC"
  const modifierMatch = str.match(/^([+-]?\d+)/);
  if (modifierMatch) {
    const value = parseInt(modifierMatch[1], 10);
    const isModifier = str.includes('+') || str.includes('+') || str.startsWith('-');
    return { isModifier, value };
  }

  return null;
}

/**
 * Get AC and max dexterity from an equipment list (typically armor)
 * Sums AC values if multiple armor pieces, applies max dex constraint
 * @param equipment Array of equipped items
 * @returns Object with combined AC and min maxDexterity constraint
 */
export function calculateEquipmentAC(equipment: Array<{ name: string; category?: string }>, equipmentData: Equipment[]): { ac: number; maxDexterity?: number } {
  let totalAC = 10; // Base AC
  let minMaxDex: number | undefined = undefined;

  // Filter to armor only
  const armorItems = equipment.filter(e => e.category === 'armor');

  if (armorItems.length === 0) {
    return { ac: totalAC }; // Unarmored AC is 10
  }

  for (const item of armorItems) {
    const equipData = equipmentData.find(e => e.label === item.name);
    if (!equipData) continue;

    const acParsed = parseACValue(equipData.armorClass);
    if (!acParsed) continue;

    // If it's a modifier, add it; if it's a full AC value, replace base
    if (acParsed.isModifier) {
      totalAC += acParsed.value;
    } else if (acParsed.value > totalAC) {
      totalAC = acParsed.value;
    }

    // Track minimum max-dex constraint
    const maxDex = parseACValue(equipData.maxDexterity);
    if (maxDex) {
      const maxDexVal = maxDex.value;
      if (minMaxDex === undefined || maxDexVal < minMaxDex) {
        minMaxDex = maxDexVal;
      }
    }
  }

  return {
    ac: totalAC,
    maxDexterity: minMaxDex
  };
}

/**
 * Look up a single equipment item's AC information
 * @param itemName Name/label of the equipment
 * @param equipmentData Full equipment data array
 * @returns AC data or null if not found
 */
export function getEquipmentACData(itemName: string, equipmentData: Equipment[]): EquipmentACData | null {
  const item = equipmentData.find(e => e.label === itemName);
  if (!item || !item.armorClass) return null;

  return {
    ac: item.armorClass,
    maxDexterity: item.maxDexterity
  };
}
