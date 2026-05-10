export const revalidate = 3600;

type ApiRecord = Record<string, unknown>;
type DatastorePayload = {
  success?: boolean;
  result?: {
    total?: number;
    records?: ApiRecord[];
  };
};

export async function GET() {
  const baseUrl = 'https://catalogue.data.govt.nz/api/3/action/datastore_search';
  const resourceId = '4b292323-9fcc-41f8-814b-3c7b19cf14b3';

  const getUrl = (limit: number, offset: number) =>
    `${baseUrl}?resource_id=${encodeURIComponent(resourceId)}&limit=${limit}&offset=${offset}`;

  const firstResponse = await fetch(getUrl(1, 0), { cache: 'no-store' });
  if (!firstResponse.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch total count.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const firstPayload = (await firstResponse.json()) as DatastorePayload;
  const firstResult = firstPayload?.result;
  if (!firstPayload?.success || !firstResult || typeof firstResult.total !== 'number') {
    return new Response(JSON.stringify({ error: 'Invalid response from external API.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const totalRecords = firstResult.total;
  const pageSize = 1000;
  const pageCount = Math.ceil(totalRecords / pageSize);

  const fetchPage = async (index: number) => {
    const offset = index * pageSize;
    const response = await fetch(getUrl(pageSize, offset), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch page ${index}`);
    }
    const payload = (await response.json()) as DatastorePayload;
    return payload?.result?.records ?? [];
  };

  const pages = Array.from({ length: pageCount }, (_, index) => fetchPage(index));
  let allRecords: ApiRecord[];

  try {
    const results = await Promise.all(pages);
    allRecords = results.flat();
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch school pages.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedFields = [
    'School_Id',
    'Org_Name',
    'Org_Type',
    'Authority',
    'Add1_City',
    'Latitude',
    'Longitude',
    'Total',
    'European',
    'Māori',
    'Pacific',
    'Asian',
    'MELAA',
    'Other',
    'International',
    'EQi_Index',
    'URL',
    'Status',
  ];

  const schools = allRecords
    .filter((record) => String(record?.Status) === 'Open')
    .map((record) => {
      const filtered: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (field in record) {
          filtered[field] = record[field];
        }
      }
      return filtered;
    });

  return new Response(JSON.stringify({ schools, total: schools.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
