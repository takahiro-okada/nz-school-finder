'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import type { SchoolRecord, SchoolTypeGroup, TileLayerConfig } from '@/lib/schools/types';
import { displayValue, getSchoolId } from '@/lib/schools/utils';

type SearchPanelProps = {
  searchRef: RefObject<HTMLDivElement | null>;
  searchAddress: string;
  searchLoading: boolean;
  searchOpen: boolean;
  searchResults: SchoolRecord[];
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
  onAddressChange,
  onSearch,
  onClear,
  onSelectSchool,
}: SearchPanelProps) {
  return (
    <div ref={searchRef} className="relative">
      <div className="space-y-2">
        <div className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
          Address Search
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchAddress}
            onChange={(event) => onAddressChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSearch()}
            placeholder="Enter address in New Zealand"
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={searchLoading}
          />
          {searchAddress && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              X
            </button>
          )}
          <button
            type="button"
            onClick={onSearch}
            disabled={searchLoading || !searchAddress.trim()}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:min-w-24 sm:px-4"
          >
            {searchLoading ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute left-0 right-0 z-[2000] mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-60">
          {searchResults.length > 0 ? (
            <div className="space-y-2 p-3">
              <div className="text-sm font-medium text-green-700">
                {searchResults.length} school{searchResults.length > 1 ? 's' : ''} in this zone
              </div>
              <div className="space-y-1">
                {searchResults.map((school) => (
                  <button
                    key={getSchoolId(school)}
                    type="button"
                    onClick={() => onSelectSchool(school)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {displayValue(school.Org_Name, '')}
                  </button>
                ))}
              </div>
            </div>
          ) : !searchLoading ? (
            <div className="p-3 text-sm text-red-700">No school zone found for this address.</div>
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
        <div className="flex gap-2 overflow-x-auto p-1 sm:flex-wrap sm:overflow-visible sm:p-0">
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => onSelectType(group.key)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
      <div className="mt-3 flex gap-3 text-xs text-slate-500">
        <Link className="hover:text-slate-900" href="/about">
          About
        </Link>
        <Link className="hover:text-slate-900" href="/privacy">
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
    <div className="absolute right-3 top-[112px] z-[1000] max-w-[calc(100vw-1.5rem)] rounded-lg bg-white/95 p-2 shadow-lg backdrop-blur-sm sm:right-4 sm:bottom-6 sm:top-auto lg:bottom-auto lg:top-4 lg:p-4">
      <div className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
        Map Style
      </div>
      <div className="flex flex-wrap gap-2">
        {layers.map((layer) => (
          <button
            key={layer.key}
            type="button"
            onClick={() => onSelectTile(layer.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
