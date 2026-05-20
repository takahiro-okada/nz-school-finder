'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { GeoJSON, MapContainer, Marker, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { FilterPanel, MapStyleSwitcher, SearchPanel } from '@/components/map/MapControls';
import MapLegend from '@/components/map/MapLegend';
import { MapController, MapZoomHandler } from '@/components/map/MapViewHelpers';
import SchoolDetailsPanel from '@/components/school/SchoolDetailsPanel';
import { DEFAULT_ZOOM, NZ_CENTER, SCHOOL_TYPE_GROUPS, TILE_LAYERS, TYPE_CONFIG } from '@/lib/schools/constants';
import type { SchoolFilters, SchoolRecord, ZoneFeature } from '@/lib/schools/types';
import { fetchSchoolZone, findSchoolsInZone, formatValue, geocode, getSchoolId } from '@/lib/schools/utils';

const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const DEFAULT_FILTERS: SchoolFilters = {
  name: '',
  city: '',
  authority: '',
  minRoll: '',
  maxRoll: '',
  minEqi: '',
  maxEqi: '',
};

const getSearchParams = () => (
  typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
);

const getInitialSelectedType = () => {
  const type = getSearchParams().get('type');
  return type && SCHOOL_TYPE_GROUPS.some((group) => group.key === type) ? type : 'All';
};

const getInitialTile = () => {
  const tile = getSearchParams().get('tile');
  return tile && TILE_LAYERS.some((layer) => layer.key === tile) ? tile : 'standard';
};

const getInitialFilters = (): SchoolFilters => {
  const params = getSearchParams();
  return {
    name: params.get('q') ?? '',
    city: params.get('city') ?? '',
    authority: params.get('authority') ?? '',
    minRoll: params.get('rollMin') ?? '',
    maxRoll: params.get('rollMax') ?? '',
    minEqi: params.get('eqiMin') ?? '',
    maxEqi: params.get('eqiMax') ?? '',
  };
};

