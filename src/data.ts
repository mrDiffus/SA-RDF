import { 
  Spell, Archetype, Race, Equipment, RuleSection, RuleContent, Feature,
  RawSpell, RawArchetype, RawRace, RawEquipment, RawRuleSection, RawFeature, RawRuleContent
} from './types';

type RawGraphContainer<T = any> = {
  '@graph'?: T[];
  [key: string]: any;
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function sortByLabel<T extends { label: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s*(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function normalizeFeatureDescription(description: string | string[] | undefined): string[] {
  if (Array.isArray(description)) return description.flatMap((item) =>
    typeof item === 'string' ? splitIntoSentences(item) : []
  );
  if (typeof description === 'string') return splitIntoSentences(description);
  return [];
}

function normalizeArchetypeProficiency(values: any[] | undefined, key: string, skillIdMap?: Map<string, string>): string[] {
  return asArray(values)
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        // Handle @id references for skills
        if (entry['@id'] && key === 'archetype:Skill' && skillIdMap) {
          const label = skillIdMap.get(entry['@id']);
          return label || null;
        }
        // Handle legacy nested-key format
        if (typeof entry[key] === 'string') return entry[key];
      }
      return null;
    })
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

const archetypeLabelToCurie: Record<string, string> = {
  'academic': 'archetype:Academic',
  'ace': 'archetype:Ace',
  'arcanist': 'archetype:Arcanist',
  'armsman': 'archetype:Armsman',
  'cannoneer': 'archetype:Cannoneer',
  'devotee': 'archetype:Devotee',
  'gunslinger': 'archetype:Gunslinger',
  'martial artist': 'archetype:MartialArtist',
  'medical personnel': 'archetype:MedicalPersonnel',
  'occultist': 'archetype:Occultist',
  'personality': 'archetype:Personality',
  'primitive': 'archetype:Primitive',
  'recon': 'archetype:Recon',
  'scrounger': 'archetype:Scrounger',
  'spacer': 'archetype:Spacer',
  'technician': 'archetype:Technician'
};

function normalizeArchetypeReference(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('archetype:')) return trimmed;

  const normalized = trimmed.toLowerCase();
  return archetypeLabelToCurie[normalized] || trimmed;
}

function extractSpellLevels(raw: Record<string, any>): Record<string, { id: string; label: string }[]> | undefined {
  const spellLevels = Object.entries(raw)
    .filter(([key]) => /^spell-level-\d+$/.test(key))
    .reduce<Record<string, { id: string; label: string }[]>>((acc, [levelKey, spells]) => {
      acc[levelKey] = asArray(spells).map((spell: any) => ({
        id: spell?.['@id'] || spell?.['rdfs:label'] || '',
        label: spell?.['rdfs:label'] || spell?.['@id'] || ''
      }));
      return acc;
    }, {});

  return Object.keys(spellLevels).length > 0 ? spellLevels : undefined;
}

function normalizeEquipmentType(groupLabel: string, rawType?: string): string {
  const lowered = `${groupLabel} ${rawType || ''}`.toLowerCase();
  if (lowered.includes('melee')) return 'Melee';
  if (lowered.includes('ranged')) return 'Ranged';
  if (lowered.includes('wondrous') || lowered.includes('wonderous')) return 'Wondrous';
  if (lowered.includes('power armor') || lowered.includes('powered armor')) return 'Power Armor';
  if (lowered.includes('armor')) return 'Armor';
  return groupLabel;
}

