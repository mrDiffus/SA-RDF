# Check Resources

Two complementary test suites that together catch regressions at the data level and the rendering level.

---

## 1. Data integrity (fast, no server needed)

Validates all 199 resource JSON files on disk without starting a server:
- File exists and parses as valid JSON
- `@graph[0]['rdfs:label']` is a non-empty string (the field used by every page — missing it causes `.toLowerCase()` crashes)
- Type-specific required fields present (e.g. `schema:description` for planets, `sa:description` for orgs)
- `idToSlug()` produces valid URL segments for all routed types

```bash
npm test
```

**When to run:** After editing any file under `public/data/`, or after running `npm run build:index`.

**Extending:** Add new required fields to `REQUIRED_NODE_FIELDS` in [src/data-integrity.test.ts](../src/data-integrity.test.ts):
```typescript
'sa:YourType': ['your:requiredField'],
```

---

## 2. Smoke tests (full render, requires server)

Visits all 326 routes in a headless Chromium browser and checks that each page actually renders without crashing:
- No `TypeError` in the browser console
- A visible `h1` or `h2` heading with non-empty text appears
- Heading does not contain "undefined"

Covers: all static pages, every race, archetype, spell, equipment item, planet, place, organization, org member character, and standalone character.

```bash
npm run test:smoke
```

The server starts automatically if not already running (uses `vite dev` on port 3000). If you already have `npm run dev` open, the existing server is reused.

**When to run:** After any change to a page component or data fetching code. This is what catches `/.toLowerCase() of undefined` style crashes that the file-level test cannot see.

**On failure:** Playwright saves a screenshot and trace for each failing test. View the report:
```bash
npx playwright show-report
```
