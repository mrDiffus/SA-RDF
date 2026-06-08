/**
 * Smoke tests for all routes in the SA-RDF frontend.
 *
 * Requires a running dev server (npm run dev).
 * The playwright.config.ts will auto-start one if not already running.
 *
 * Run with: npm run test:smoke
 *
 * For each page this checks:
 *   - No TypeError in the browser console (catches ".toLowerCase() on undefined" class bugs)
 *   - A visible heading (h1 or h2) appears with non-empty text (catches blank/crash screens)
 *   - The heading does not contain the word "undefined"
 */

import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_ROOT = join(process.cwd(), 'public/data');

function readJson(relPath: string): any {
  return JSON.parse(readFileSync(join(DATA_ROOT, relPath), 'utf-8'));
}

function idToSlug(id: string): string {
  const colon = id.indexOf(':');
  const afterColon = colon >= 0 ? id.slice(colon + 1) : id;
  const slash = afterColon.lastIndexOf('/');
  const base = slash >= 0 ? afterColon.slice(slash + 1) : afterColon;
  return base.toLowerCase().replace(/\s+/g, '-');
}

// ---------------------------------------------------------------------------
// Route generation — runs synchronously at module load time
// ---------------------------------------------------------------------------

const { resources } = readJson('resource-index.json') as {
  resources: { file: string; '@type': string; 'rdfs:label': string; '@id': string | null }[];
};

type Route = { url: string; label: string };

function collectRoutes(): Route[] {
  const routes: Route[] = [];

  // Static routes
  for (const [url, label] of [
    ['/', 'Home'],
    ['/rules', 'Rules index'],
    ['/races', 'Races index'],
    ['/archetypes', 'Archetypes index'],
    ['/spells', 'Spells index'],
    ['/equipment', 'Equipment index'],
    ['/skills', 'Skills index'],
    ['/features', 'Features index'],
    ['/setting', 'Setting overview'],
    ['/setting/planets', 'Planets index'],
    ['/setting/organizations', 'Organizations index'],
    ['/setting/characters', 'Characters index'],
    ['/changelog', 'Changelog'],
  ] as const) {
    routes.push({ url, label });
  }

  // Races from resource index
  for (const r of resources.filter(r => r['@type'] === 'sa:Race' && r['@id'])) {
    routes.push({ url: `/races/${idToSlug(r['@id']!)}`, label: `Race: ${r['rdfs:label']}` });
  }

  // Archetypes from resource index
  for (const r of resources.filter(r => r['@type'] === 'archetype:Archetype' && r['@id'])) {
    routes.push({ url: `/archetypes/${idToSlug(r['@id']!)}`, label: `Archetype: ${r['rdfs:label']}` });
  }

  // Spells — inline items in spells.json
  try {
    const spellData = readJson('spells.json');
    const spellList = spellData['@graph']?.find((g: any) => g['@id'] === 'sa:spellList');
    for (const spell of spellList?.['sa:items'] ?? []) {
      if (spell['@id']) {
        routes.push({ url: `/spells/${idToSlug(spell['@id'])}`, label: `Spell: ${spell['rdfs:label']}` });
      }
    }
  } catch { /* spells.json missing — skip */ }

  // Equipment — inline items spread across equipment/*.json
  const EQ_DIR = join(DATA_ROOT, 'equipment');
  for (const file of readdirSync(EQ_DIR).filter(f => f.endsWith('.json'))) {
    try {
      const data = readJson(`equipment/${file}`);
      const node = data['@graph']?.[0] ?? data;
      for (const item of node['sa:items'] ?? []) {
        const id: string = item['@id'] ?? item['rdfs:label'];
        if (id) {
          routes.push({ url: `/equipment/${idToSlug(id)}`, label: `Equipment: ${item['rdfs:label']}` });
        }
      }
    } catch { /* skip bad file */ }
  }

  // Planets from resource index (schema:CreativeWork is the planet document type)
  for (const r of resources.filter(r => r['@type'] === 'schema:CreativeWork' && r['@id'])) {
    const slug = idToSlug(r['@id']!);
    routes.push({ url: `/setting/planets/${slug}`, label: `Planet: ${r['rdfs:label']}` });
  }

  // Places — derive planet slug from file path
  for (const r of resources.filter(r => r['@type'] === 'schema:Place' && r['@id'])) {
    const parts = r.file.split('/'); // e.g. Setting/Planets/Arcech/Places/blackwater.json
    const planetFolder = parts[2]?.toLowerCase() ?? 'unknown';
    const placeSlug = idToSlug(r['@id']!);
    routes.push({
      url: `/setting/planets/${planetFolder}/${placeSlug}`,
      label: `Place: ${r['rdfs:label']}`,
    });
  }

  // Organizations
  for (const r of resources.filter(r => r['@type'] === 'sa:Organization' && r['@id'])) {
    const folderName = r.file.split('/')[2];
    if (folderName) {
      routes.push({ url: `/setting/organizations/${folderName}`, label: `Org: ${r['rdfs:label']}` });
    }
  }

  // Org member characters: Setting/Organizations/<Org>/<char>.json
  for (const r of resources.filter(r => r['@type'] === 'schema:Person')) {
    const parts = r.file.split('/');
    if (parts[1] === 'Organizations' && parts.length === 4) {
      const orgFolder = parts[2];
      const charSlug = parts[3].replace('.json', '');
      routes.push({
        url: `/setting/organizations/${orgFolder}/${charSlug}`,
        label: `Org char: ${r['rdfs:label']}`,
      });
    } else if (parts[1] === 'Characters') {
      const charSlug = parts[2].replace('.json', '');
      routes.push({
        url: `/setting/characters/${charSlug}`,
        label: `Standalone char: ${r['rdfs:label']}`,
      });
    }
  }

  return routes;
}

const ALL_ROUTES = collectRoutes();

// ---------------------------------------------------------------------------
// Shared page check
// ---------------------------------------------------------------------------

async function checkPage(page: Page, url: string): Promise<void> {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(url);

  // Wait for data fetching to complete (loading spinners disappear)
  await page.waitForLoadState('networkidle');

  // No TypeErrors — these indicate a crash in component rendering
  const typeErrors = consoleErrors.filter(e => e.includes('TypeError'));
  expect(
    typeErrors,
    `TypeError on ${url}:\n  ${typeErrors.join('\n  ')}`,
  ).toHaveLength(0);

  // A heading must be visible — guards against blank/crash screens
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible({ timeout: 5_000 });

  const headingText = (await heading.textContent()) ?? '';
  expect(
    headingText.trim().length,
    `Empty heading on ${url}`,
  ).toBeGreaterThan(0);

  expect(
    headingText.toLowerCase(),
    `Heading contains "undefined" on ${url}`,
  ).not.toContain('undefined');
}

// ---------------------------------------------------------------------------
// Tests — one per route
// ---------------------------------------------------------------------------

// Deduplicate routes — same URL could appear if resource index has duplicate entries
const UNIQUE_ROUTES = Array.from(
  new Map(ALL_ROUTES.map(r => [r.url, r])).values()
);

for (const { url, label } of UNIQUE_ROUTES) {
  test(`${label} — ${url}`, async ({ page }) => {
    await checkPage(page, url);
  });
}
