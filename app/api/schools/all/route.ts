import schoolsData from '@/data/schools.json';

export async function GET() {
  const schools = Array.isArray(schoolsData.schools) ? schoolsData.schools : [];

  return new Response(JSON.stringify({ schools, total: schools.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
