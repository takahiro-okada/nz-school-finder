# NZ School Finder — Portfolio

## Project Overview

A personal web application that improves upon the UI/UX of New Zealand's official school search service (educationcounts.govt.nz), provided by the Ministry of Education. The app allows users to visually explore over 2,500 schools nationwide on an interactive map.

**GitHub:** [nz-school-finder](https://github.com/your-username/nz-school-finder)
**Demo:** (add after deployment)

---

## Problem Statement

The official site already provides a map view and enrolment zone boundaries, but ethnicity data required navigating to a separate page, making school-to-school comparison cumbersome. The overall UI also felt dated.

This app improves the experience in the following ways:

- **Ethnicity data on the same screen** — breakdown by headcount and percentage shown directly on the map panel, no page navigation required
- **Map and school details side by side** — select a school on the map and instantly see full details including ethnicity composition
- **English / Japanese language switching** — making the tool accessible to NZ's international community
- **Modernised UI** — cleaner layout and faster interactions

---

## Tech Stack

| Category | Technology | Reason |
|----------|------------|--------|
| Framework | Next.js 15 (App Router) | Full-stack with API Routes, no separate backend needed |
| Language | TypeScript | Type-safe data handling |
| Styling | Tailwind CSS | Rapid UI development |
| Map | Leaflet / react-leaflet | Open-source, free, and feature-rich |
| Clustering | react-leaflet-cluster | Efficiently renders 2,500+ markers |
| i18n | next-intl | English / Japanese language switching |
| Data Source | data.govt.nz API | NZ Ministry of Education public API |
| Zone Data | MoE MapInfo → GeoJSON conversion | Official data converted and served locally |

---

## Architecture

```
Browser (React + Leaflet)
    ↓
Next.js API Routes (/app/api/)
    ├── /api/schools/all   → Proxies data.govt.nz API (2,576 schools total)
    └── /api/school-zone   → Serves enrolment zone data from local GeoJSON
```

A full-stack architecture where Next.js API Routes handle all server-side logic, eliminating the need for a separate backend.

---

## Key Technical Challenges & Solutions

### 1. Fetching All Records Efficiently
The data.govt.nz API has a limit of 1,000 records per request. Solved by using `Promise.all` to fire 3 parallel requests and merge the results, fetching all 2,576 schools efficiently.

```typescript
const requests = Array.from({ length: Math.ceil(total / 1000) }, (_, i) =>
  fetch(`...&limit=1000&offset=${i * 1000}`)
)
const results = await Promise.all(requests)
```

### 2. Converting and Compressing Zone Data
The Ministry of Education's enrolment zone data was only available in MapInfo format (.TAB). Converted to GeoJSON using `ogr2ogr`, then reduced the file size from 78MB to 14.8MB by simplifying coordinates with Shapely (`simplify(0.0001)`). Restructured into a SchoolID-keyed dictionary for O(1) lookups.

### 3. Solving CORS Issues
Direct browser requests to educationcounts.govt.nz were blocked by CORS policy. Resolved by routing requests through a Next.js API Route acting as a server-side proxy.

### 4. Map Performance with Clustering
Rendering 2,500+ markers naively caused performance issues. Used `react-leaflet-cluster` with `chunkedLoading: true` for incremental rendering. Implemented zoom-level-based display switching: clusters → individual markers → school name labels.

### 5. Cookie-based i18n
Implemented `next-intl` using a cookie-based locale strategy, avoiding URL locale prefixes (e.g. `/en/...`) to keep clean URLs.

---

## Planned Features

- Search schools by current location (geolocation)
- Filter by Decile range and ethnicity percentage
- Deploy to Vercel
- School reviews / comments (Supabase integration)

---

## What I Learned

- Handling real-world data access challenges: API rate limits, CORS, and Cloudflare bot protection
- Working with GIS data formats (MapInfo / GeoJSON) and coordinate systems (EPSG:2193 → EPSG:4326)
- Full-stack architecture with Next.js App Router
- UX design for efficiently displaying large datasets on a map