function normalizeEquipmentClass(rawType: string | undefined, type: string): string {
  if (typeof rawType === 'string' && rawType.length > 0) {
    return rawType.includes(':') ? rawType.split(':').pop() || rawType : rawType;
  }

  if (type === 'Power Armor') return 'PoweredArmor';
  if (type === 'Armor') return 'Armor';
  if (type === 'Melee' || type === 'Ranged') return 'Weapon';
  if (type === 'Wondrous') return 'WondrousItem';
  return 'Equipment';
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

async function fetchGraphFromFile<T>(path: string): Promise<T[]> {
  const resolvedPath = resolveDataPath(path);
  const response = await fetch(resolvedPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resolvedPath}: ${response.status} ${response.statusText}`);
  }
  const data: RawGraphContainer<T> = await response.json();
  return asArray(data['@graph']);
}

function mapArchetype(raw: RawArchetype & Record<string, any>, skillIdMap?: Map<string, string>): Archetype {
  const spellLevels = extractSpellLevels(raw);

  return {
    id: raw['@id'],
    label: raw['rdfs:label'],
    description: raw['archetype:description'],
    proficiencies: {
      skills: normalizeArchetypeProficiency(raw['archetype:proficiencies']?.['archetype:Skills'], 'archetype:Skill', skillIdMap),
      weapons: normalizeArchetypeProficiency(raw['archetype:proficiencies']?.['archetype:Weapons'], 'archetype:Weapon'),
      armor: normalizeArchetypeProficiency(raw['archetype:proficiencies']?.['archetype:Armor'], 'archetype:Armor'),
      saves: normalizeArchetypeProficiency(raw['archetype:proficiencies']?.['archetype:Saves'], 'archetype:Save')
    },
    features: asArray(raw['sa:features']).map(mapFeature),
    spellcasting: raw['archetype:spellcasting'],
    spellLevels
  };
}

function mapFeature(raw: RawFeature) {
  return {
    label: raw['rdfs:label'],
    description: normalizeFeatureDescription(raw['sa:description'] as any),
    cost: raw['sa:cost'] || '',
    prerequisites: raw['sa:prerequisites'] || [],
    archetypes: asArray(raw['sa:archetypes']).map(normalizeArchetypeReference)
  };
}

export async function fetchSpells(): Promise<Spell[]> {
  const response = await fetch(resolveDataPath('/data/spells.json'));
  const data = await response.json();
  const spellList = data['@graph'].find((g: any) => g['@id'] === 'sa:spellList');

  return sortByLabel(spellList['sa:items'].map((raw: RawSpell) => ({
    id: raw['@id'],
    label: raw['rdfs:label'],
    ...(raw['spell:level'] !== undefined && { level: raw['spell:level'] }),
    castingTime: raw['spell:castingtime'],
    description: raw['spell:description'],
    duration: raw['spell:duration'],
    range: raw['spell:range'],
    ritual: raw['spell:ritual'],
    target: raw['spell:target'],
    ...(raw['sa:damage'] !== undefined && { damage: raw['sa:damage'] }),
    ...(raw['sa:damageType'] !== undefined && { damageType: raw['sa:damageType'] }),
    ...(raw['sa:levelScaling'] !== undefined && { levelScaling: raw['sa:levelScaling'] })
  })));
}

export async function fetchArchetypes(): Promise<Archetype[]> {
  // Build skill ID → label map from skills.json for resolving archetype skill proficiencies
  let skillIdMap: Map<string, string> | undefined;
  try {
    const skillsData = await fetch(resolveDataPath('/data/skills.json')).then(r => r.json());
    skillIdMap = new Map();
    for (const node of asArray(skillsData['@graph'])) {
      if (node['@type'] === 'sa:Skill' && node['@id'] && node['rdfs:label']) {
        skillIdMap.set(node['@id'], node['rdfs:label']);
      }
    }
  } catch (e) {
    console.warn('Could not load skills.json for archetype skill resolution', e);
  }

  const response = await fetch(resolveDataPath('/data/archetypes.json'));
  const data: RawGraphContainer<RawArchetype> = await response.json();

  if (Array.isArray(data['@graph']) && data['@graph'].length > 0) {
    return sortByLabel(
      data['@graph'].map((raw) => mapArchetype(raw as RawArchetype & Record<string, any>, skillIdMap))
    );
  }

  const members = asArray<string>(data['archetype:members']);
  const archetypeGraphs = await Promise.all(
    members.map((member) => fetchGraphFromFile<RawArchetype>(`/data/archetypes/${member}.json`))
  );

  return sortByLabel(
    archetypeGraphs
      .flat()
      .map((raw) => mapArchetype(raw as RawArchetype & Record<string, any>, skillIdMap))
  );
}

export async function fetchRaces(): Promise<Race[]> {
  const response = await fetch(resolveDataPath('/data/races.json'));
  const data: RawGraphContainer<RawRace> = await response.json();

  const overviewRaces = asArray(data['@graph']);

  const raceMembers = asArray<string>(data['race:members'] || data['sa:members']);
  const raceFileStems = new Set<string>([
    ...raceMembers,
    // Known race files in this repository.
    'draegloth',
    'drow',
    'dwarf',
    'elf',
    'feyri',
    'gnome',
    'halfling',
    'human',
    'orc'
  ]);

  const detailedRaceGraphs = await Promise.all(
    Array.from(raceFileStems).map((member) =>
      fetchGraphFromFile<RawRace>(`/data/races/${member}-features.json`).catch(() => [])
    )
  );

  const mergedRawRaces = [...overviewRaces, ...detailedRaceGraphs.flat()] as Array<RawRace & Record<string, any>>;

  const raceById = new Map<string, RawRace & Record<string, any>>();
  mergedRawRaces.forEach((race) => {
    const current = raceById.get(race['@id']);
    const currentFeatureCount = asArray(current?.['sa:features']).length;
    const incomingFeatureCount = asArray(race['sa:features']).length;
    const currentRelationCount = asArray(current?.['sa:relationFeatures']).length;
    const incomingRelationCount = asArray(race['sa:relationFeatures']).length;

    // Keep whichever record carries richer detail.
    if (!current || incomingFeatureCount > currentFeatureCount || incomingRelationCount > currentRelationCount) {
      raceById.set(race['@id'], race);
    }
  });

  return sortByLabel(Array.from(raceById.values()).map((raw: RawRace & Record<string, any>) => ({
    id: raw['@id'],
    label: raw['rdfs:label'],
    features: asArray(raw['sa:features']).map((f: any) => ({
      label: f['rdfs:label'],
      description: normalizeFeatureDescription(f['sa:description'])
    })),
    relationFeatures: asArray(raw['sa:relationFeatures']).map((f: any) => ({
      label: f['rdfs:label'],
      description: normalizeFeatureDescription(f['sa:description'])
    }))
  })));
}

function mapRuleContent(raw: RawRuleContent): any {
  if (raw['@type'] === 'sa:Table') {
    return {
      type: 'table',
      title: raw['sa:text'] || 'Table',
      headers: asArray(raw['sa:headers']),
      rows: asArray(raw['sa:rows']).map((row) => asArray(row).map((cell) => String(cell)))
    };
  }

  const type = raw['@type'] === 'sa:Paragraph' ? 'paragraph' : 'header';
  return {
    type,
    text: raw['sa:text'] || '',
    content: raw['sa:content']?.map(mapRuleContent)
  };
}

function splitParagraphs(text: string): RuleContent[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ type: 'paragraph' as const, text: line }));
}

function mapTableToRuleContent(table: any): RuleContent | null {
  if (!table || !Array.isArray(table['sa:rows'])) return null;

  return {
    type: 'table',
    title: table['rdfs:label'] || 'Table',
    headers: asArray<string>(table['sa:headers']),
    rows: asArray<any[]>(table['sa:rows']).map((row) => asArray(row).map((cell) => String(cell)))
  };
}

function mapRuleNodeToSection(raw: any): RuleSection | null {
  if (Array.isArray(raw['sa:content'])) {
    return {
      id: raw['@id'] || raw['rdfs:label'],
      label: raw['rdfs:label'] || 'Rules',
      content: asArray(raw['sa:content']).map(mapRuleContent)
    };
  }

  if (Array.isArray(raw['sa:actions'])) {
    return {
      id: raw['@id'] || raw['rdfs:label'] || 'actions',
      label: raw['rdfs:label'] || 'Actions',
      content: asArray(raw['sa:actions']).map((action: any) => {
        const actionContent: RuleContent[] = [];
        if (action['sa:actionType']) {
          actionContent.push({ type: 'paragraph', text: `Type: ${action['sa:actionType']}` });
        }
        if (action['sa:requirements']) {
          actionContent.push({ type: 'paragraph', text: `Requirements: ${action['sa:requirements']}` });
        }
        actionContent.push(...splitParagraphs(action['sa:description'] || ''));

        return {
          type: 'header',
          text: action['rdfs:label'] || 'Action',
          content: actionContent
        };
      })
    };
  }

  if (Array.isArray(raw['sa:steps'])) {
    const sectionContent: RuleContent[] = asArray(raw['sa:steps']).map((step: any) => {
      const stepContent: RuleContent[] = splitParagraphs(step['sa:description'] || '');
      const pointBuyTable = mapTableToRuleContent(step['sa:pointBuyTable']);
      if (pointBuyTable) stepContent.push(pointBuyTable);

      return {
        type: 'header',
        text: step['rdfs:label'] || 'Step',
        content: stepContent
      };
    });

    const progressionTable = mapTableToRuleContent(raw['sa:progressionTable']);
    if (progressionTable) sectionContent.push(progressionTable);

    return {
      id: raw['@id'] || raw['rdfs:label'] || 'basics',
      label: raw['rdfs:label'] || 'Basic Rules',
      content: sectionContent
    };
  }

  return null;
}

export async function fetchRules(): Promise<RuleSection[]> {
  const ruleFiles = [
    '/data/rules.json',
    '/data/basics.json',
    '/data/basics/actions.json',
    '/data/basics/character-creation.json'
  ];

  const graphs = await Promise.all(
    ruleFiles.map((file) => fetchGraphFromFile<any>(file).catch(() => []))
  );

  const sections = graphs
    .flat()
    .map(mapRuleNodeToSection)
    .filter((section): section is RuleSection => section !== null);

  const dedupedSections = new Map<string, RuleSection>();
  sections.forEach((section) => {
    dedupedSections.set(section.id, section);
  });

  return sortByLabel(Array.from(dedupedSections.values()));
}

export async function fetchEquipment(): Promise<Equipment[]> {
  const equipmentOverviewGraph = await fetchGraphFromFile<any>('/data/equipment.json').catch(() => []);
  const items: Equipment[] = [];

  const mapEquipmentItem = (raw: RawEquipment & Record<string, any>, groupLabel: string): Equipment => {
    const rawType = raw['@type'] || raw['type'];
    const normalizedType = normalizeEquipmentType(groupLabel, rawType);

    return {
    id: raw['@id'] || raw['rdfs:label'],
    label: raw['rdfs:label'],
    type: normalizedType,
    equipmentClass: normalizeEquipmentClass(rawType, normalizedType),
    description: raw['sa:description'] || '',
    cost: raw['sa:cost'],
    weight: raw['sa:weight'],
    tags: raw['sa:tags'],
    damage: raw['sa:damage'] || raw['sa:burstDamage'],
    damageType: raw['sa:damageType'],
    criticalModifier: raw['sa:criticalModifier'],
    size: raw['sa:size'],
    range: raw['sa:rangeMeters'],
    burstDamage: raw['sa:burstDamage'],
    clipSize: raw['sa:clipSize'],
    proficiency: raw['sa:proficiency'],
    armorClass: raw['sa:armorClass'],
    maxDexterity: raw['sa:maxDexterity'],
    damageAbsorption: raw['sa:damageAbsorption'],
    hardness: raw['sa:hardness'],
    category: raw['sa:category'],
    hardpoints: asArray<string>(raw['sa:hardpoints']),
    baseSpeed: raw['sa:baseSpeed'],
    strengthScore: raw['sa:strengthScore'],
    dexterityScore: raw['sa:dexterityScore'],
    charismaModifier: raw['sa:charismaModifier'],
    powerLevel: raw['sa:powerLevel'],
    culture: raw['sa:culture'],
    commonUsage: raw['sa:commonUsage'],
    societalImpact: raw['sa:societalImpact'] || raw['societalImpact'],
    rarity: raw['sa:rarity'],
    legalStatus: raw['sa:legalStatus'],
    origin: raw['sa:origin'] || raw['origin'],
    manufacturer: raw['sa:manufacturer'] || raw['manufacturer'],
    specialProperties: raw['sa:specialProperties']
    };
  };
  
  equipmentOverviewGraph.forEach((group) => {
    asArray<RawEquipment>(group['sa:items']).forEach((raw) => {
      items.push(mapEquipmentItem(raw as RawEquipment & Record<string, any>, group['rdfs:label']));
    });
  });

  // Merge in detailed category files so components receive the complete equipment dataset.
  const detailFiles = [
    '/data/equipment/melee-weapons.json',
    '/data/equipment/ranged-weapons.json',
    '/data/equipment/armor.json',
    '/data/equipment/mechs.json',
    '/data/equipment/WondrousItems.json'
  ];

  const detailGraphs = await Promise.all(
    detailFiles.map((file) => fetchGraphFromFile<any>(file).catch(() => []))
  );

  detailGraphs.flat().forEach((group) => {
    asArray<RawEquipment>(group['sa:items']).forEach((raw) => {
      items.push(mapEquipmentItem(raw as RawEquipment & Record<string, any>, group['rdfs:label']));
    });
  });

  const dedupedItems = new Map<string, Equipment>();
  items.forEach((item) => {
    dedupedItems.set(item.id, item);
  });
  
  return sortByLabel(Array.from(dedupedItems.values()));
}

export async function fetchGeneralFeatures(): Promise<Feature[]> {
  const rawFeatures = await fetchGraphFromFile<RawFeature>('/data/generalfeatures.json');
  return sortByLabel(rawFeatures.map(mapFeature));
}
