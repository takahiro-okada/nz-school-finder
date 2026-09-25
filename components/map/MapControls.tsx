'use client';

import { useEffect, useRef, type RefObject } from 'react';
import Link from 'next/link';
import type { SchoolRecord, SchoolTypeGroup, TileLayerConfig } from '@/lib/schools/types';
import { displayValue, getSchoolId } from '@/lib/schools/utils';

export type AddressSearchStatus =
  | 'idle'
  | 'empty'
  | 'loading'
  | 'success'
  | 'location-not-found'
  | 'no-zone'
  | 'error';

type SearchPanelProps = {
  searchRef: RefObject<HTMLDivElement | null>;
  searchAddress: string;
  searchLoading: boolean;
  searchOpen: boolean;
  searchResults: SchoolRecord[];
  searchStatus: AddressSearchStatus;
  onAddressChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onSelectSchool: (school: SchoolRecord) => void;
};

export function SearchPanel({
  searchRef,
  searchAddress,
  searchLoading,
  searchOpen,
  searchResults,
  searchStatus,
  onAddressChange,
  onSearch,
  onClear,
  onSelectSchool,
}: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wasLoadingRef = useRef(false);
  const statusMessage = getSearchStatusMessage(searchStatus, searchResults.length);

  useEffect(() => {
    if (searchLoading) {
      wasLoadingRef.current = true;
      return;
    }

    if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      inputRef.current?.focus();
    }
  }, [searchLoading]);

  const clearSearch = () => {
    onClear();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const retrySearch = () => {
    onSearch();
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="space-y-2">
        <label
          className="sr-only text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:not-sr-only sm:block"
          htmlFor="school-address-search"
        >
          Address Search
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="school-address-search"
            type="text"
            value={searchAddress}
            onChange={(event) => onAddressChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSearch()}
            placeholder="Enter address in New Zealand"
            autoComplete="street-address"
            aria-describedby={searchOpen && searchStatus !== 'idle' ? 'address-search-status' : undefined}
            aria-invalid={searchOpen && (searchStatus === 'empty' || searchStatus === 'location-not-found')}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={searchLoading}
          />
          {searchAddress && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear address search"
              className="min-h-11 min-w-11 shrink-0 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSearch}
            disabled={searchLoading || !searchAddress.trim()}
            className="min-h-11 shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:min-w-24 sm:px-4"
          >
            {searchLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div
          id="address-search-results"
          role="region"
          aria-label="Address search results"
          aria-busy={searchLoading}
          className="absolute left-0 right-0 z-[2000] mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-60"
        >
          <div
            id="address-search-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`p-3 text-sm ${getSearchStatusClass(searchStatus)}`}
          >
            {statusMessage}
          </div>

          {searchStatus === 'success' ? (
            <div className="space-y-2 p-3">
              <div className="space-y-1">
                {searchResults.map((school) => (
                  <button
                    key={getSchoolId(school)}
                    type="button"
                    onClick={() => onSelectSchool(school)}
                    className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset"
                  >
                    {displayValue(school.Org_Name, '')}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {searchStatus === 'error' ? (
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={retrySearch}
                className="min-h-11 rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

type FilterPanelProps = {
  title: string;
  subtitle: string;
  groups: SchoolTypeGroup[];
  selectedType: string;
  onSelectType: (type: string) => void;
};

export function FilterPanel({ title, subtitle, groups, selectedType, onSelectType }: FilterPanelProps) {
  return (
    <>
      <h1 className="mt-4 hidden text-xl font-bold text-slate-900 sm:block">{title}</h1>
      <p className="hidden text-sm text-slate-600 sm:block">{subtitle}</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white sm:rounded-xl sm:p-2">
        <div className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
          Filter
        </div>
        <div
          className="flex gap-2 overflow-x-auto p-1 sm:flex-wrap sm:overflow-visible sm:p-0"
          role="group"
          aria-label="School type filter"
        >
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => onSelectType(group.key)}
              aria-pressed={selectedType === group.key}
              className={`min-h-11 shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                selectedType === group.key
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1 text-xs text-slate-500 sm:mt-3 sm:gap-2">
        <Link className="inline-flex min-h-11 items-center rounded-md px-2 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" href="/schools">
          Schools
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-md px-2 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" href="/about">
          About
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-md px-2 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" href="/privacy">
          Privacy
        </Link>
      </div>
    </>
  );
}

type MapStyleSwitcherProps = {
  layers: TileLayerConfig[];
  selectedTile: string;
  onSelectTile: (tile: string) => void;
};

export function MapStyleSwitcher({ layers, selectedTile, onSelectTile }: MapStyleSwitcherProps) {
  return (
    <div
      className="max-w-full rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur-sm sm:p-4"
      data-testid="map-style-controls"
    >
      <div className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
        Map Style
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Map style">
        {layers.map((layer) => (
          <button
            key={layer.key}
            type="button"
            onClick={() => onSelectTile(layer.key)}
            aria-pressed={selectedTile === layer.key}
            className={`min-h-11 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              selectedTile === layer.key
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getSearchStatusMessage(status: AddressSearchStatus, resultCount: number) {
  switch (status) {
    case 'empty':
      return 'Enter a New Zealand address before searching.';
    case 'loading':
      return 'Searching for this address…';
    case 'success':
      return `${resultCount} school${resultCount === 1 ? '' : 's'} with an enrolment zone covering this location.`;
    case 'location-not-found':
      return 'We could not find that location in New Zealand. Check the address and try again.';
    case 'no-zone':
      return 'We found the location, but it is not inside an enrolment zone in our data.';
    case 'error':
      return 'Address search is temporarily unavailable. Try again.';
    default:
      return '';
  }
}

function getSearchStatusClass(status: AddressSearchStatus) {
  if (status === 'success') return 'font-medium text-emerald-800';
  if (status === 'loading') return 'text-slate-700';
  return 'text-rose-800';
}
