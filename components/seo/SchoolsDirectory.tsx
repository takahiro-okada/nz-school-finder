'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type SchoolDirectoryItem = {
  slug: string;
  name: string;
  city: string;
  type: string;
  typeGroup: string;
  authority: string;
  students: number;
  eqi: string;
};

type SchoolsDirectoryProps = {
  schools: SchoolDirectoryItem[];
  cityOptions: string[];
  typeOptions: string[];
};

type SortKey = 'roll-desc' | 'name-asc' | 'city-asc';

const defaultLimit = 60;

export default function SchoolsDirectory({ schools, cityOptions, typeOptions }: SchoolsDirectoryProps) {
  const [query, setQuery] = useState(() => getInitialSearchParam('q'));
  const [city, setCity] = useState(() => getInitialOption('city', cityOptions));
  const [type, setType] = useState(() => getInitialOption('type', typeOptions));
  const [sort, setSort] = useState<SortKey>('roll-desc');
  const [visibleCount, setVisibleCount] = useState(defaultLimit);

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return schools
      .filter((school) => {
        const matchesQuery = normalizedQuery
          ? [school.name, school.city, school.type, school.authority].some((value) =>
              value.toLowerCase().includes(normalizedQuery)
            )
          : true;
        const matchesCity = city === 'All' || school.city === city;
        const matchesType = type === 'All' || school.typeGroup === type;

        return matchesQuery && matchesCity && matchesType;
      })
      .sort((a, b) => {
        if (sort === 'name-asc') {
          return a.name.localeCompare(b.name, 'en-NZ');
        }
        if (sort === 'city-asc') {
          return a.city.localeCompare(b.city, 'en-NZ') || a.name.localeCompare(b.name, 'en-NZ');
        }
        return b.students - a.students || a.name.localeCompare(b.name, 'en-NZ');
      });
  }, [schools, query, city, type, sort]);

  const visibleSchools = filteredSchools.slice(0, visibleCount);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Browse all schools</h2>
            <p className="mt-1 text-sm text-slate-600">Filter the full directory without leaving the page.</p>
          </div>
          <div className="text-sm font-medium text-slate-500">{schools.length.toLocaleString('en-NZ')} open schools</div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1fr_180px_180px_170px]">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">Search</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(defaultLimit);
            }}
            placeholder="School name, city, type..."
            type="search"
            value={query}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">Location</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(event) => {
              setCity(event.target.value);
              setVisibleCount(defaultLimit);
            }}
            value={city}
          >
            <option>All</option>
            {cityOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">Type</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(event) => {
              setType(event.target.value);
              setVisibleCount(defaultLimit);
            }}
            value={type}
          >
            <option>All</option>
            {typeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">Sort</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(event) => {
              setSort(event.target.value as SortKey);
              setVisibleCount(defaultLimit);
            }}
            value={sort}
          >
            <option value="roll-desc">Largest roll</option>
            <option value="name-asc">School name</option>
            <option value="city-asc">Location</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
        <p className="text-sm text-slate-600">
          Showing {visibleSchools.length.toLocaleString('en-NZ')} of {filteredSchools.length.toLocaleString('en-NZ')} matching schools
        </p>
        {(query || city !== 'All' || type !== 'All') && (
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setQuery('');
              setCity('All');
              setType('All');
              setVisibleCount(defaultLimit);
            }}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-3 px-4 pb-5 sm:px-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleSchools.map((school) => (
          <Link
            className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50"
            href={`/schools/${school.slug}`}
            key={school.slug}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{school.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{school.city} · {school.typeGroup}</p>
              </div>
              <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {school.students.toLocaleString('en-NZ')}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-500">Authority</dt>
                <dd className="mt-1 font-medium text-slate-800">{school.authority}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">EQI</dt>
                <dd className="mt-1 font-medium text-slate-800">{school.eqi}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      {visibleCount < filteredSchools.length && (
        <div className="flex justify-center border-t border-slate-200 px-4 py-5">
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => setVisibleCount((count) => count + defaultLimit)}
            type="button"
          >
            Show more
          </button>
        </div>
      )}
    </section>
  );
}

function getInitialSearchParam(key: string) {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URLSearchParams(window.location.search).get(key) ?? '';
}

function getInitialOption(key: string, options: string[]) {
  if (typeof window === 'undefined') {
    return 'All';
  }

  const value = new URLSearchParams(window.location.search).get(key);
  return value && options.includes(value) ? value : 'All';
}
