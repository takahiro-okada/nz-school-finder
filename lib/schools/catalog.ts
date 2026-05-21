import schoolsData from '@/data/schools.json';
import { SCHOOL_TYPE_GROUPS, TYPE_CONFIG } from './constants';
import type { SchoolRecord } from './types';
import { displayValue, formatValue, getSchoolId } from './utils';

const schools = (Array.isArray(schoolsData.schools) ? schoolsData.schools : []) as SchoolRecord[];

export const ethnicityFields = [
  { key: 'European', label: 'European' },
  { key: 'Māori', label: 'Māori' },
  { key: 'Pacific', label: 'Pacific' },
  { key: 'Asian', label: 'Asian' },
  { key: 'MELAA', label: 'MELAA' },
  { key: 'Other', label: 'Other' },
  { key: 'International', label: 'International' },
];

export function slugify(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getAllSchools() {
  return [...schools].sort((a, b) =>
    displayValue(a.Org_Name, '').localeCompare(displayValue(b.Org_Name, ''), 'en-NZ')
  );
}

export function getSchoolSlug(school: SchoolRecord) {
  return `${slugify(school.Org_Name)}-${getSchoolId(school)}`;
}

export function getSchoolBySlug(slug: string) {
  return schools.find((school) => getSchoolSlug(school) === slug);
}

export function getCityName(school: SchoolRecord) {
  return displayValue(school.Add1_City, 'New Zealand');
}

export function getCitySlug(city: string) {
  return slugify(city);
}

export function getSchoolsByCitySlug(citySlug: string) {
  return getAllSchools().filter((school) => getCitySlug(getCityName(school)) === citySlug);
}

export function getLocationSummaries() {
  const summaries = new Map<string, { city: string; slug: string; count: number; students: number }>();

  for (const school of schools) {
    const city = getCityName(school);
    const slug = getCitySlug(city);
    const existing = summaries.get(slug) ?? { city, slug, count: 0, students: 0 };
    existing.count += 1;
    existing.students += formatValue(school.Total);
    summaries.set(slug, existing);
  }

  return [...summaries.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'en-NZ'));
}

export function getTypeLabel(school: SchoolRecord) {
  const type = displayValue(school.Org_Type, '');
  const config = TYPE_CONFIG[type];
  return config ? `${config.label}${config.years ? ` (${config.years})` : ''}` : displayValue(school.Org_Type);
}

export function getTypeGroupLabel(school: SchoolRecord) {
  const orgType = String(school.Org_Type ?? '');
  return SCHOOL_TYPE_GROUPS.find((group) => group.values.includes(orgType))?.label ?? displayValue(school.Org_Type);
}

export function getTypeCounts(schoolList: SchoolRecord[]) {
  const counts = new Map<string, number>();

  for (const school of schoolList) {
    const label = getTypeGroupLabel(school);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en-NZ'));
}

export function getEthnicityBreakdown(school: SchoolRecord) {
  const total = Math.max(formatValue(school.Total), 0);

  return ethnicityFields
    .map((field) => {
      const value = Math.max(formatValue(school[field.key]), 0);
      return {
        ...field,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      };
    })
    .filter((field) => field.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getStudentTotal(schoolList: SchoolRecord[]) {
  return schoolList.reduce((sum, school) => sum + formatValue(school.Total), 0);
}
