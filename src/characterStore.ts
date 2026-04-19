import { Character } from './types';

// Module-level store for character being created/viewed
// Uses sessionStorage as invisible backup for page reloads
let pendingCharacter: Character | null = null;

export function setPendingCharacter(character: Character): void {
  pendingCharacter = character;
  // Transparent backup to sessionStorage in case module state is lost
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem('__pendingCharacter', JSON.stringify(character));
    } catch (e) {
      // Silently fail if sessionStorage unavailable
    }
  }
}

export function getPendingCharacter(): Character | null {
  // If module store has it, use that (fastest path)
  if (pendingCharacter) {
    return pendingCharacter;
  }
  
  // Check sessionStorage as backup (for page reloads that loaf the module)
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem('__pendingCharacter');
      if (stored) {
        return JSON.parse(stored) as Character;
      }
    } catch (e) {
      // Silently fail on parse errors
    }
  }
  
  return null;
}

export function clearPendingCharacter(): void {
  pendingCharacter = null;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.removeItem('__pendingCharacter');
    } catch (e) {
      // Silently fail if sessionStorage unavailable
    }
  }
}
