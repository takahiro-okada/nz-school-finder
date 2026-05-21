# Production Launch Checklist

Use this checklist when preparing NZ School Finder for real users.

## Recommended Domain

Start with a subdomain:

```txt
schools.dev-oka.com
```

This keeps the app connected to the existing portfolio domain while still making it feel like a standalone product. A subdirectory such as `dev-oka.com/nz-school-finder` is possible, but it usually adds routing, asset path, and hosting complexity for a full-screen Next.js app.

## Vercel Environment Variables

Set these in the Vercel project before promoting the custom domain.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://schools.dev-oka.com` |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID, for example `G-XXXXXXXXXX` |

## Domain Setup

1. Add `schools.dev-oka.com` as a custom domain in the Vercel project.
2. Add the DNS record requested by Vercel at the DNS provider for `dev-oka.com`.
3. Wait for DNS and SSL certificate provisioning to complete.
4. Visit `https://schools.dev-oka.com`, `/about`, `/privacy`, `/robots.txt`, and `/sitemap.xml`.
5. Confirm `NEXT_PUBLIC_SITE_URL` is set before the production deployment used for indexing.

## Analytics Setup

1. Create a GA4 property for NZ School Finder.
2. Add the web data stream URL.
3. Copy the measurement ID into `NEXT_PUBLIC_GA_ID`.
4. Deploy and confirm page views appear in GA Realtime.
5. Trigger these actions once and confirm events appear:
   - Address search
   - School marker selection
   - School type filter change
   - Map style change

The app does not send typed address text to analytics.

## Search Console

1. Add the `schools.dev-oka.com` URL prefix property.
2. Verify ownership using the method that best fits the current DNS/hosting setup.
3. Submit `https://schools.dev-oka.com/sitemap.xml`.
4. Inspect the homepage URL after deployment.

## Pre-Launch Smoke Check

```bash
npm run verify
npm run test:e2e
```

Manual checks:

- The map loads on desktop and mobile.
- Address search input is readable and usable.
- About and Privacy pages are reachable from the map controls.
- `/api/schools/all` returns school records.
- `/robots.txt` references the production sitemap.
