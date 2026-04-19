import { describe, expect, it } from 'vitest';

import {
  curieToRelativeIri,
  parseBrowserRoute,
  relativeIriToCurie,
} from './rdfNavigation';

describe('rdfNavigation', () => {
  it('maps spell CURIEs to fragment IRIs', () => {
    expect(curieToRelativeIri('spell:Affliction')).toBe('/spell#Affliction');
    expect(relativeIriToCurie('/spell#Affliction')).toBe('spell:Affliction');
  });

  it('maps equipment CURIEs to equipment fragment IRIs', () => {
    expect(curieToRelativeIri('equipment:Outer Tactical Vest')).toBe('/equipment/Outer%20Tactical%20Vest');
    expect(relativeIriToCurie('/equipment/Outer%20Tactical%20Vest')).toBe('equipment:Outer Tactical Vest');
  });

  it('keeps legacy equipment hash links compatible', () => {
    expect(relativeIriToCurie('/equipment#Outer%20Tactical%20Vest')).toBe('equipment:Outer Tactical Vest');
  });

  it('preserves archetype path routing', () => {
    expect(curieToRelativeIri('archetype:Arcanist')).toBe('/archetype/Arcanist');
    expect(relativeIriToCurie('/archetype/Arcanist')).toBe('archetype:Arcanist');
  });

  it('maps planet CURIEs to planet paths', () => {
    expect(curieToRelativeIri('planet:Arrur')).toBe('/lore/planet/Arrur');
    expect(curieToRelativeIri('planet:Arcech')).toBe('/lore/planet/Arcech');
    expect(relativeIriToCurie('/lore/planet/Arrur')).toBe('planet:Arrur');
    expect(relativeIriToCurie('/lore/planet/Arcech')).toBe('planet:Arcech');
  });

  it('maps place CURIEs to place paths', () => {
    expect(curieToRelativeIri('place:Arrur/Ashcross')).toBe('/lore/planet/Arrur/place/Ashcross');
    expect(relativeIriToCurie('/lore/planet/Arrur/place/Ashcross')).toBe('place:Arrur/Ashcross');
  });

  it('keeps collection routes as collections when there is no fragment', () => {
    expect(parseBrowserRoute('/rules')).toEqual({ collectionTab: 'rules', resourceId: null });
    expect(parseBrowserRoute('/equipment')).toEqual({ collectionTab: 'equipment', resourceId: null });
    expect(parseBrowserRoute('/lore')).toEqual({ collectionTab: 'lore', resourceId: null });
  });

  it('treats collection routes with fragments as resource links', () => {
    expect(parseBrowserRoute('/equipment', '#Broadsword')).toEqual({
      collectionTab: 'equipment',
      resourceId: 'equipment:Broadsword'
    });
  });

  it('treats collection routes with equipment path segments as resource links', () => {
    expect(parseBrowserRoute('/equipment/broadsword')).toEqual({
      collectionTab: 'equipment',
      resourceId: 'equipment:broadsword'
    });
  });

  it('treats lore routes with planet path segments as resource links', () => {
    expect(parseBrowserRoute('/lore/planet/Arrur')).toEqual({
      collectionTab: 'lore',
      resourceId: 'planet:Arrur'
    });
  });

  it('treats lore routes with place path segments as resource links', () => {
    expect(parseBrowserRoute('/lore/planet/Arrur/place/Ashcross')).toEqual({
      collectionTab: 'lore',
      resourceId: 'place:Arrur/Ashcross'
    });
  });

  it('maps hostname-relative sa resources back to sa CURIEs', () => {
    expect(curieToRelativeIri('sa:orc')).toBe('/orc');
    expect(relativeIriToCurie('/orc')).toBe('sa:orc');
  });
});