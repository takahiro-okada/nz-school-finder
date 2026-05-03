export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Number(searchParams.get('limit')) || 20;
  const offset = Number(searchParams.get('offset')) || 0;

  const params = new URLSearchParams({
    resource_id: '4b292323-9fcc-41f8-814b-3c7b19cf14b3',
    limit: String(limit),
    offset: String(offset),
  });

  if (q.length > 0) {
    params.set('q', q);
  }

  const endpoint = `https://catalogue.data.govt.nz/api/3/action/datastore_search?${params.toString()}`;

  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'NZ education API request failed.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await response.json();
  const result = payload?.result;

  if (!payload?.success || !result) {
    return new Response(JSON.stringify({ error: 'Invalid response from NZ education API.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      schools: Array.isArray(result.records) ? result.records : [],
      total: typeof result.total === 'number' ? result.total : 0,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
