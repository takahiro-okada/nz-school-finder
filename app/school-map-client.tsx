'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import LocaleSwitcher from '../components/LocaleSwitcher';

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

const SCHOOL_TYPE_GROUPS = [
  { key: 'All', label: 'All', values: [] },
  { key: 'Primary', label: 'Primary', values: ['Full Primary', 'Contributing'] },
  { key: 'Intermediate', label: 'Intermediate', values: ['Intermediate'] },
  { key: 'Secondary', label: 'Secondary', values: ['Secondary (Year 7-15)', 'Secondary (Year 9-15)'] },
  { key: 'Composite', label: 'Composite', values: ['Composite'] },
  { key: 'Special', label: 'Special', values: ['Special School', 'Teen Parent Unit', 'Activity Centre'] },
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

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

          const pinColor = isSelected ? '#f97316' : '#2563eb';
          const pinBorder = isSelected ? '2px solid #d97706' : '0.5px solid #3b82f6';

          const iconHtml = `
            <div style="display:flex;align-items:center;gap:6px;">
              ${labelHtml}
              <div style="position:relative;display:flex;align-items:flex-end;justify-content:center;width:18px;height:24px;">
                <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:14px;height:14px;background:${pinColor};border:${pinBorder};border-radius:9999px;box-shadow:0 0 0 4px rgba(255,255,255,0.85);"></div>
                <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:4px;height:10px;background:${pinColor};border-radius:9999px 9999px 0 0;"></div>
              </div>
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
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h1 className="text-xl font-bold text-slate-900">{t('map.title')}</h1>
          <p className="text-sm text-slate-600">{t('map.subtitle')}</p>
          <div className="mt-3 bg-white border border-slate-200 rounded-xl p-2">
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
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        </MapContainer>
      </section>

      <aside className="w-[340px] overflow-y-auto bg-white border-l border-slate-200">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t('school.type')}</p>
              <h2 className="text-2xl font-semibold text-slate-950">{selected ? selected.Org_Name : t('map.clickPrompt')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {t('map.totalLocations', { count: filteredSchools.length })}
              </span>
            </div>
          </div>

          {!selected ? (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]">
              <p className="text-slate-600 text-center">{t('map.clickPrompt')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('school.type')}</p>
                  <p className="mt-2 text-base font-medium text-slate-900">{selected.Org_Type ?? '—'} / {selected.Authority ?? '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('school.address')}</p>
                  <p className="mt-2 text-base font-medium text-slate-900">{selected.Add1_City ?? '—'}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('school.decile')}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{selected.EQi_Index ?? '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('school.totalStudents')}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{selected.Total ?? '—'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t('school.nationality')}</p>
                    <p className="text-sm text-slate-500">{t('school.nationalitySubtitle')}</p>
                  </div>
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
