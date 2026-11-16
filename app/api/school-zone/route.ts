import { getCloudflareContext } from '@opennextjs/cloudflare';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolId = url.searchParams.get('school')?.trim();

  if (!schoolId) {
    return Response.json({ error: 'Missing school query parameter.' }, { status: 400 });
  }
  if (!/^\d+$/.test(schoolId)) return Response.json({ schoolZones: [] });

  const pathname = `/data/school-zones/${schoolId}.json`;
  let assets: { fetch(request: Request): Promise<Response> } | undefined;
  try {
    assets = (getCloudflareContext().env as { ASSETS?: typeof assets }).ASSETS;
  } catch {
    // next dev and next start serve the same generated snapshot from public/.
  }

  if (assets) {
    const response = await assets.fetch(new Request(new URL(pathname, url)));
    return response.ok ? response : Response.json({ schoolZones: [] });
  }

  try {
    return new Response(await readFile(join(process.cwd(), 'public', pathname)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return Response.json({ schoolZones: [] });
    }
    throw error;
  }
}
