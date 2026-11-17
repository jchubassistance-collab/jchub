'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { COUNTRIES } from '@/lib/country-codes';
import { nf } from '@/components/admin/dashboard/Widgets';

type Visitors = { code: string; name: string; visitors: number }[];
type Shape = Feature<Geometry, { name: string }>;

const WIDTH = 800;
const HEIGHT = 400;
const SHADES = ['#dbeafe', '#93c5fd', '#60a5fa', '#2563eb', '#1e40af'];

/**
 * Visitors per country on a world map (world-atlas, Natural Earth 1:110m). The map file is
 * loaded on first display only. Google Analytics gives ISO alpha-2 codes, the map numeric ones:
 * lib/country-codes.ts links them.
 */
export function WorldMap({ countries }: { countries: Visitors }) {
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  const [hover, setHover] = useState<{ name: string; visitors: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void import('world-atlas/countries-110m.json').then((module) => {
      const topology = (module.default ?? module) as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
      const collection = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>;
      if (alive) setShapes(collection.features);
    });
    return () => { alive = false; };
  }, []);

  const byNumeric = useMemo(() => {
    const map = new Map<string, { name: string; visitors: number }>();
    for (const country of countries) {
      const known = COUNTRIES[country.code];
      if (known) map.set(known[0], { name: known[1], visitors: country.visitors });
    }
    return map;
  }, [countries]);

  const max = Math.max(1, ...countries.map((country) => country.visitors));
  // Logarithmic scale: one big country must not wash out all the others.
  const shade = (visitors: number) => SHADES[Math.min(SHADES.length - 1, Math.floor((Math.log(visitors + 1) / Math.log(max + 1)) * SHADES.length))];
  const path = useMemo(() => geoPath(geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: 'Sphere' })), []);
  const ranking = countries.slice(0, 5);
  const total = countries.reduce((sum, country) => sum + country.visitors, 0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Carte des visiteurs par pays">
          <path d={path({ type: 'Sphere' }) ?? ''} fill="#f8fafc" stroke="#e2e8f0" />
          {shapes?.map((shape) => {
            const data = byNumeric.get(String(shape.id));
            return (
              <path
                key={String(shape.id ?? shape.properties.name)}
                d={path(shape) ?? ''}
                fill={data ? shade(data.visitors) : '#e2e8f0'}
                stroke="#fff"
                strokeWidth={0.5}
                onMouseEnter={() => setHover(data ?? { name: shape.properties.name, visitors: 0 })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        {!shapes && <p className="absolute inset-0 grid place-items-center text-xs text-slate-400">Chargement de la carte…</p>}
        {hover && <p className="pointer-events-none absolute left-2 top-2 rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-semibold text-white">{hover.name} : {nf.format(hover.visitors)} visiteur(s)</p>}
      </div>
      <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[11px] sm:grid-cols-2">
        {ranking.map((country, index) => (
          <li key={country.code} className="flex items-center justify-between gap-2">
            <span className="truncate text-slate-600">{index + 1}. {COUNTRIES[country.code]?.[1] ?? country.name}</span>
            <span className="shrink-0 font-bold text-slate-900">{total ? Math.round((country.visitors / total) * 100) : 0} %</span>
          </li>
        ))}
        {!ranking.length && <li className="text-slate-400">Aucune visite mesurée.</li>}
      </ol>
    </div>
  );
}
