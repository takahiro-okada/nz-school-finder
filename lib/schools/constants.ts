import type { SchoolTypeConfig, SchoolTypeGroup, TileLayerConfig } from './types';

export const NZ_CENTER: [number, number] = [-41.2865, 174.7762];
export const DEFAULT_ZOOM = 6;

export const TYPE_CONFIG: Record<string, SchoolTypeConfig> = {
  'Contributing': { color: '#22c55e', badge: 'P', label: 'Contributing Primary', years: 'Yr 1-6' },
  'Full Primary': { color: '#16a34a', badge: 'FP', label: 'Full Primary', years: 'Yr 1-8' },
  'Intermediate': { color: '#f59e0b', badge: 'I', label: 'Intermediate', years: 'Yr 7-8' },
  'Secondary (Year 9-15)': { color: '#6366f1', badge: 'S', label: 'Secondary', years: 'Yr 9-13' },
  'Secondary (Year 7-15)': { color: '#6366f1', badge: 'S', label: 'Secondary', years: 'Yr 7-13' },
  'Secondary (Year 7-10)': { color: '#6366f1', badge: 'S', label: 'Secondary', years: 'Yr 7-10' },
  'Secondary (Year 11-15)': { color: '#6366f1', badge: 'S', label: 'Secondary', years: 'Yr 11-13' },
  'Composite': { color: '#ec4899', badge: 'C', label: 'Composite', years: 'Yr 1-13' },
  'Composite (Year 1-10)': { color: '#ec4899', badge: 'C', label: 'Composite', years: 'Yr 1-10' },
  'Restricted Composite (Year 7-10)': { color: '#ec4899', badge: 'C', label: 'Composite', years: 'Yr 7-10' },
  'Special School': { color: '#94a3b8', badge: 'SP', label: 'Special', years: '' },
  'Specialist School': { color: '#94a3b8', badge: 'SP', label: 'Special', years: '' },
  'Teen Parent Unit': { color: '#94a3b8', badge: 'TP', label: 'Special', years: '' },
  'Activity Centre': { color: '#94a3b8', badge: 'AC', label: 'Special', years: '' },
  'Correspondence School': { color: '#94a3b8', badge: 'CO', label: 'Special', years: '' },
};

export const SCHOOL_TYPE_GROUPS: SchoolTypeGroup[] = [
  { key: 'All', label: 'All', values: [] },
  { key: 'Primary', label: 'Primary', values: ['Full Primary', 'Contributing'] },
  { key: 'Intermediate', label: 'Intermediate', values: ['Intermediate'] },
  { key: 'Secondary', label: 'Secondary', values: ['Secondary (Year 7-10)', 'Secondary (Year 7-15)', 'Secondary (Year 9-15)', 'Secondary (Year 11-15)'] },
  { key: 'Composite', label: 'Composite', values: ['Composite', 'Composite (Year 1-10)', 'Restricted Composite (Year 7-10)'] },
  { key: 'Special', label: 'Special', values: ['Special School', 'Specialist School', 'Teen Parent Unit', 'Activity Centre', 'Correspondence School'] },
];

export const TILE_LAYERS: TileLayerConfig[] = [
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
