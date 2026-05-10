'use client';

import { useEffect } from 'react';
import * as L from 'leaflet';
import { useMap } from 'react-leaflet';

export function MapZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
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

export function MapController({ center, zoom }: { center: L.LatLng; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}
