'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { GeoJSON, MapContainer, Marker, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { FilterPanel, MapStyleSwitcher, SearchPanel } from '@/components/map/MapControls';
import MapLegend from '@/components/map/MapLegend';
import { MapController, MapZoomHandler } from '@/components/map/MapViewHelpers';
import SchoolDetailsPanel from '@/components/school/SchoolDetailsPanel';
import { DEFAULT_ZOOM, NZ_CENTER, SCHOOL_TYPE_GROUPS, TILE_LAYERS, TYPE_CONFIG } from '@/lib/schools/constants';
import type { SchoolRecord, ZoneFeature } from '@/lib/schools/types';
import { fetchSchoolZone, findSchoolsInZone, formatValue, geocode, getSchoolId } from '@/lib/schools/utils';

const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const LABELS = {
  map: {
    title: 'NZ School Finder',
    subtitle: 'Click a marker to view school details',
    clickPrompt: 'Click a marker on the map',
    loading: 'Loading...',
    totalLocations: (count: number) => `${count} locations`,
  },
  school: {
    decile: 'Decile (EQi Index)',
    totalStudents: 'Total students',
    nationality: 'Nationality',
    total: (count: string) => `Total ${count} students`,
    viewSite: 'View school website →',
    viewYearData: 'View year level data →',
  },
  ethnicity: {
    European: 'European',
    Māori: 'Māori',
    Pacific: 'Pacific',
    Asian: 'Asian',
    MELAA: 'MELAA',
    Other: 'Other',
    International: 'International',
  },
} as const;

export default function SchoolMapClient() {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [boundaryData, setBoundaryData] = useState<ZoneFeature[] | null>(null);
  const [boundaryFound, setBoundaryFound] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedTile, setSelectedTile] = useState<string>('standard');
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SchoolRecord[]>([]);
  const [searchMarker, setSearchMarker] = useState<L.LatLng | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
    if (selectedType === 'All') {
      return schools;
    }

    const group = SCHOOL_TYPE_GROUPS.find((item) => item.key === selectedType);
    if (!group) {
      return schools;
    }

    return schools.filter((school) => group.values.includes(String(school.Org_Type ?? '')));
  }, [schools, selectedType]);

  const selected = useMemo(() => {
    if (!selectedSchool || !filteredSchools.length) {
      return null;
    }

    const selectedId = selectedSchool.School_Id ?? selectedSchool.SchoolId ?? selectedSchool.SchoolID;
    const match = filteredSchools.find((school) =>
      (school.School_Id ?? school.SchoolId ?? school.SchoolID) === selectedId
    );

    return match ? selectedSchool : null;
  }, [filteredSchools, selectedSchool]);

  const selectedTileLayer = useMemo(() => {
    return TILE_LAYERS.find((layer) => layer.key === selectedTile) ?? TILE_LAYERS[0];
  }, [selectedTile]);

  const ethnicityFields = useMemo(() => [
    { key: 'European', label: LABELS.ethnicity.European },
    { key: 'Māori', label: LABELS.ethnicity.Māori },
    { key: 'Pacific', label: LABELS.ethnicity.Pacific },
    { key: 'Asian', label: LABELS.ethnicity.Asian },
    { key: 'MELAA', label: LABELS.ethnicity.MELAA },
    { key: 'Other', label: LABELS.ethnicity.Other },
    { key: 'International', label: LABELS.ethnicity.International },
  ], []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSchools = async () => {
      try {
        const response = await fetch('/api/schools/all', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to fetch school data');
        }

        const data = await response.json();
        setSchools(Array.isArray(data.schools) ? data.schools : []);
      } catch (fetchError) {
        if ((fetchError as { name?: string })?.name !== 'AbortError') {
          setError('An error occurred while loading school data.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
    return () => controller.abort();
  }, []);

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
        <div className="absolute left-3 right-3 top-3 z-[1000] rounded-lg bg-white/95 p-2 shadow-lg backdrop-blur-sm sm:left-4 sm:right-auto sm:w-[min(440px,calc(100vw-2rem))] sm:p-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
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
          />

          <FilterPanel
            title={LABELS.map.title}
            subtitle={LABELS.map.subtitle}
            groups={SCHOOL_TYPE_GROUPS}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        </div>

        <MapStyleSwitcher layers={TILE_LAYERS} selectedTile={selectedTile} onSelectTile={setSelectedTile} />

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-slate-700">
            {LABELS.map.loading}
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
        boundaryFound={boundaryFound}
        ethnicityFields={ethnicityFields}
        labels={{
          totalLocations: LABELS.map.totalLocations(filteredSchools.length),
          clickPrompt: LABELS.map.clickPrompt,
          decile: LABELS.school.decile,
          totalStudents: LABELS.school.totalStudents,
          nationality: LABELS.school.nationality,
          total: LABELS.school.total,
          viewSite: LABELS.school.viewSite,
          viewYearData: LABELS.school.viewYearData,
        }}
      />
    </div>
  );
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
