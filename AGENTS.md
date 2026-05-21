# Agent Development Harness

This project is intended to be safe for AI-assisted development. Agents should make small, scoped changes and use the commands below to check their work before handing it back.

## Project Shape

- Next.js 16 App Router application.
- TypeScript is strict and uses the `@/*` path alias from the repository root.
- UI text is English-only. Keep user-facing copy close to the components that render it unless a broader content structure becomes useful.
- School/domain helpers live in `lib/schools`.
- Map and school UI components live in `components/map` and `components/school`.
- Local enrolment-zone data lives in `data/school_zones_by_id.json`; avoid editing it unless the task is explicitly data-related.

## Standard Commands

Use the fastest command that gives enough confidence for the change:

```bash
npm run verify:quick
```

Run the full local harness before finishing meaningful code changes:

```bash
npm run verify
```

Individual checks:

```bash
npm run test
npm run test:e2e
npm run test:e2e:install
npm run test:e2e:ui
npm run test:watch
npm run typecheck
npm run lint
npm run build
```

Development server:

```bash
npm run dev
```

## Change Guidelines

- Prefer existing components, helpers, constants, and styling patterns before adding new abstractions.
- Keep changes narrowly scoped to the requested behavior.
- Do not introduce new runtime dependencies without a clear reason.
- Do not call live external services from tests; use fixtures or mocks.
- Preserve the map-first product experience. Avoid landing-page patterns for core app work.
- When a change affects filters, school records, zones, or translated labels, check the relevant UI paths as well as the TypeScript/lint/build harness.

## Testing

Unit tests use Vitest and live under `tests/unit`. Keep tests deterministic and avoid live network calls.
E2E smoke tests use Playwright and live under `tests/e2e`. Run them before finishing UI or routing changes, but keep the main `verify` harness focused on typecheck, lint, unit tests, and build.
Before the first local E2E run, install the browser runtime with `npm run test:e2e:install`.

When extending coverage, prefer this order:

1. More unit tests for `lib/schools` formatting, filtering, and zone helpers.
2. Component-level tests for filters, details panels, and dense map controls.
3. More Playwright smoke tests for the main map page, school search, and core controls.
4. Keep GitHub Actions green. The `Verify` workflow runs `npm run verify`; the `E2E Smoke` workflow runs `npm run test:e2e` on pull requests and can also be started manually.

For AI-friendly tasks, prefer issues that include a failing test or a precise command/output expectation.
When creating new implementation issues, use the `AI-ready task` issue template so goals, acceptance criteria, verification, and scope boundaries are explicit.
