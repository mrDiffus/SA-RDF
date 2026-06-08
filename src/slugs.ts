export function idToSlug(id: string): string {
  // 'sa:character/aurora-chen'  → 'aurora-chen'
  // 'sa:org/armanitech'         → 'armanitech'
  // 'location:blackwater'       → 'blackwater'
  // 'archetype:Academic'        → 'academic'
  const colon = id.indexOf(':');
  const afterColon = colon >= 0 ? id.slice(colon + 1) : id;
  const slash = afterColon.lastIndexOf('/');
  const base = slash >= 0 ? afterColon.slice(slash + 1) : afterColon;
  return base.toLowerCase().replace(/\s+/g, '-');
}

export function slugToCharacterPath(slug: string, orgFolderName?: string): string {
  if (orgFolderName) {
    return `/setting/organizations/${encodeURIComponent(orgFolderName)}/${encodeURIComponent(slug)}`;
  }
  return `/setting/characters/${encodeURIComponent(slug)}`;
}

export function slugToOrgPath(orgFolderName: string): string {
  return `/setting/organizations/${encodeURIComponent(orgFolderName)}`;
}

export function slugToPlanetPath(planetSlug: string): string {
  return `/setting/planets/${encodeURIComponent(planetSlug)}`;
}

export function slugToPlacePath(planetSlug: string, placeSlug: string): string {
  return `/setting/planets/${encodeURIComponent(planetSlug)}/${encodeURIComponent(placeSlug)}`;
}

export function slugToRulePath(sectionSlug: string): string {
  return `/rules/${encodeURIComponent(sectionSlug)}`;
}

export function slugToRacePath(raceSlug: string): string {
  return `/races/${encodeURIComponent(raceSlug)}`;
}

export function slugToArchetypePath(archetypeSlug: string): string {
  return `/archetypes/${encodeURIComponent(archetypeSlug)}`;
}

export function slugToSpellPath(spellSlug: string): string {
  return `/spells/${encodeURIComponent(spellSlug)}`;
}

export function slugToEquipmentPath(equipmentSlug: string): string {
  return `/equipment/${encodeURIComponent(equipmentSlug)}`;
}