export default function SchoolMapClient() {
  const t = useTranslations();
  const tEthnicity = useTranslations('ethnicity');

  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null);
  const [selectedType, setSelectedType] = useState<string>(getInitialSelectedType);
  const [filters, setFilters] = useState<SchoolFilters>(getInitialFilters);
  const [compareIds, setCompareIds] = useState<string[]>(() => getSearchParams().get('compare')?.split(',').filter(Boolean).slice(0, 4) ?? []);
  const [boundaryData, setBoundaryData] = useState<ZoneFeature[] | null>(null);
  const [boundaryFound, setBoundaryFound] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedTile, setSelectedTile] = useState<string>(getInitialTile);
  const [searchAddress, setSearchAddress] = useState<string>(() => getSearchParams().get('address') ?? '');
  const [searchResults, setSearchResults] = useState<SchoolRecord[]>([]);
  const [searchMarker, setSearchMarker] = useState<L.LatLng | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingSelectedId] = useState<string>(() => getSearchParams().get('school') ?? '');
  const searchRef = useRef<HTMLDivElement | null>(null);

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    setSearchLoading(true);
    setSearchResults([]);
    setSearchMarker(null);

    try {
      const coords = await geocode(searchAddress.trim());
      if (coords) {
        const latLng = L.latLng(coords.lat, coords.lng);
        setSearchMarker(latLng);
        setSearchResults(findSchoolsInZone(coords.lat, coords.lng, schools));
      } else {
        setSearchResults([]);
        setSearchMarker(null);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
      setSearchMarker(null);
    } finally {
      setSearchLoading(false);
      setSearchOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchAddress('');
    setSearchResults([]);
    setSearchMarker(null);
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSchools = useMemo(() => {
    const group = SCHOOL_TYPE_GROUPS.find((item) => item.key === selectedType);
    const minRoll = parseFilterNumber(filters.minRoll);
    const maxRoll = parseFilterNumber(filters.maxRoll);
    const minEqi = parseFilterNumber(filters.minEqi);
    const maxEqi = parseFilterNumber(filters.maxEqi);
    const nameQuery = filters.name.trim().toLocaleLowerCase();

    return schools.filter((school) => {
      const schoolType = String(school.Org_Type ?? '');
      const schoolName = String(school.Org_Name ?? '').toLocaleLowerCase();
      const city = String(school.Add1_City ?? '');
      const authority = String(school.Authority ?? '');
      const roll = formatValue(school.Total);
      const eqi = formatValue(school.EQi_Index);

      if (group && group.key !== 'All' && !group.values.includes(schoolType)) return false;
      if (nameQuery && !schoolName.includes(nameQuery)) return false;
      if (filters.city && city !== filters.city) return false;
      if (filters.authority && authority !== filters.authority) return false;
      if (minRoll !== null && roll < minRoll) return false;
      if (maxRoll !== null && roll > maxRoll) return false;
      if (minEqi !== null && eqi < minEqi) return false;
      if (maxEqi !== null && eqi > maxEqi) return false;

      return true;
    });
  }, [schools, selectedType, filters]);

  const cityOptions = useMemo(() => buildOptions(schools, 'Add1_City'), [schools]);
  const authorityOptions = useMemo(() => buildOptions(schools, 'Authority'), [schools]);

  const compareSchools = useMemo(() => {
    const byId = new Map(schools.map((school) => [getSchoolId(school), school]));
    return compareIds.map((id) => byId.get(id)).filter(Boolean) as SchoolRecord[];
  }, [schools, compareIds]);

  const activeFilterCount = useMemo(() => {
    return [
      selectedType !== 'All',
      filters.name.trim(),
      filters.city,
      filters.authority,
      filters.minRoll,
      filters.maxRoll,
      filters.minEqi,
      filters.maxEqi,
    ].filter(Boolean).length;
  }, [filters, selectedType]);

  const selected = useMemo(() => {
    const candidate = selectedSchool ?? schools.find((school) => getSchoolId(school) === pendingSelectedId) ?? null;

    if (!candidate || !filteredSchools.length) {
      return null;
    }

    const selectedId = getSchoolId(candidate);
    const match = filteredSchools.find((school) => getSchoolId(school) === selectedId);

    return match ? candidate : null;
  }, [filteredSchools, pendingSelectedId, schools, selectedSchool]);

  const selectedTileLayer = useMemo(() => {
    return TILE_LAYERS.find((layer) => layer.key === selectedTile) ?? TILE_LAYERS[0];
  }, [selectedTile]);

  const ethnicityFields = useMemo(() => [
    { key: 'European', label: tEthnicity('European') },
    { key: 'Māori', label: tEthnicity('Māori') },
    { key: 'Pacific', label: tEthnicity('Pacific') },
    { key: 'Asian', label: tEthnicity('Asian') },
    { key: 'MELAA', label: tEthnicity('MELAA') },
    { key: 'Other', label: tEthnicity('Other') },
    { key: 'International', label: tEthnicity('International') },
  ], [tEthnicity]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSchools = async () => {
      try {
        const response = await fetch('/api/schools/all', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('学校データの取得に失敗しました');
        }

        const data = await response.json();
        setSchools(Array.isArray(data.schools) ? data.schools : []);
      } catch (fetchError) {
        if ((fetchError as { name?: string })?.name !== 'AbortError') {
          setError('学校データの取得時にエラーが発生しました。');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    const selectedId = selectedSchool ? getSchoolId(selectedSchool) : pendingSelectedId;

    if (selectedType !== 'All') params.set('type', selectedType);
    if (filters.name.trim()) params.set('q', filters.name.trim());
    if (filters.city) params.set('city', filters.city);
    if (filters.authority) params.set('authority', filters.authority);
    if (filters.minRoll) params.set('rollMin', filters.minRoll);
    if (filters.maxRoll) params.set('rollMax', filters.maxRoll);
    if (filters.minEqi) params.set('eqiMin', filters.minEqi);
    if (filters.maxEqi) params.set('eqiMax', filters.maxEqi);
    if (selectedTile !== 'standard') params.set('tile', selectedTile);
    if (searchAddress.trim()) params.set('address', searchAddress.trim());
    if (selectedId) params.set('school', selectedId);
    if (compareIds.length) params.set('compare', compareIds.join(','));

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [compareIds, filters, pendingSelectedId, searchAddress, selectedSchool, selectedTile, selectedType]);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    const schoolId = Number(selected?.School_Id ?? selected?.SchoolId ?? selected?.SchoolID);
    if (!schoolId) {
      queueMicrotask(() => {
        setBoundaryData(null);
        setBoundaryFound(selected ? false : null);
      });
      return;
    }

    const fetchBoundary = async () => {
      setBoundaryData(null);
      setBoundaryFound(null);

      try {
        const schoolZones = await fetchSchoolZone(schoolId);
        if (!isCurrent) return;

        if (schoolZones.length > 0) {
          setBoundaryData(schoolZones);
          setBoundaryFound(true);
        } else {
          setBoundaryData(null);
          setBoundaryFound(false);
        }
      } catch (fetchError) {
        if ((fetchError as { name?: string })?.name !== 'AbortError') {
          setBoundaryData(null);
          setBoundaryFound(false);
        }
      }
    };

    fetchBoundary();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [selected]);

  const markers = useMemo(
    () =>
      filteredSchools
        .map((school) => {
          const latitude = formatValue(school.Latitude ?? school.latitude ?? school.Lat);
          const longitude = formatValue(school.Longitude ?? school.longitude ?? school.Lon);
          if (!latitude || !longitude) {
            return null;
          }

          const position: [number, number] = [latitude, longitude];
          const isSelected = Boolean(
            selectedSchool &&
            (selectedSchool.School_Id ?? selectedSchool.SchoolId ?? selectedSchool.SchoolID) ===
              (school.School_Id ?? school.SchoolId ?? school.SchoolID)
          );
          const icon = createSchoolIcon(school, isSelected, zoom);

          return { school, position, icon };
        })
        .filter(Boolean) as { school: SchoolRecord; position: [number, number]; icon: L.DivIcon }[],
    [filteredSchools, zoom, selectedSchool]
  );

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-white lg:flex-row">
      <section className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <div className="absolute left-3 right-3 top-3 z-[1000] rounded-lg bg-white/95 p-2 shadow-lg backdrop-blur-sm sm:left-4 sm:right-auto sm:w-[min(440px,calc(100vw-2rem))] sm:p-3 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
          <SearchPanel
            searchRef={searchRef}
            searchAddress={searchAddress}
            searchLoading={searchLoading}
            searchOpen={searchOpen}
            searchResults={searchResults}
            onAddressChange={setSearchAddress}
            onSearch={handleAddressSearch}
            onClear={clearSearch}
            onSelectSchool={(school) => {
              setSelectedSchool(school);
              setSearchOpen(false);
            }}
            labels={{
              title: t('search.title'),
              placeholder: t('search.placeholder'),
              clear: t('search.clear'),
              search: t('search.search'),
              searching: t('search.searching'),
              results: (count) => t('search.results', { count }),
              noResults: t('search.noResults'),
            }}
          />

          <FilterPanel
            title={t('map.title')}
            subtitle={t('map.subtitle')}
            groups={SCHOOL_TYPE_GROUPS}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            filters={filters}
            cityOptions={cityOptions}
            authorityOptions={authorityOptions}
            activeFilterCount={activeFilterCount}
            onFiltersChange={setFilters}
            onClearFilters={() => {
              setSelectedType('All');
              setFilters(DEFAULT_FILTERS);
            }}
            labels={{
              type: t('filters.type'),
              name: t('filters.name'),
              city: t('filters.city'),
              authority: t('filters.authority'),
              allCities: t('filters.allCities'),
              allAuthorities: t('filters.allAuthorities'),
              minRoll: t('filters.minRoll'),
              maxRoll: t('filters.maxRoll'),
              minEqi: t('filters.minEqi'),
              maxEqi: t('filters.maxEqi'),
              clear: t('filters.clear'),
              more: t('filters.more'),
              less: t('filters.less'),
              active: (count) => t('filters.active', { count }),
            }}
          />
        </div>

        <MapStyleSwitcher layers={TILE_LAYERS} selectedTile={selectedTile} onSelectTile={setSelectedTile} />

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-slate-700">
            {t('map.loading')}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-rose-50 text-rose-700">
            {error}
          </div>
        )}

        <MapContainer center={NZ_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
          <MapZoomHandler onZoomChange={setZoom} />
          {searchMarker && <MapController center={searchMarker} zoom={14} />}
          <TileLayer attribution={selectedTileLayer.attribution} url={selectedTileLayer.url} />
          <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={13}>
            {markers.map(({ school, position, icon }) => (
              <Marker
                key={`${getSchoolId(school) || position.join(',')}`}
                position={position}
                icon={icon}
                eventHandlers={{ click: () => setSelectedSchool(school) }}
              />
            ))}
          </MarkerClusterGroup>
          {searchMarker && <Marker position={searchMarker} icon={createSearchMarkerIcon()} />}
          {boundaryData ? (
            <GeoJSON
              data={boundaryData as never}
              pathOptions={{
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                color: '#2563eb',
                weight: 2,
              }}
            />
          ) : null}
          <MapLegend />
        </MapContainer>
      </section>

      <SchoolDetailsPanel
        selected={selected}
        compareSchools={compareSchools}
        boundaryFound={boundaryFound}
        ethnicityFields={ethnicityFields}
        onAddCompare={(school) => {
          const schoolId = getSchoolId(school);
          setCompareIds((current) => current.includes(schoolId) || current.length >= 4 ? current : [...current, schoolId]);
        }}
        onRemoveCompare={(schoolId) => setCompareIds((current) => current.filter((id) => id !== schoolId))}
        onSelectCompare={setSelectedSchool}
        onClearCompare={() => setCompareIds([])}
        labels={{
          totalLocations: t('map.totalLocations', { count: filteredSchools.length }),
          clickPrompt: t('map.clickPrompt'),
          decile: t('school.decile'),
          totalStudents: t('school.totalStudents'),
          nationality: t('school.nationality'),
          total: (count) => t('school.total', { count }),
          viewSite: t('school.viewSite'),
          viewYearData: t('school.viewYearData'),
          compare: t('compare.title'),
          addCompare: t('compare.add'),
          removeCompare: t('compare.remove'),
          clearCompare: t('compare.clear'),
          compareEmpty: t('compare.empty'),
          compareLimit: t('compare.limit'),
          city: t('compare.city'),
          authority: t('compare.authority'),
          type: t('compare.type'),
        }}
      />
    </div>
  );
}

function parseFilterNumber(value: string) {
  if (!value.trim()) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function buildOptions(schools: SchoolRecord[], key: keyof SchoolRecord) {
  return Array.from(new Set(
    schools
      .map((school) => String(school[key] ?? '').trim())
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
}

function createSchoolIcon(school: SchoolRecord, isSelected: boolean, zoom: number) {
  const labelText = zoom >= 14
    ? String(school.Org_Name ?? '').length > 15
      ? `${String(school.Org_Name ?? '').slice(0, 15)}...`
      : String(school.Org_Name ?? '')
    : zoom >= 12
    ? String(school.Org_Type ?? '')
    : '';

  const labelHtml = labelText
    ? `<div style="background:white;color:#1a1a1a;font-size:11px;padding:2px 6px;border-radius:4px;border:0.5px solid #ccc;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;line-height:1.2;">${labelText}</div>`
    : '';

  const typeConfig = TYPE_CONFIG[String(school.Org_Type ?? '')];
  const badgeText = typeConfig?.badge ?? '';
  const pinColor = isSelected ? '#f97316' : typeConfig?.color ?? '#2563eb';
  const pinBorder = isSelected ? '2px solid #d97706' : `0.5px solid ${pinColor}`;

  const iconHtml = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      ${labelHtml}
      <div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${pinColor};border:${pinBorder};box-shadow:0 0 0 4px rgba(255,255,255,0.85);">
        <span style="font-size:8px;font-weight:bold;color:white;line-height:1;">${badgeText}</span>
      </div>
      <div style="width:4px;height:10px;background:${pinColor};border-radius:9999px;"></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [120, 28],
    iconAnchor: [60, 24],
  });
}

function createSearchMarkerIcon() {
  return L.divIcon({
    html: '<div style="background:red;border:2px solid white;border-radius:50%;width:16px;height:16px;"></div>',
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
