import { describe, expect, it } from 'vitest';
import type { SchoolRecord, ZoneFeature } from '@/lib/schools/types';
import {
  buildSchoolLink,
  displayValue,
  findSchoolsInZoneWithZones,
  formatValue,
  getSchoolId,
} from '@/lib/schools/utils';

describe('school utility formatting', () => {
  it('resolves school ids across known source field variants', () => {
    expect(getSchoolId({ School_Id: 123 })).toBe('123');
    expect(getSchoolId({ SchoolId: '456' })).toBe('456');
    expect(getSchoolId({ SchoolID: 789 })).toBe('789');
    expect(getSchoolId({ Org_Name: 'Fallback School' })).toBe('Fallback School');
  });

  it('formats empty display values with the provided fallback', () => {
    expect(displayValue(null, 'N/A')).toBe('N/A');
    expect(displayValue(undefined, 'N/A')).toBe('N/A');
    expect(displayValue('', 'N/A')).toBe('N/A');
    expect(displayValue(0, 'N/A')).toBe('0');
  });

  it('normalises numeric values for comparisons', () => {
    expect(formatValue('42')).toBe(42);
    expect(formatValue(12.5)).toBe(12.5);
    expect(formatValue('not a number')).toBe(0);
    expect(formatValue(undefined)).toBe(0);
  });

  it('builds education counts links only when an id is available', () => {
    expect(buildSchoolLink({ School_Id: '321' })).toBe(
      'https://www.educationcounts.govt.nz/find-school/school/population/year?school=321'
    );
    expect(buildSchoolLink({ School_Id: ' 321 ' })).toBe(
      'https://www.educationcounts.govt.nz/find-school/school/population/year?school=321'
    );
    expect(buildSchoolLink({ Org_Name: 'No Id School' })).toBeUndefined();
    expect(buildSchoolLink({ School_Id: '   ' })).toBeUndefined();
  });
});

describe('school zone matching', () => {
  const schools: SchoolRecord[] = [
    { School_Id: 101, Org_Name: 'Inside School' },
    { School_Id: 202, Org_Name: 'Outside School' },
  ];

  const squareZone: ZoneFeature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [174.0, -37.0],
        [175.0, -37.0],
        [175.0, -36.0],
        [174.0, -36.0],
        [174.0, -37.0],
      ]],
    },
  };

  const multiPolygonZone: ZoneFeature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[
          [170.0, -45.0],
          [171.0, -45.0],
          [171.0, -44.0],
          [170.0, -44.0],
          [170.0, -45.0],
        ]],
        [[
          [176.0, -39.0],
          [177.0, -39.0],
          [177.0, -38.0],
          [176.0, -38.0],
          [176.0, -39.0],
        ]],
      ],
    },
  };

  it('returns schools whose zone contains the searched point', () => {
    const matches = findSchoolsInZoneWithZones(-36.5, 174.5, schools, {
      '101': [squareZone],
    });

    expect(matches).toEqual([{ School_Id: 101, Org_Name: 'Inside School' }]);
  });

  it('ignores zones that do not contain the searched point', () => {
    const matches = findSchoolsInZoneWithZones(-40.0, 172.0, schools, {
      '101': [squareZone],
    });

    expect(matches).toEqual([]);
  });

  it('matches schools inside MultiPolygon zone features', () => {
    const matches = findSchoolsInZoneWithZones(-38.5, 176.5, schools, {
      '202': [multiPolygonZone],
    });

    expect(matches).toEqual([{ School_Id: 202, Org_Name: 'Outside School' }]);
  });
});
