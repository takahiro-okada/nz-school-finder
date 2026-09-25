import type { SchoolRecord } from './types';

function coordinates(school: SchoolRecord): [number, number] | null {
  const raw = [school.Latitude, school.Longitude];
  if (raw.some((value) => value == null || String(value).trim() === '')) return null;
  const [lat, lng] = raw.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

export function getNearbySchools(school: SchoolRecord, candidates: SchoolRecord[], limit = 6) {
  const origin = coordinates(school);
  if (!origin) return [];
  const radians = (degrees: number) => degrees * Math.PI / 180;

  return candidates.flatMap((candidate) => {
    if (String(candidate.School_Id) === String(school.School_Id)) return [];
    const location = coordinates(candidate);
    if (!location) return [];
    const a = Math.sin(radians(location[0] - origin[0]) / 2) ** 2
      + Math.cos(radians(origin[0])) * Math.cos(radians(location[0]))
      * Math.sin(radians(location[1] - origin[1]) / 2) ** 2;
    const distanceKm = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
    return distanceKm <= 50 ? [{ school: candidate, distanceKm }] : [];
  }).sort((a, b) => a.distanceKm - b.distanceKm
    || String(a.school.Org_Name).localeCompare(String(b.school.Org_Name), 'en-NZ'))
    .slice(0, limit);
}
