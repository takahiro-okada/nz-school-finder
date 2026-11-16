import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Keep the unchanged source snapshot out of the Worker JavaScript bundle.
const source = await readFile('data/school_zones_by_id.json', 'utf8');
const zones = JSON.parse(source);
const directory = 'public/data/school-zones';
await mkdir(directory, { recursive: true });
await writeFile('public/data/school-zones.json', source);
for (const [schoolId, schoolZones] of Object.entries(zones)) {
  if (!/^\d+$/.test(schoolId)) throw new Error('Invalid school ID in zone snapshot');
  await writeFile(join(directory, `${schoolId}.json`), JSON.stringify({ schoolZones }));
}
console.log(`Prepared static zone data for ${Object.keys(zones).length} schools.`);
