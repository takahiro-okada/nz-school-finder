'use client';

import { useState } from 'react';
import type { RefObject } from 'react';
import type { SchoolFilters, SchoolRecord, SchoolTypeGroup, TileLayerConfig } from '@/lib/schools/types';
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
  labels: {
    title: string;
    placeholder: string;
    clear: string;
    search: string;
    searching: string;
    results: (count: number) => string;
    noResults: string;
  };
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
  labels,
}: SearchPanelProps) {
  return (
    <div ref={searchRef} className="relative">
      <div className="space-y-2">
        <div className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
          {labels.title}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchAddress}
            onChange={(event) => onAddressChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSearch()}
            placeholder={labels.placeholder}
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={searchLoading}
          />
          {searchAddress && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              {labels.clear}
            </button>
          )}
          <button
            type="button"
            onClick={onSearch}
            disabled={searchLoading || !searchAddress.trim()}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:min-w-24 sm:px-4"
          >
            {searchLoading ? labels.searching : labels.search}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute left-0 right-0 z-[2000] mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-60">
          {searchResults.length > 0 ? (
            <div className="space-y-2 p-3">
              <div className="text-sm font-medium text-green-700">
                {labels.results(searchResults.length)}
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
            <div className="p-3 text-sm text-red-700">{labels.noResults}</div>
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
  filters: SchoolFilters;
  cityOptions: string[];
  authorityOptions: string[];
  activeFilterCount: number;
  onFiltersChange: (filters: SchoolFilters) => void;
  onClearFilters: () => void;
  labels: {
    type: string;
    name: string;
    city: string;
    authority: string;
    allCities: string;
    allAuthorities: string;
    minRoll: string;
    maxRoll: string;
    minEqi: string;
    maxEqi: string;
    clear: string;
    more: string;
    less: string;
    active: (count: number) => string;
  };
};

export function FilterPanel({
  title,
  subtitle,
  groups,
  selectedType,
  onSelectType,
  filters,
  cityOptions,
  authorityOptions,
  activeFilterCount,
  onFiltersChange,
  onClearFilters,
  labels,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(activeFilterCount > 0);

  const updateFilter = (key: keyof SchoolFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <>
      <h1 className="mt-4 hidden text-xl font-bold text-slate-900 sm:block">{title}</h1>
      <p className="hidden text-sm text-slate-600 sm:block">{subtitle}</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:block">
            {labels.type}
          </span>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-800">
              {labels.active(activeFilterCount)}
            </span>
          ) : null}
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

        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
          <input
            type="search"
            value={filters.name}
            onChange={(event) => updateFilter('name', event.target.value)}
            placeholder={labels.name}
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {expanded ? labels.less : labels.more}
          </button>
        </div>

        {expanded ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              value={filters.city}
              onChange={(event) => updateFilter('city', event.target.value)}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{labels.allCities}</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              value={filters.authority}
              onChange={(event) => updateFilter('authority', event.target.value)}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{labels.allAuthorities}</option>
              {authorityOptions.map((authority) => (
                <option key={authority} value={authority}>{authority}</option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={filters.minRoll}
              onChange={(event) => updateFilter('minRoll', event.target.value)}
              placeholder={labels.minRoll}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={filters.maxRoll}
              onChange={(event) => updateFilter('maxRoll', event.target.value)}
              placeholder={labels.maxRoll}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={filters.minEqi}
              onChange={(event) => updateFilter('minEqi', event.target.value)}
              placeholder={labels.minEqi}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={filters.maxEqi}
              onChange={(event) => updateFilter('maxEqi', event.target.value)}
              placeholder={labels.maxEqi}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:col-span-2"
            >
              {labels.clear}
            </button>
          </div>
        ) : null}
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
    <div className="absolute bottom-3 right-3 z-[1000] max-w-[calc(100vw-1.5rem)] rounded-lg bg-white/95 p-2 shadow-lg backdrop-blur-sm sm:bottom-6 sm:right-4 lg:bottom-auto lg:top-4 lg:p-4">
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
