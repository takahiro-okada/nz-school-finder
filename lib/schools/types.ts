import type { Feature, MultiPolygon, Polygon } from 'geojson';

export type SchoolRecord = Record<string, unknown>;

export type ZoneFeature = Feature<Polygon | MultiPolygon, Record<string, unknown>>;

export type SchoolTypeConfig = {
  color: string;
  badge: string;
  label: string;
  years: string;
};

export type SchoolTypeGroup = {
  key: string;
  label: string;
  values: string[];
};

export type TileLayerConfig = {
  key: string;
  label: string;
  url: string;
  attribution: string;
};

export type EthnicityField = {
  key: string;
  label: string;
};
