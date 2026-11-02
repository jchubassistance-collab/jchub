'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

/**
 * Charts of the writing space, drawn in SVG. Colours are categorical slots validated together
 * (blue, orange, aqua: CVD and contrast checks pass on white); text never wears them, a mark
 * beside it carries the identity. Every value shown on hover is also in a table or a label.
 */

export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a'] as const;
const GRID = '#e5e9f0';
const AXIS_TEXT = '#64748b';

export const formatNumber = (value: number) => Math.round(value).toLocaleString('fr-FR');
const compact = (value: number) => value >= 10000 ? `${Math.round(value / 1000)} k` : formatNumber(value);

/** Width of an element, followed as it resizes. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    setWidth(Math.floor(element.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Clean axis ticks from 0 to just above `max`. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= raw) || raw;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(Math.round(value * 100) / 100);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks.map((tick) => (step < 1 ? tick : Math.round(tick)));
}

const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const longDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function Legend({ items }: { items: { name: string; color: string; kind?: 'line' | 'box' }[] }) {
  return <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
    {items.map((item) => <li key={item.name} className="flex items-center gap-1.5">
      <span aria-hidden="true" className={item.kind === 'box' ? 'h-2.5 w-2.5 rounded-sm' : 'h-0.5 w-4 rounded-full'} style={{ background: item.color }} />{item.name}
    </li>)}
  </ul>;
}

type LineSeries = { name: string; color: string };

/**
 * Daily values, one line per series, with a crosshair that snaps to the nearest day and a
 * tooltip listing every series (also reachable with the arrow keys). `extra` adds rows to it.
 */
