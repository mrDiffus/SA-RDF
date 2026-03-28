export interface Spell {
  id: string;
  label: string;
  castingTime: string;
  description: string;
  duration: string;
  range: string;
  ritual: boolean;
  target: string;
  effect?: string;
  level?: number;
  damage?: string;
  damageType?: string;
  levelScaling?: string;
}

export interface Archetype {
  id: string;
  label: string;
  description: string | string[];
  proficiencies: {
    skills: string[];
    weapons: string[];
    armor: string[];
    saves: string[];
  };
  features: Feature[];
  spellcasting?: string;
  spellLevels?: Record<string, { id: string; label: string }[]>;
}

export interface Feature {
  label: string;
  prerequisites: string[];
  description: string[];
  cost: string;
  benefits?: string[];
}

export interface Race {
  id: string;
  label: string;
  features: {
    label: string;
    description: string[];
  }[];
  relationFeatures?: {
    label: string;
    description: string[];
  }[];
}

export interface Equipment {
  id: string;
  label: string;
  type: string;
  equipmentClass?: string;
  description: string;
  cost?: number;
  weight?: number;
  tags?: string[];
  damage?: string;
  damageType?: string;
  criticalModifier?: string;
  size?: string;
  range?: { normal: number; maximum: number };
  burstDamage?: string;
  clipSize?: string;
  proficiency?: string;
  armorClass?: string | number;
  maxDexterity?: string | number;
  damageAbsorption?: number;
  hardness?: number;
  category?: string;
  hardpoints?: string[];
  baseSpeed?: string | number;
  strengthScore?: number;
  dexterityScore?: number;
  charismaModifier?: number;
  powerLevel?: number;
  culture?: string;
  commonUsage?: string;
  societalImpact?: string;
  rarity?: string;
  legalStatus?: string;
  origin?: string;
  manufacturer?: string;
  specialProperties?: string;
}

export interface RuleSection {
  id: string;
  label: string;
  content: RuleContent[];
}

export type RuleContent = 
  | { type: 'paragraph'; text: string }
  | { type: 'header'; text: string; content: RuleContent[] }
  | { type: 'table'; title: string; headers: string[]; rows: string[][] };

// JSON-LD Raw Interfaces
export interface RawSpell {
  '@id': string;
  'rdfs:label': string;
  'spell:level'?: number;
  'spell:castingtime': string;
  'spell:description': string;
  'spell:duration': string;
  'spell:range': string;
  'spell:ritual': boolean;
  'spell:target': string;
  'sa:damage'?: string;
  'sa:damageType'?: string;
  'sa:levelScaling'?: string;
}

export interface RawArchetype {
  '@id': string;
  'rdfs:label': string;
  'archetype:description': string | string[];
  'archetype:proficiencies': {
    'archetype:Skills'?: any[];
    'archetype:Weapons'?: any[];
    'archetype:Armor'?: any[];
    'archetype:Saves'?: any[];
  };
  'sa:features': RawFeature[];
}

export interface RawFeature {
  'rdfs:label': string;
  'sa:description': string[];
  'sa:cost'?: string;
  'sa:prerequisites'?: string[];
}

export interface RawRace {
  '@id': string;
  'rdfs:label': string;
  'sa:features': RawFeature[];
}

export interface RawRuleSection {
  '@id': string;
  'rdfs:label': string;
  'sa:content': RawRuleContent[];
}

export interface RawRuleContent {
  '@type': string;
  'sa:text'?: string;
  'sa:content'?: RawRuleContent[];
  'sa:headers'?: string[];
  'sa:rows'?: Array<Array<string | number>>;
}

export interface RawEquipment {
  '@type': string;
  'rdfs:label': string;
  'sa:damage'?: string;
  'sa:damageType'?: string;
  'sa:weight'?: number;
  'sa:cost'?: number;
  'sa:description'?: string;
}
