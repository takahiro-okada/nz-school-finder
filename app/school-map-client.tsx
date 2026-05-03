'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { GeoJSON, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import LocaleSwitcher from '../components/LocaleSwitcher';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
const zonesData = require('@/data/school_zones_by_id.json') as Record<string, any>;

const NZ_CENTER: [number, number] = [-41.2865, 174.7762];
const DEFAULT_ZOOM = 6;

const nationalityFields = [
  { key: 'European', label: 'European' },
  { key: 'Māori', label: 'Māori' },
  { key: 'Pacific', label: 'Pacific' },
  { key: 'Asian', label: 'Asian' },
  { key: 'MELAA', label: 'MELAA' },
  { key: 'Other', label: 'Other' },
  { key: 'International', label: 'International' },
];

const TYPE_CONFIG: Record<string, { color: string; badge: string; label: string; years: string }> = {
  'Contributing': { color: '#22c55e', badge: 'P', label: 'Contributing Primary', years: 'Yr 1–6' },
  'Full Primary': { color: '#16a34a', badge: 'FP', label: 'Full Primary', years: 'Yr 1–8' },
  'Intermediate': { color: '#f59e0b', badge: 'I', label: 'Intermediate', years: 'Yr 7–8' },
  'Secondary (Year 9-15)': { color: '#6366f1', badge: 'S', label: 'Secondary', years: 'Yr 9–13' },
  'Secondary (Year 7-15)': { color: '#6366f1', badge: 'S', label: 'Secondary', years: 'Yr 7–13' },
  'Composite': { color: '#ec4899', badge: 'C', label: 'Composite', years: 'Yr 1–13' },
  'Special School': { color: '#94a3b8', badge: 'SP', label: 'Special', years: '' },
  'Teen Parent Unit': { color: '#94a3b8', badge: 'TP', label: 'Special', years: '' },
  'Activity Centre': { color: '#94a3b8', badge: 'AC', label: 'Special', years: '' },
};

const SCHOOL_TYPE_GROUPS = [
  { key: 'All', label: 'All', values: [] },
  { key: 'Primary', label: 'Primary', values: ['Full Primary', 'Contributing'] },
  { key: 'Intermediate', label: 'Intermediate', values: ['Intermediate'] },
  { key: 'Secondary', label: 'Secondary', values: ['Secondary (Year 7-15)', 'Secondary (Year 9-15)'] },
  { key: 'Composite', label: 'Composite', values: ['Composite'] },
  { key: 'Special', label: 'Special', values: ['Special School', 'Teen Parent Unit', 'Activity Centre'] },
];

const TILE_LAYERS = [
  {
    key: 'standard',
    label: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    key: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri</a>',
  },
];

const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function buildSchoolLink(school: Record<string, any>) {
  const id = school?.School_Id ?? school?.SchoolId ?? school?.SchoolID;
  return id ? `https://www.educationcounts.govt.nz/find-school/school/population/year?school=${encodeURIComponent(String(id))}` : undefined;
}

