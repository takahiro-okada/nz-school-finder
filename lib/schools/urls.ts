import type { SchoolRecord } from './types';

// Keep URL helpers independent of the catalog so map components can import them.
export function slugify(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getSchoolSlug(school: SchoolRecord) {
  const id = String(school.School_Id ?? school.SchoolId ?? school.SchoolID ?? school.Org_Name ?? '');
  return `${slugify(school.Org_Name)}-${id}`;
}

export type DirectoryState = {
  q: string;
  city: string;
  type: string;
  sort: 'roll-desc' | 'name-asc' | 'city-asc';
  limit: number;
};

export function parseDirectoryState(params: Pick<URLSearchParams, 'get'>): DirectoryState {
  const sort = params.get('sort');
  const limit = Number(params.get('limit'));
  return {
    q: (params.get('q') ?? '').slice(0, 200),
    city: (params.get('city') ?? 'All').slice(0, 200),
    type: (params.get('type') ?? 'All').slice(0, 100),
    sort: sort === 'name-asc' || sort === 'city-asc' ? sort : 'roll-desc',
    limit: Number.isSafeInteger(limit) && limit >= 60 ? Math.min(limit, 10000) : 60,
  };
}

export function getDirectoryHref(state: DirectoryState) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.city !== 'All') params.set('city', state.city);
  if (state.type !== 'All') params.set('type', state.type);
  if (state.sort !== 'roll-desc') params.set('sort', state.sort);
  if (state.limit !== 60) params.set('limit', String(state.limit));
  const query = params.toString();
  return `/schools${query ? `?${query}` : ''}`;
}

// Only reconstruct our directory path and known parameters; never trust a return URL.
export function getDirectoryReturnHref(value: string | string[] | undefined) {
  if (typeof value !== 'string' || !/^\/schools(?:\?|$)/.test(value)) return '/schools';
  return getDirectoryHref(parseDirectoryState(new URLSearchParams(value.split('?')[1])));
}
