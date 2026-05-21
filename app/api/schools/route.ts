import schoolsData from '@/data/schools.json';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Number(searchParams.get('limit')) || 20;
  const offset = Number(searchParams.get('offset')) || 0;

  const allSchools = Array.isArray(schoolsData.schools) ? schoolsData.schools : [];
  const query = q.toLowerCase();
  const matchingSchools = query
    ? allSchools.filter((school) =>
        [
          school.Org_Name,
          school.Add1_City,
          school.Org_Type,
          school.Authority,
        ].some((value) => String(value ?? '').toLowerCase().includes(query))
      )
    : allSchools;

  return new Response(
    JSON.stringify({
      schools: matchingSchools.slice(offset, offset + limit),
      total: matchingSchools.length,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