function formatValue(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

const fetchSchoolZone = async (schoolId: number) => {
  const res = await fetch(`/api/school-zone?school=${encodeURIComponent(String(schoolId))}`);
  if (!res.ok) {
    throw new Error('School zone fetch failed');
  }
  const data = await res.json();
  return Array.isArray(data?.schoolZones) ? data.schoolZones : [];
};

const geocode = async (address: string) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=nz&format=json&limit=1`,
    { headers: { 'User-Agent': 'nz-school-finder' } }
  );
  const data = await res.json();
  return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
};

const findSchoolsInZone = (lat: number, lng: number, schools: any[]) => {
  const searchPoint = point([lng, lat]);
  const matchingSchools: any[] = [];

  for (const [schoolId, zones] of Object.entries(zonesData as Record<string, any>)) {
    if (Array.isArray(zones)) {
      for (const zone of zones) {
        if (zone.geometry && zone.geometry.type === 'Polygon') {
          try {
            if (booleanPointInPolygon(searchPoint, zone)) {
              const school = schools.find(s =>
                String(s.School_Id ?? s.SchoolId ?? s.SchoolID) === schoolId
              );
              if (school) {
                matchingSchools.push(school);
              }
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
  }

  return matchingSchools;
};

function MapZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleZoomEnd = () => onZoomChange(map.getZoom());

    map.on('zoomend', handleZoomEnd);
    onZoomChange(map.getZoom());

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null;
}

function MapController({ center, zoom }: { center: L.LatLng; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

function EthnicityBar({ label, value, percentage }: { label: string; value: number; percentage: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>{label}</span>
        <span>{`${value}人 (${percentage.toFixed(1)}%)`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function SchoolMapClient() {
  const t = useTranslations();
  const tEthnicity = useTranslations('ethnicity');

  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [boundaryData, setBoundaryData] = useState<any>(null);
  const [boundaryFound, setBoundaryFound] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedTile, setSelectedTile] = useState<string>('standard');
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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

        // 学区内判定
        const matchingSchools = findSchoolsInZone(coords.lat, coords.lng, schools);
        setSearchResults(matchingSchools);
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
    if (!filteredSchools.length) {
      return null;
    }

    if (selectedSchool) {
      const selectedId = selectedSchool.School_Id ?? selectedSchool.SchoolId ?? selectedSchool.SchoolID;
      const match = filteredSchools.find((school) =>
        (school.School_Id ?? school.SchoolId ?? school.SchoolID) === selectedId
      );
      if (match) {
        return selectedSchool;
      }
    }

    return filteredSchools[0] ?? null;
  }, [filteredSchools, selectedSchool]);

  const selectedTileLayer = useMemo(() => {
    return TILE_LAYERS.find((layer) => layer.key === selectedTile) ?? TILE_LAYERS[0];
  }, [selectedTile]);

  const nationalityFields = useMemo(() => [
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
        if ((fetchError as any)?.name !== 'AbortError') {
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
    const controller = new AbortController();
    let isCurrent = true;

    const schoolId = Number(selected?.School_Id ?? selected?.SchoolId ?? selected?.SchoolID);
    if (!schoolId) {
      setBoundaryData(null);
      setBoundaryFound(selected ? false : null);
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
        if ((fetchError as any)?.name !== 'AbortError') {
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

          const icon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [120, 28],
            iconAnchor: [60, 24],
          });

          return { school, position, icon };
        })
        .filter(Boolean) as { school: any; position: [number, number]; icon: L.Icon | L.DivIcon }[],
    [filteredSchools, zoom, selectedSchool]
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <section className="relative flex-1 overflow-hidden bg-white">
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg space-y-4">
          {/* 住所検索バー */}
          <div ref={searchRef} className="relative">
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Address Search</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="Enter address in New Zealand"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={searchLoading}
                />
                {searchAddress && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200"
                  >
                    X
                  </button>
                )}
                <button
                  onClick={handleAddressSearch}
                  disabled={searchLoading || !searchAddress.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {searchLoading ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {searchOpen && (
              <div className="absolute left-0 right-0 mt-2 z-[2000] rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="p-3 space-y-2">
                    <div className="text-sm text-green-700 font-medium">
                      📍 {searchResults.length} school{searchResults.length > 1 ? 's' : ''} in this zone
                    </div>
                    <div className="space-y-1">
                      {searchResults.map((school) => (
                        <button
                          key={school.School_Id ?? school.SchoolId ?? school.SchoolID}
                          onClick={() => {
                            setSelectedSchool(school);
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                          {school.Org_Name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !searchLoading ? (
                  <div className="p-3 text-sm text-red-700">
                    No school zone found for this address.
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-900">{t('map.title')}</h1>
          <p className="text-sm text-slate-600">{t('map.subtitle')}</p>
          <div className="bg-white border border-slate-200 rounded-xl p-2">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Filter</div>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_TYPE_GROUPS.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setSelectedType(group.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedType === group.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Map Style</div>
          <div className="flex flex-wrap gap-2">
            {TILE_LAYERS.map((layer) => (
              <button
                key={layer.key}
                type="button"
                onClick={() => setSelectedTile(layer.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTile === layer.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
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
        <MapContainer center={NZ_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom style={{ height: '100vh', width: '100%' }}>
          <MapZoomHandler onZoomChange={setZoom} />
          {searchMarker && <MapController center={searchMarker} zoom={14} />}
          <TileLayer
            attribution={selectedTileLayer.attribution}
            url={selectedTileLayer.url}
          />
          <MarkerClusterGroup
            chunkedLoading
            disableClusteringAtZoom={13}
          >
            {markers.map(({ school, position, icon }) => (
              <Marker
                key={`${school?.School_Id ?? school?.Org_Name ?? Math.random()}`}
                position={position}
                icon={icon}
                eventHandlers={{ click: () => setSelectedSchool(school) }}
              />
            ))}
          </MarkerClusterGroup>
          {/* 検索結果の赤いマーカー */}
          {searchMarker && (
            <Marker
              position={searchMarker}
              icon={L.divIcon({
                html: '<div style="background:red;border:2px solid white;border-radius:50%;width:16px;height:16px;"></div>',
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          )}
          {boundaryData ? (
            <GeoJSON
              data={boundaryData}
              pathOptions={{
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                color: '#2563eb',
                weight: 2,
              }}
            />
          ) : null}
          {/* 凡例 */}
          <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">Legend</div>
            <div className="space-y-1">
              {SCHOOL_TYPE_GROUPS.slice(1).map((group) => {
                const typeConfig = TYPE_CONFIG[group.values[0]];
                const color = typeConfig?.color ?? '#2563eb';
                const label = typeConfig?.label ?? group.label;
                const years = typeConfig?.years ?? '';
                return (
                  <div key={group.key} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-slate-700">{label}</span>
                    {years && <span className="text-xs text-slate-500">{years}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </MapContainer>
      </section>

      <aside className="w-[340px] overflow-y-auto bg-white border-l border-slate-200">
        <div className="p-6">
          {/* 最上部: 件数 + EN/JP切り替え */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-slate-500">
              {t('map.totalLocations', { count: filteredSchools.length })}
            </span>
            <LocaleSwitcher />
          </div>

          {/* 学校名エリア */}
          {selected ? (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950 mb-2">{selected.Org_Name}</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {(() => {
                    const typeConfig = TYPE_CONFIG[String(selected.Org_Type ?? '')];
                    const typeLabel = typeConfig ? `${typeConfig.label}${typeConfig.years ? ` (${typeConfig.years})` : ''}` : (selected.Org_Type ?? '—');
                    return `${typeLabel} · ${selected.Authority ?? '—'} · ${selected.Add1_City ?? '—'}`;
                  })()}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  boundaryFound === true
                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                    : boundaryFound === false
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {boundaryFound === true
                    ? '学区あり'
                    : boundaryFound === false
                    ? '学区データなし'
                    : '学区確認中'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <p className="text-slate-400 text-center">{t('map.clickPrompt')}</p>
            </div>
          )}

          {selected && (
            <div className="space-y-6">
              {/* Decile と Total students */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{t('school.decile')}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{selected.EQi_Index ?? '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{t('school.totalStudents')}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{selected.Total ?? '—'}</p>
                </div>
              </div>

              {/* Nationality セクション */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{t('school.nationality')}</p>
                  <p className="text-sm text-slate-500">{t('school.total', { count: selected.Total ?? '—' })}</p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const totalPopulation = formatValue(selected.Total) || nationalityFields.reduce((sum, field) => sum + formatValue(selected[field.key]), 0) || 1;
                    return nationalityFields.map((field) => {
                      const value = formatValue(selected[field.key]);
                      const percentage = totalPopulation ? (value / totalPopulation) * 100 : 0;
                      return <EthnicityBar key={field.key} label={field.label} value={value} percentage={percentage} />;
                    });
                  })()}
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <a
                  href={selected.URL ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  {t('school.viewSite')}
                </a>
                {buildSchoolLink(selected) ? (
                  <a
                    href={buildSchoolLink(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    {t('school.viewYearData')}
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
