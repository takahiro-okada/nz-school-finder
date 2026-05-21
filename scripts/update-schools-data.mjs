import { writeFile } from 'node:fs/promises';

const baseUrl = 'https://catalogue.data.govt.nz/api/3/action/datastore_search';
const resourceId = '4b292323-9fcc-41f8-814b-3c7b19cf14b3';
const pageSize = 1000;
const outputPath = new URL('../data/schools.json', import.meta.url);

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

const getUrl = (limit, offset) =>
  `${baseUrl}?resource_id=${encodeURIComponent(resourceId)}&limit=${limit}&offset=${offset}`;

const fetchPayload = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'nz-school-finder-data-update',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${url}`);
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.result) {
    throw new Error(`Invalid datastore response for ${url}`);
  }

  return payload;
};

const firstPayload = await fetchPayload(getUrl(1, 0));
const totalRecords = firstPayload.result.total;
const pageCount = Math.ceil(totalRecords / pageSize);

const pages = await Promise.all(
  Array.from({ length: pageCount }, async (_, index) => {
    const payload = await fetchPayload(getUrl(pageSize, index * pageSize));
    return Array.isArray(payload.result.records) ? payload.result.records : [];
  })
);

const schools = pages
  .flat()
  .filter((record) => String(record?.Status) === 'Open')
  .map((record) => {
    const filtered = {};
    for (const field of allowedFields) {
      if (field in record) {
        filtered[field] = record[field];
      }
    }
    return filtered;
  });

await writeFile(
  outputPath,
  `${JSON.stringify({ schools, total: schools.length, sourceUpdatedAt: new Date().toISOString() }, null, 2)}\n`
);

console.log(`Wrote ${schools.length} open schools to ${outputPath.pathname}`);
