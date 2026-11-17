'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import { AdminFetchError, cachedJson, fetchJson } from '@/lib/admin-cache';
import { nf } from '@/components/admin/dashboard/Widgets';

export const PERIODS = [7, 28, 90, 365] as const;
export type Period = (typeof PERIODS)[number];
export const PERIOD_LABELS: Record<Period, string> = { 7: '7 jours', 28: '28 jours', 90: '90 jours', 365: '12 mois' };
export const tooltipStyle = { fontSize: 11, borderRadius: 10, border: '1px solid #e2e8f0' };
export const PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#ef4444', '#06b6d4', '#ec4899', '#64748b', '#84cc16', '#0ea5e9'];

/** The period of the page, kept in the address (?days=28) so a link shows the same view. */
export function usePeriod(): Period {
  const value = Number(useSearchParams()?.get('days'));
  return (PERIODS as readonly number[]).includes(value) ? value as Period : 28;
}

export type CollectionInfo = { firstOwnEvent: string | null; importedRows: number; ownRows: number };

/** Data of a Control Center section, shown at once from the cache then refreshed. */
export function useInsights<T>(section: string) {
  const days = usePeriod();
  const router = useRouter();
  const url = `/api/admin/insights?section=${section}&days=${days}`;
  const [data, setData] = useState<T | null>(() => cachedJson<T>(url) ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchJson<T>(url, 'Impossible de charger le Control Center.'));
    } catch (cause) {
      if (cause instanceof AdminFetchError && (cause.status === 401 || cause.status === 403)) router.replace('/admin/login');
      setError(cause instanceof Error ? cause.message : 'Impossible de charger le Control Center.');
    } finally {
      setLoading(false);
    }
  }, [router, url]);
  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, days, reload: load };
}

/** Says where the figures come from: the site's own collection, and the imported history before it. */
export function DataBanner({ info, configured = true }: { info?: CollectionInfo; configured?: boolean }) {
  if (!configured) {
    return <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"><Info className="mt-0.5 h-4 w-4 shrink-0" />La base du Control Center n’est pas configurée en production : ajoute TURSO_DATABASE_URL et TURSO_AUTH_TOKEN sur Vercel.</p>;
  }
  if (!info) return null;
  const since = info.firstOwnEvent ? new Date(info.firstOwnEvent).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return (
    <p className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-slate-700">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
      <span>
        {since ? <>Mesure propre au site depuis le <strong>{since}</strong> : sans cookie, robots exclus, visiteurs anonymes renouvelés chaque jour.</> : <>La mesure propre au site démarre dès sa mise en ligne.</>}
        {info.importedRows > 0 && <> Avant, les chiffres sont <strong>estimés</strong> à partir des rapports du serveur ({nf.format(info.importedRows)} lignes), robots des centres de données exclus.</>}
      </span>
    </p>
  );
}

