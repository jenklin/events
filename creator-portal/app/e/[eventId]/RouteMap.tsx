'use client';

// One map for the whole day: numbered pins in itinerary order, joined by a
// dashed line, so guests see the sequence of stops and how far apart they are.
// Data-driven: renders config.mapPoints that carry lat/lng (OpenStreetMap
// tiles via Leaflet — no API key). Points without coordinates are still listed.

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface RoutePoint {
  name?: string;
  label?: string;
  address?: string;
  note?: string;
  query?: string;
  queryKo?: string;
  lat?: number;
  lng?: number;
}

const hasCoords = (p: RoutePoint) => typeof p.lat === 'number' && typeof p.lng === 'number';

// Straight-line distance in km (haversine).
function distanceKm(a: RoutePoint, b: RoutePoint) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat! - a.lat!);
  const dLng = toRad(b.lng! - a.lng!);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat!)) * Math.cos(toRad(b.lat!)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function legText(a: RoutePoint, b: RoutePoint) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const km = distanceKm(a, b);
  const dist = km < 1 ? `${Math.round((km * 1000) / 50) * 50} m` : `${km.toFixed(1)} km`;
  // ~4.5 km/h walking, +30% for streets vs. straight line.
  const walkMin = Math.max(1, Math.round(((km * 1.3) / 4.5) * 60));
  return `≈ ${dist} · ~${walkMin} min walk`;
}

export default function RouteMap({ points }: { points: RoutePoint[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const located = points.filter(hasCoords);
    if (!ref.current || located.length === 0) return;
    let map: import('leaflet').Map | undefined;
    let cancelled = false;

    import('leaflet').then((mod) => {
      const L = ((mod as any).default ?? mod) as typeof import('leaflet');
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // SVG stroke attributes can't resolve CSS vars — read the brand colour once.
      // Colour comes from event branding; allow only colour-ish characters
      // since it is interpolated into the marker HTML.
      const raw = getComputedStyle(ref.current).getPropertyValue('--brand-primary').trim();
      const brand = /^[#a-zA-Z0-9(),.%\s-]+$/.test(raw) ? raw : '#8b5cf6';
      const latlngs = located.map((p) => [p.lat!, p.lng!] as [number, number]);
      L.polyline(latlngs, {
        color: brand,
        weight: 4,
        opacity: 0.85,
        dashArray: '8 8',
      }).addTo(map);

      points.forEach((p, i) => {
        if (!hasCoords(p)) return;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:9999px;background:${brand};color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">${i + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([p.lat!, p.lng!], { icon, title: p.name }).addTo(map!);
        const tip = document.createElement('div');
        tip.textContent = `${i + 1}. ${p.name || p.query || ''}`;
        marker.bindTooltip(tip, { direction: 'top', offset: [0, -16] });
      });

      map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36], maxZoom: 16 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  if (!points.some(hasCoords)) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 isolate">
      <div ref={ref} className="w-full h-72 md:h-96" role="img" aria-label="Map of the day's stops in order" />
    </div>
  );
}
