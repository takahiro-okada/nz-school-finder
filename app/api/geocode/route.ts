import { siteUrl } from '@/lib/site';

type NominatimResult = {
  lat?: string;
  lon?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query) {
    return Response.json({ error: 'Address query is required.' }, { status: 400 });
  }

  const endpoint = new URL('https://nominatim.openstreetmap.org/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('countrycodes', 'nz');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('limit', '1');

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-NZ,en;q=0.9',
      'User-Agent': `nz-school-finder/1.0 (${siteUrl.toString()})`,
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!response.ok) {
    return Response.json({ error: 'Geocoding request failed.' }, { status: 502 });
  }

  const payload = (await response.json()) as NominatimResult[];
  const firstResult = Array.isArray(payload) ? payload[0] : null;
  const lat = Number(firstResult?.lat);
  const lng = Number(firstResult?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ location: null });
  }

  return Response.json({ location: { lat, lng } });
}