export function Sparkline({ data, color }: { data: { day: string; value: number }[]; color: string }) {
  const id = `spark-${color.slice(1)}`;
  return (
    <div className="h-12">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, payload) => String(payload?.[0]?.payload?.day ?? '')} formatter={(value) => [nf.format(Number(value)), '']} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, center, height = 160 }: { data: { name: string; value: number; color: string }[]; center?: string; height?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer>
          <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} isAnimationActive={false}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${nf.format(Number(value))} (${total ? Math.round((Number(value) / total) * 100) : 0} %)`, '']} /></PieChart>
        </ResponsiveContainer>
        {center && <span className="pointer-events-none absolute inset-0 grid place-items-center text-lg font-black text-slate-900">{center}</span>}
      </div>
      <ul className="mt-2 space-y-1 text-[11px]">
        {data.map((item) => <li key={item.name} className="flex justify-between gap-2"><span className="inline-flex min-w-0 items-center gap-1.5 text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} /><span className="truncate">{item.name}</span></span><strong className="shrink-0">{total ? Math.round((item.value / total) * 100) : 0} %</strong></li>)}
        {!total && <li className="text-slate-400">Aucune donnée sur la période.</li>}
      </ul>
    </div>
  );
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Page views by weekday and hour (24 columns), Brazzaville time. Day 0 is Sunday. */
export function HourHeatmap({ cells }: { cells: { day: number; hour: number; views: number }[] }) {
  const grid = DAY_NAMES.map(() => Array.from({ length: 24 }, () => 0));
  for (const cell of cells) grid[(cell.day + 6) % 7][cell.hour] += cell.views;
  const max = Math.max(1, ...grid.flat());
  const shade = (value: number) => value ? `rgba(37, 99, 235, ${0.12 + 0.88 * (value / max)})` : '#f1f5f9';
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-[32px_repeat(24,minmax(0,1fr))] gap-[3px] text-[9px]">
        <span />
        {Array.from({ length: 24 }, (_, hour) => <span key={hour} className="text-center text-slate-400">{hour % 3 === 0 ? `${hour}h` : ''}</span>)}
        {DAY_NAMES.map((day, row) => (
          <div key={day} className="contents">
            <span className="self-center text-[10px] font-semibold text-slate-500">{day}</span>
            {grid[row].map((value, hour) => <span key={hour} title={`${day} ${hour}h–${hour + 1}h : ${nf.format(value)} page(s) vue(s)`} className="h-5 rounded-sm" style={{ background: shade(value) }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export type Candle = { day: string; open: number; close: number; high: number; low: number; peakHour: number };
export type Ohlc = { time: string | number; open: number; high: number; low: number; close: number };

/**
 * Candlestick chart (TradingView lightweight-charts). `time` is a day ("2026-11-04") or a Unix
 * time in seconds; `format` writes the values on the price scale. Green when close > open.
 */
export function OhlcChart({ data, format, height = 300, logScale = false }: { data: Ohlc[]; format: (value: number) => string; height?: number; logScale?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const formatter = useRef(format);
  useEffect(() => { formatter.current = format; });
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let remove: (() => void) | undefined;
    void import('lightweight-charts').then(({ createChart, CandlestickSeries, ColorType, PriceScaleMode }) => {
      if (disposed) return;
      const chart = createChart(element, {
        height,
        layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#64748b', fontSize: 11 },
        grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
        // Logarithmic: a few very slow calls no longer flatten every other candle.
        rightPriceScale: { borderColor: '#e2e8f0', mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal },
        timeScale: { borderColor: '#e2e8f0', timeVisible: typeof data[0]?.time === 'number' },
        localization: { locale: 'fr-FR', priceFormatter: (value: number) => formatter.current(value) },
        autoSize: true,
      });
      const series = chart.addSeries(CandlestickSeries, { upColor: '#16a34a', downColor: '#ef4444', borderVisible: false, wickUpColor: '#16a34a', wickDownColor: '#ef4444' });
      // A log scale cannot place 0: floor every value at 1.
      series.setData(data.map((point) => (logScale
        ? { time: point.time as never, open: Math.max(1, point.open), high: Math.max(1, point.high), low: Math.max(1, point.low), close: Math.max(1, point.close) }
        : { ...point, time: point.time as never })));
      chart.timeScale().fitContent();
      remove = () => chart.remove();
    });
    return () => { disposed = true; remove?.(); };
  }, [data, height, logScale]);
  return <div ref={container} style={{ height }} className="w-full" />;
}

/**
 * One candle per day: open = visitors of the first hour, close = last hour, high = busiest hour,
 * low = quietest. Green when the day ends busier than it began.
 */
export function CandleChart({ candles, height = 300 }: { candles: Candle[]; height?: number }) {
  return <OhlcChart data={candles.map((candle) => ({ time: candle.day, open: candle.open, high: candle.high, low: candle.low, close: candle.close }))} format={(value) => `${Math.round(value)} vis./h`} height={height} />;
}

export const SOURCE_LABELS: Record<string, string> = {
  google: 'Google', facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', whatsapp: 'WhatsApp', x: 'X (Twitter)', youtube: 'YouTube', bing: 'Bing', 'autre-moteur': 'Autres moteurs', direct: 'Accès direct', 'site-referent': 'Sites référents',
};
export const SOURCE_COLORS: Record<string, string> = {
  google: '#2563eb', facebook: '#1877f2', instagram: '#e1306c', linkedin: '#0a66c2', whatsapp: '#25d366', x: '#0f172a', youtube: '#ff0000', bing: '#06b6d4', 'autre-moteur': '#84cc16', direct: '#94a3b8', 'site-referent': '#f59e0b',
};
