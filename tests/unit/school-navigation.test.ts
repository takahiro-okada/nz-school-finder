import { describe, expect, it } from 'vitest';
import { getDirectoryHref, getDirectoryReturnHref, getSchoolSlug, parseDirectoryState } from '@/lib/schools/urls';
import { getNearbySchools } from '@/lib/schools/nearby';

describe('directory navigation state', () => {
  it('round trips search, Unicode city, type, sort, and expanded results', () => {
    const state = { q: 'St Mary & Joseph', city: 'Ōtaki', type: 'Primary', sort: 'name-asc' as const, limit: 120 };
    const href = getDirectoryHref(state);
    expect(parseDirectoryState(new URLSearchParams(href.split('?')[1]))).toEqual(state);
    expect(getDirectoryReturnHref(href)).toBe(href);
  });

  it('uses bounded defaults for invalid sort and result count', () => {
    for (const limit of ['-1', '0', 'abc', 'Infinity', '61.5']) {
      expect(parseDirectoryState(new URLSearchParams({ sort: 'bad', limit })))
        .toMatchObject({ sort: 'roll-desc', limit: 60 });
    }
    expect(parseDirectoryState(new URLSearchParams('limit=999999')).limit).toBe(10000);
    expect(getDirectoryHref(parseDirectoryState(new URLSearchParams()))).toBe('/schools');
  });

  it('rejects external, protocol-relative, and unrelated return paths', () => {
    for (const path of ['https://example.com', '//example.com', '/schools/other', '/schools.evil?q=x', 'javascript:alert(1)', ['/schools']]) {
      expect(getDirectoryReturnHref(path)).toBe('/schools');
    }
    expect(getDirectoryReturnHref('/schools?q=college&unknown=ignored')).toBe('/schools?q=college');
  });

  it('keeps existing school URLs stable for map links', () => {
    expect(getSchoolSlug({ Org_Name: 'Ōtūmoetai College', School_Id: 123 })).toBe('otumoetai-college-123');
    expect(getSchoolSlug({ Org_Name: 'Test School', SchoolID: 7 })).toBe('test-school-7');
  });
});

describe('nearby school navigation', () => {
  const origin = { School_Id: 1, Org_Name: 'Origin', Latitude: -41, Longitude: 174 };
  const near = { School_Id: 2, Org_Name: 'Near', Latitude: -41.01, Longitude: 174 };
  const farther = { School_Id: 3, Org_Name: 'Farther', Latitude: -41.1, Longitude: 174 };

  it('orders by geographic distance, excludes the current school and schools beyond 50 km', () => {
    const result = getNearbySchools(origin, [farther, origin, { ...near, School_Id: 4, Latitude: -45 }, near]);
    expect(result.map((entry) => entry.school.Org_Name)).toEqual(['Near', 'Farther']);
    expect(result[0].distanceKm).toBeCloseTo(1.112, 2);
    expect(getNearbySchools(origin, [farther, near], 1)[0].school).toEqual(near);
  });

  it('skips absent, nonnumeric, and out-of-range coordinates', () => {
    const invalid = [null, '', ' ', 'missing', 91, Infinity].map((lat, i) => ({ ...near, School_Id: i + 4, Latitude: lat }));
    expect(getNearbySchools(origin, invalid)).toEqual([]);
    expect(getNearbySchools({ ...origin, Longitude: undefined }, [near])).toEqual([]);
    expect(getNearbySchools(origin, [{ ...near, Longitude: 181 }])).toEqual([]);
  });
});
