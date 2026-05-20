# Agent Development Harness

This project is intended to be safe for AI-assisted development. Agents should make small, scoped changes and use the commands below to check their work before handing it back.

## Project Shape

- Next.js 16 App Router application.
- TypeScript is strict and uses the `@/*` path alias from the repository root.
- UI text is bilingual. When changing user-facing copy, update both `messages/en.json` and `messages/ja.json`.
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

## Testing Roadmap

Automated tests are not set up yet. When adding the first test harness, prefer this order:

1. Unit tests for `lib/schools` formatting and zone helpers.
2. Component-level tests for filters, details panels, and bilingual labels.
3. Playwright smoke tests for the main map page, school search, and language switching.
4. CI that runs `npm run verify` on pull requests.

For AI-friendly tasks, prefer issues that include a failing test or a precise command/output expectation.
