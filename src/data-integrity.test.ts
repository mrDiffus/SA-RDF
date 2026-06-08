/**
 * Verifies every entry in resource-index.json:
 *   1. The file exists on disk
 *   2. It parses as valid JSON
 *   3. It has an @graph array with at least one node
 *   4. @graph[0] has a non-empty rdfs:label (used by every page via .toLowerCase() etc.)
 *   5. Type-specific fields that page components depend on are present
 *   6. idToSlug() produces a valid URL segment for routed resources
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { idToSlug } from './slugs';

const DATA_ROOT = join(process.cwd(), 'public/data');

interface ResourceEntry {
  file: string;
  '@type': string;
  'rdfs:label': string;
  '@id': string | null;
}

const { resources } = JSON.parse(
  readFileSync(join(DATA_ROOT, 'resource-index.json'), 'utf-8'),
) as { resources: ResourceEntry[] };

// Fields in @graph[0] that specific page components directly access.
// Adding a field here will catch future breakage if the data schema drifts.
const REQUIRED_NODE_FIELDS: Partial<Record<string, string[]>> = {
  'schema:CreativeWork': ['schema:description'], // PlanetDetailPage
  'sa:Organization': ['sa:description'],          // OrgDetailPage
  'archetype:Archetype': ['archetype:description'], // ArchetypeDetailPage
  'sa:Feature': ['sa:description'],               // FeaturesIndexPage
};

// Resource types that have their own URL route (slug must be valid)
const ROUTED_TYPES = new Set([
  'archetype:Archetype',
  'sa:Race',
  'schema:Person',
  'schema:CreativeWork',
  'schema:Place',
  'sa:Organization',
  'sa:Feature',
  'sa:Curio',
]);

describe('resource-index', () => {
  it('has at least 150 entries', () => {
    expect(resources.length).toBeGreaterThan(150);
  });
});

describe('data file integrity', () => {
  for (const entry of resources) {
    const label = entry['rdfs:label'] ?? entry.file;
    const filePath = join(DATA_ROOT, entry.file);

    it(`[${entry['@type']}] ${label}`, () => {
      // 1. File on disk
      expect(existsSync(filePath), `Missing file: ${entry.file}`).toBe(true);

      // 2. Valid JSON
      let data: Record<string, unknown>;
      expect(() => {
        data = JSON.parse(readFileSync(filePath, 'utf-8'));
      }, `Invalid JSON in ${entry.file}`).not.toThrow();

      // 3. @graph structure
      const graph = (data! as any)['@graph'];
      expect(Array.isArray(graph), `${entry.file}: @graph must be an array`).toBe(true);
      expect((graph as unknown[]).length, `${entry.file}: @graph is empty`).toBeGreaterThan(0);

      // 4. rdfs:label — used by every list/detail page
      const node: Record<string, unknown> = (graph as any[])[0];
      const nodeLabel = node['rdfs:label'];
      expect(
        typeof nodeLabel,
        `${entry.file}: @graph[0]['rdfs:label'] is ${typeof nodeLabel}, expected string`,
      ).toBe('string');
      expect(
        (nodeLabel as string).length,
        `${entry.file}: rdfs:label is empty`,
      ).toBeGreaterThan(0);

      // 5. Type-specific fields required by page components
      for (const field of REQUIRED_NODE_FIELDS[entry['@type']] ?? []) {
        expect(
          node[field],
          `${entry.file}: missing required field "${field}" for type ${entry['@type']}`,
        ).toBeDefined();
      }
    });
  }
});

describe('URL slug validity', () => {
  const routedResources = resources.filter(
    r => r['@id'] && ROUTED_TYPES.has(r['@type']),
  );

  for (const entry of routedResources) {
    it(`idToSlug("${entry['@id']}") → valid slug`, () => {
      const slug = idToSlug(entry['@id']!);
      expect(slug.length, `Empty slug for @id: ${entry['@id']}`).toBeGreaterThan(0);
      expect(slug, `Slug contains "undefined": ${entry['@id']}`).not.toContain('undefined');
      expect(slug, `Slug contains "null": ${entry['@id']}`).not.toContain('null');
    });
  }
});
