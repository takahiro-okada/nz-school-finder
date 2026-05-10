import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import zonesDataJson from '@/data/school_zones_by_id.json';
import type { SchoolRecord, ZoneFeature } from './types';

const zonesData = zonesDataJson as Record<string, ZoneFeature[]>;

export const getSchoolId = (school: SchoolRecord) =>
  String(school.School_Id ?? school.SchoolId ?? school.SchoolID ?? school.Org_Name ?? '');

export const displayValue = (value: unknown, fallback = '—') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

export const formatValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const buildSchoolLink = (school: SchoolRecord) => {
  const id = school?.School_Id ?? school?.SchoolId ?? school?.SchoolID;
  return id ? `https://www.educationcounts.govt.nz/find-school/school/population/year?school=${encodeURIComponent(String(id))}` : undefined;
};

export const fetchSchoolZone = async (schoolId: number) => {
  const res = await fetch(`/api/school-zone?school=${encodeURIComponent(String(schoolId))}`);
  if (!res.ok) {
    throw new Error('School zone fetch failed');
  }
  const data = await res.json();
  return Array.isArray(data?.schoolZones) ? data.schoolZones : [];
};

export const geocode = async (address: string) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=nz&format=json&limit=1`,
    { headers: { 'User-Agent': 'nz-school-finder' } }
  );
  const data = await res.json();
  return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
};

export const findSchoolsInZone = (lat: number, lng: number, schools: SchoolRecord[]) => {
  const searchPoint = point([lng, lat]);
  const matchingSchools: SchoolRecord[] = [];

  for (const [schoolId, zones] of Object.entries(zonesData)) {
    if (Array.isArray(zones)) {
      for (const zone of zones) {
        if (zone.geometry && zone.geometry.type === 'Polygon') {
          try {
            if (booleanPointInPolygon(searchPoint, zone)) {
              const school = schools.find((s) =>
                String(s.School_Id ?? s.SchoolId ?? s.SchoolID) === schoolId
              );
              if (school) {
                matchingSchools.push(school);
              }
              break;
            }
          } catch {
            continue;
          }
        }
      }
    }
  }

  return matchingSchools;
};
