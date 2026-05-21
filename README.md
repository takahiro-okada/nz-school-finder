# NZ School Finder

[![Verify](https://github.com/takahiro-okada/nz-school-finder/actions/workflows/verify.yml/badge.svg)](https://github.com/takahiro-okada/nz-school-finder/actions/workflows/verify.yml)
[![E2E Smoke](https://github.com/takahiro-okada/nz-school-finder/actions/workflows/e2e-smoke.yml/badge.svg)](https://github.com/takahiro-okada/nz-school-finder/actions/workflows/e2e-smoke.yml)

An interactive school search app for New Zealand. It helps users explore schools, enrolment zones, school type filters, and ethnicity breakdowns from a single map-focused interface.

This project is designed as a portfolio piece for New Zealand-based software engineering roles. It demonstrates full-stack Next.js development, real public data integration, map UI implementation, responsive design, and pragmatic handling of GIS-style data.

| Link | Status |
| --- | --- |
| Live demo | Add after deployment |
| GitHub | `https://github.com/your-username/nz-school-finder` |
| Data source | New Zealand public school data via data.govt.nz / Ministry of Education |

## Screenshots

Replace the placeholder image paths after adding screenshots.

| View | Screenshot | Notes |
| --- | --- | --- |
| Desktop map and details | `public/screenshots/desktop-map.png` | Shows the main map, filters, marker clusters, and school details side panel. |
| Mobile map | `public/screenshots/mobile-map.png` | Shows the compact responsive map controls and bottom details sheet. |
| School zone search | `public/screenshots/address-search.png` | Shows address lookup and matching schools within an enrolment zone. |

Suggested markdown once screenshots are added:

```md
| Desktop | Mobile |
| --- | --- |
| ![Desktop map](public/screenshots/desktop-map.png) | ![Mobile map](public/screenshots/mobile-map.png) |
```

## Problem

New Zealand school information is publicly available, but comparing schools can involve jumping between map views, school profile pages, zone boundaries, and demographic data pages. This app brings the key discovery workflow into one interface:

- Find schools visually on a map
- Filter by school type
- Search a New Zealand address and check matching school zones
- View school details without leaving the map
- Compare ethnicity composition with headcount and percentage

## Features

| Feature | Description |
| --- | --- |
| Interactive map | Leaflet map with OpenStreetMap and satellite tile layers. |
| Marker clustering | Handles 2,500+ school markers with clustering and chunked loading. |
| School type filter | Filters primary, intermediate, secondary, composite, and special schools. |
| Address search | Geocodes a NZ address and finds schools whose zone contains the address point. |
| Enrolment zones | Displays school zone boundaries from local GeoJSON data. |
| School details panel | Shows school type, city, authority, roll size, EQI/decile-like value, and ethnicity breakdown. |
| Responsive layout | Desktop uses a side panel; mobile keeps the map primary with a compact bottom sheet. |

## Tech Stack

| Area | Technology | Why |
| --- | --- | --- |
| Framework | Next.js 16 App Router | Full-stack routing, server API routes, and deployment-friendly architecture. |
| Language | TypeScript | Safer handling of external API and GeoJSON-shaped data. |
| UI | React 19 | Component-based interactive UI. |
| Styling | Tailwind CSS 4 | Fast responsive styling without a separate design system. |
| Map | Leaflet / React Leaflet | Mature open-source web mapping stack. |
| Marker clustering | react-leaflet-cluster | Keeps thousands of school markers usable. |
| Geospatial logic | Turf.js | Point-in-polygon checks for address-to-zone matching. |

## Architecture

```txt
Browser
  React + Leaflet UI
      |
      | fetch
      v
Next.js API routes
  /api/schools/all   -> fetches and normalises public school records
  /api/school-zone   -> serves school enrolment zone GeoJSON by school id
      |
      v
External + local data
  data.govt.nz API
  data/school_zones_by_id.json
```

## Project Structure

```txt
app/
  api/
    school-zone/route.ts       School zone API route
    schools/all/route.ts       Public school data proxy route
  school-map-client.tsx        Client-side state and map composition
components/
  map/
    MapControls.tsx            Search, filters, and tile controls
    MapLegend.tsx              Map legend
    MapViewHelpers.tsx         React Leaflet map helper components
  school/
    EthnicityBar.tsx           Ethnicity percentage bar
    SchoolDetailsPanel.tsx     Selected school details UI
lib/
  schools/
    constants.ts               Map defaults, school type config, tile layers
    types.ts                   Shared school and GeoJSON types
    utils.ts                   School formatting, geocoding, zone lookup helpers
data/
  school_zones_by_id.json      Local zone data keyed by school id
```

## Notable Implementation Details

| Challenge | Solution |
| --- | --- |
| External API pagination | Fetches pages from the public data API and merges the records server-side. |
| CORS and data normalisation | Uses Next.js API routes so the browser only talks to this app. |
| Large marker count | Uses marker clustering plus zoom-based labels to keep the map responsive. |
| School zone matching | Converts address search results to a point and checks that point against GeoJSON polygons with Turf.js. |
| Mobile map usability | Keeps controls compact and avoids modal-first interactions so the map remains visible. |

## Getting Started

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env.local` for local configuration.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public URL used for metadata. |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics 4 measurement ID. Analytics is disabled when empty. |

For production domain, analytics, and Search Console setup, see [`docs/production-launch.md`](docs/production-launch.md).

### Data Refresh

The app serves school records from `data/schools.json` so production does not depend on live public API calls at runtime.

```bash
npm run data:update:schools
```

### Quality Checks

```bash
npm run verify
```

For a faster local loop while editing:

```bash
npm run verify:quick
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

## Current Status

| Area | Status |
| --- | --- |
| Core map experience | Done |
| School filtering | Done |
| Address-to-zone search | Done |
| Responsive layout | Done |
| Code organisation | In progress |
| Automated tests | Started |
| CI/CD | Verify and E2E smoke workflows started |
| Production deployment | Live on Vercel |
| Analytics | GA4-ready via `NEXT_PUBLIC_GA_ID` |

## Portfolio Roadmap

| Priority | Task | Why it matters |
| --- | --- | --- |
| High | Add live deployment | Recruiters and hiring managers can try the app immediately. |
| High | Add unit tests for `lib/schools` | Demonstrates confidence around core data and geospatial helpers. |
| High | Add GitHub Actions CI | Shows professional workflow: lint, build, and test on every PR. |
| High | Use AI-ready issue and PR templates | Makes autonomous implementation tasks scoped, reviewable, and verifiable. |
| Medium | Add component tests for school details and filters | Proves UI behaviour around the main user workflows. |
| Medium | Add Playwright smoke tests | Verifies the map page loads and key controls are usable. |
| Medium | Add Storybook for reusable UI pieces | Useful for documenting `SchoolDetailsPanel`, `EthnicityBar`, and filters. |
| Low | Add richer filters | EQI/decile range, city/region, roll size, and ethnicity percentage. |
| Low | Add saved/shareable map state | Makes search results easier to share. |

## What This Project Demonstrates

- Building a full-stack application with Next.js App Router
- Integrating public sector data into a usable product experience
- Working with maps, marker clustering, and GeoJSON boundaries
- Designing responsive UI for dense geospatial data
- Writing maintainable TypeScript around loosely typed external data
- Preparing a codebase for tests, CI, deployment, and portfolio review

## Notes

This is an independent portfolio project and is not affiliated with the New Zealand Ministry of Education. Public school data and zone information should be verified against official sources before being used for enrolment decisions.