export function LineChart({ dates, series, values, height = 260, label, extra, area = false }: {
  dates: string[];
  series: LineSeries[];
  /** values[seriesIndex][dayIndex] */
  values: number[][];
  height?: number;
  label: string;
  extra?: (index: number) => ReactNode;
  area?: boolean;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const padding = { top: 12, right: 12, bottom: 28, left: 40 };
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...values.flat());
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const x = (index: number) => padding.left + (dates.length <= 1 ? plotWidth / 2 : (index / (dates.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / top) * plotHeight;
  const labelEvery = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor(plotWidth / 64))));

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / Math.max(1, box.width);
    setActive(Math.max(0, Math.min(dates.length - 1, Math.round(ratio * (dates.length - 1)))));
  };
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setActive((current) => Math.max(0, Math.min(dates.length - 1, (current ?? dates.length - 1) + (event.key === 'ArrowRight' ? 1 : -1))));
  };

  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active) - 90, 0), Math.max(0, width - 180));
  return <div ref={wrapRef} className="relative w-full select-none">
    {width > 0 && <svg width={width} height={height} role="img" aria-label={label} tabIndex={0} onKeyDown={onKey} onBlur={() => setActive(null)} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
      {ticks.map((tick) => <g key={tick}>
        <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />
        <text x={padding.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} style={{ fontVariantNumeric: 'tabular-nums' }}>{compact(tick)}</text>
      </g>)}
      {dates.map((date, index) => index % labelEvery === 0 || index === dates.length - 1 ? (index === dates.length - 1 || dates.length - 1 - index > labelEvery * 0.75) && <text key={date} x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === dates.length - 1 ? 'end' : 'middle'} fontSize={11} fill={AXIS_TEXT}>{shortDate(date)}</text> : null)}
      {series.map((item, seriesIndex) => {
        const line = values[seriesIndex].map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join('');
        return <g key={item.name}>
          {area && <path d={`${line}L${x(dates.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={item.color} opacity={0.1} />}
          <path d={line} fill="none" stroke={item.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </g>;
      })}
      {active !== null && <g pointerEvents="none">
        <line x1={x(active)} x2={x(active)} y1={padding.top} y2={padding.top + plotHeight} stroke="#94a3b8" strokeWidth={1} />
        {series.map((item, seriesIndex) => <circle key={item.name} cx={x(active)} cy={y(values[seriesIndex][active])} r={4} fill={item.color} stroke="#fff" strokeWidth={2} />)}
      </g>}
      <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} fill="transparent" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setActive(null)} />
    </svg>}
    {active !== null && <div role="status" className="pointer-events-none absolute top-0 z-10 w-[180px] rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg" style={{ left: tooltipLeft }}>
      <p className="font-medium capitalize text-slate-500">{longDate(dates[active])}</p>
      <ul className="mt-1.5 space-y-1">
        {series.map((item, seriesIndex) => <li key={item.name} className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-slate-500"><span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: item.color }} />{item.name}</span>
          <strong className="text-sm text-slate-900">{formatNumber(values[seriesIndex][active])}</strong>
        </li>)}
        {extra?.(active)}
      </ul>
    </div>}
  </div>;
}

/** A small trend line for a table row: no axes, the last day marked. */
export function Sparkline({ values, color = SERIES[0], width = 96, height = 28, label }: { values: number[]; color?: string; width?: number; height?: number; label: string }) {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (width - 6) / (values.length - 1) : 0;
  const points = values.map((value, index) => [3 + index * step, height - 4 - (value / max) * (height - 8)] as const);
  const line = points.map(([px, py], index) => `${index ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('');
  const last = points[points.length - 1];
  return <svg width={width} height={height} role="img" aria-label={label} className="block shrink-0">
    <line x1={3} x2={width - 3} y1={height - 4} y2={height - 4} stroke={GRID} strokeWidth={1} />
    {points.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
    {last && <circle cx={last[0]} cy={last[1]} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />}
  </svg>;
}

/** Ranked horizontal bars: the label above, the value at the tip. */
export function BarList({ items, color = SERIES[0], format = formatNumber, empty }: { items: { label: string; value: number; href?: string; note?: string }[]; color?: string; format?: (value: number) => string; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-500">{empty}</p>;
  return <ol className="space-y-3">
    {items.map((item) => {
      const name = item.href ? <a href={item.href} className="line-clamp-1 hover:text-blue-700 hover:underline">{item.label}</a> : <span className="line-clamp-1">{item.label}</span>;
      return <li key={item.label}>
        <div className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 text-slate-700">{name}</span><strong className="shrink-0 font-semibold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{format(item.value)}</strong></div>
        <div className="mt-1.5 h-2 rounded-r bg-slate-100"><div className="h-full rounded-r" style={{ width: `${Math.max(1.5, (item.value / max) * 100)}%`, background: color }} /></div>
        {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
      </li>;
    })}
  </ol>;
}

/** One whole split into parts: share printed inside when it fits, legend with every figure below. */
export function SegmentedBar({ parts, label }: { parts: { name: string; value: number }[]; label: string }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const [hover, setHover] = useState<number | null>(null);
  if (!total) return <p className="py-4 text-sm text-slate-500">Pas encore de données sur la période.</p>;
  const share = (value: number) => Math.round((value / total) * 100);
  return <div>
    <div role="img" aria-label={`${label} : ${parts.map((part) => `${part.name} ${share(part.value)} %`).join(', ')}`} className="flex h-7 gap-0.5">
      {parts.map((part, index) => part.value > 0 && <div key={part.name} onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)} title={`${part.name} : ${formatNumber(part.value)} (${share(part.value)} %)`} className="flex items-center overflow-hidden rounded px-2 text-xs font-semibold transition-opacity" style={{ width: `${(part.value / total) * 100}%`, background: SERIES[index % SERIES.length], color: index % SERIES.length === 2 ? '#0f172a' : '#fff', opacity: hover === null || hover === index ? 1 : 0.55 }}>
        {(part.value / total) > 0.14 && `${share(part.value)} %`}
      </div>)}
    </div>
    <ul className="mt-3 space-y-1.5 text-sm">
      {parts.map((part, index) => <li key={part.name} className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-slate-600"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[index % SERIES.length] }} />{part.name}</span>
        <span className="text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}><strong className="font-semibold">{share(part.value)} %</strong><span className="ml-2 text-xs text-slate-500">{formatNumber(part.value)}</span></span>
      </li>)}
    </ul>
  </div>;
}

/** Columns from one baseline, value on the cap of the non-empty ones, tooltip on hover or focus. */
export function ColumnChart({ items, height = 180, label }: { items: { label: string; long: string; value: number }[]; height?: number; label: string }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const padding = { top: 20, bottom: 24 };
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...items.map((item) => item.value));
  const band = width / Math.max(1, items.length);
  const bar = Math.min(24, band * 0.6);
  return <div ref={wrapRef} className="relative w-full">
    {width > 0 && <svg width={width} height={height} role="img" aria-label={label} className="block">
      <line x1={0} x2={width} y1={padding.top + plotHeight} y2={padding.top + plotHeight} stroke={GRID} strokeWidth={1} />
      {items.map((item, index) => {
        const h = (item.value / max) * plotHeight;
        const cx = band * index + band / 2;
        const top = padding.top + plotHeight - h;
        const r = Math.min(4, h);
        return <g key={item.long} tabIndex={0} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onPointerEnter={() => setActive(index)} onPointerLeave={() => setActive(null)} className="outline-none">
          <rect x={band * index} y={padding.top} width={band} height={plotHeight} fill="transparent" />
          {h > 0 && <path d={`M${cx - bar / 2},${padding.top + plotHeight}V${top + r}Q${cx - bar / 2},${top} ${cx - bar / 2 + r},${top}H${cx + bar / 2 - r}Q${cx + bar / 2},${top} ${cx + bar / 2},${top + r}V${padding.top + plotHeight}Z`} fill={SERIES[0]} opacity={active === null || active === index ? 1 : 0.6} />}
          {item.value > 0 && <text x={cx} y={top - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0f172a">{item.value}</text>}
          {(band >= 30 || index % 2 === items.length % 2) && <text x={cx} y={height - 6} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>{item.label}</text>}
        </g>;
      })}
    </svg>}
    {active !== null && <div role="status" className="pointer-events-none absolute top-0 z-10 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg" style={{ left: Math.min(Math.max(band * active + band / 2 - 70, 0), Math.max(0, width - 140)) }}>
      <strong className="text-sm text-slate-900">{items[active].value}</strong> <span className="text-slate-500">article{items[active].value > 1 ? 's' : ''} · {items[active].long}</span>
    </div>}
  </div>;
}

/** Change against the previous period, with a sign and an arrow so it never relies on colour. */
export function Delta({ value, suffix = 'vs période précédente' }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs text-slate-500">Pas de comparaison possible</span>;
  const tone = value > 0 ? 'text-emerald-700' : value < 0 ? 'text-red-600' : 'text-slate-500';
  return <span className="text-xs text-slate-500"><strong className={`font-semibold ${tone}`}>{value > 0 ? '▲ +' : value < 0 ? '▼ ' : ''}{value} %</strong> {suffix}</span>;
}
