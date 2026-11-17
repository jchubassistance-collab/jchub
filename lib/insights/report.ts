import 'server-only';

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { query } from '@/lib/insights/db';
import { audienceBreakdown, audienceTotals, dailyAudience, num, sources, toolStats, type Range } from '@/lib/insights/queries';
import { apiHealth, conversionStats } from '@/lib/insights/queries-batch2';
import { blogStats } from '@/lib/insights/sections';
import { searchConsoleSummary, type SeoSummary } from '@/lib/insights/search-console';
import { recentAlerts } from '@/lib/alerts/server';
import { percentChange } from '@/lib/dashboard-health';
import { COUNTRIES } from '@/lib/country-codes';
import { tools } from '@/lib/tools';
import { monthLabel, monthRange, pdfText, toCsv, weekLabel, weekRange, type CsvColumn } from '@/lib/insights/report-format';
import { sendEmail } from '@/lib/alerts/channels';
import { downloadName } from '@/lib/download-name';

/**
 * The Control Center report (Rapports): every figure of a period in one object, then as a PDF
 * (the monthly summary, also e-mailed on the 1st) or as CSV tables for Excel.
 */

const localDay = (time: number) => new Date(time + 3600_000).toISOString().slice(0, 10);

async function topPages(range: Range, limit = 50) {
  const rows = await query<{ path: string; views: number; visitors: number }>(
    "SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor || date((ts + 3600000) / 1000, 'unixepoch')) AS visitors FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY path ORDER BY views DESC LIMIT ?",
    [range.from, range.to, limit],
  );
  return rows.map((row) => ({ path: String(row.path), views: num(row.views), visitors: num(row.visitors) }));
}

const CONVERSION_LABELS: Record<string, string> = { newsletter_signup: 'Inscriptions newsletter', resource_request: 'Demandes de modèles', resource_download: 'Téléchargements de ressources', contact_submit: 'Messages de contact' };

type SeoResult = SeoSummary | { configured: false; reason: string };
const seoFor = (range: Range) => searchConsoleSummary(localDay(range.from), localDay(range.to - 1))
  .catch((error): SeoResult => ({ configured: false, reason: error instanceof Error ? error.message : 'Search Console indisponible' })) as Promise<SeoResult>;

/** Every day of a range (Brazzaville time). */
function daysOf(range: Range): string[] {
  const days: string[] = [];
  for (let time = range.from + 3600_000; time < range.to + 3600_000; time += 86400_000) days.push(new Date(time).toISOString().slice(0, 10));
  return days;
}
const dayName = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });

/**
 * Every figure of a period and of the period just before, of the same length: the PDF, the CSV
 * tables and the Excel dashboard compare the two.
 */
export async function buildReport(range: Range, label: string) {
  const length = range.to - range.from;
  const previous = { from: range.from - length, to: range.from };
  const [now, before, pages, previousPages, origin, previousOrigin, breakdown, toolData, previousTools, blog, conversions, previousConversions, health, previousHealth, daily, previousDaily, seo, previousSeo, alerts] = await Promise.all([
    audienceTotals(range), audienceTotals(previous), topPages(range), topPages(previous, 200), sources(range), sources(previous), audienceBreakdown(range),
    toolStats(range), toolStats(previous), blogStats(range), conversionStats(range), conversionStats(previous), apiHealth(range), apiHealth(previous),
    dailyAudience(range), dailyAudience(previous), seoFor(range), seoFor(previous),
    recentAlerts(500),
  ]);
  const names = new Map(tools.map((tool) => [tool.slug, tool.name]));
  const totalsOf = (items: { name: string; count: number }[]) => {
    const totals = new Map<string, number>();
    for (const item of items) totals.set(item.name, (totals.get(item.name) ?? 0) + item.count);
    return totals;
  };
  const conversionTotals = totalsOf(conversions.conversions);
  const previousConversionTotals = totalsOf(previousConversions.conversions);
  const serverErrors = health.daily.reduce((sum, day) => sum + day.server, 0);
  const previousServerErrors = previousHealth.daily.reduce((sum, day) => sum + day.server, 0);
  const kpi = (name: string, value: number | null, earlier: number | null, inverse = false) => ({ label: name, value, previous: earlier, change: value === null || earlier === null ? null : percentChange(value, earlier), inverse });

  // Day 1 of the period beside day 1 of the period before, and so on.
  const currentDays = daysOf(range);
  const previousDays = daysOf(previous);
  const byDay = new Map(daily.map((row) => [row.day, row]));
  const previousByDay = new Map(previousDaily.map((row) => [row.day, row]));
  const seoDay = new Map(seo.configured ? seo.daily.map((row) => [row.day, row.clicks]) : []);
  const previousSeoDay = new Map(previousSeo.configured ? previousSeo.daily.map((row) => [row.day, row.clicks]) : []);
  const timeline = currentDays.map((day, index) => {
    const earlier = previousDays[index];
    return {
      day, label: dayName(day), previousDay: earlier ?? null,
      visitors: byDay.get(day)?.visitors ?? 0, previousVisitors: earlier ? previousByDay.get(earlier)?.visitors ?? 0 : null,
      pageviews: byDay.get(day)?.pageviews ?? 0, previousPageviews: earlier ? previousByDay.get(earlier)?.pageviews ?? 0 : null,
      toolUses: byDay.get(day)?.uses ?? 0, previousToolUses: earlier ? previousByDay.get(earlier)?.uses ?? 0 : null,
      googleClicks: seoDay.get(day) ?? null, previousGoogleClicks: earlier ? previousSeoDay.get(earlier) ?? null : null,
    };
  });

  const previousViews = new Map(previousPages.map((page) => [page.path, page.views]));
  const previousSources = new Map(previousOrigin.map((row) => [row.source, row.visits]));
  const previousDownloads = new Map(previousTools.tools.map((tool) => [tool.tool, tool.downloads]));
  const previousOpens = new Map(previousTools.tools.map((tool) => [tool.tool, tool.opens]));
  return {
    label,
    range: { from: localDay(range.from), to: localDay(range.to - 1) },
    previousRange: { from: localDay(previous.from), to: localDay(previous.to - 1) },
    generatedAt: Date.now(),
    kpis: [
      kpi('Visiteurs', now.visitors, before.visitors),
      kpi('Pages vues', now.pageviews, before.pageviews),
      kpi('Durée moyenne (s)', now.duration, before.duration),
      kpi('Taux de rebond (%)', now.bounceRate, before.bounceRate, true),
      kpi('Utilisations d’outils', now.toolUses, before.toolUses),
      kpi('Conversions', conversions.funnel.converted, previousConversions.funnel.converted),
      kpi('Disponibilité de l’API (%)', health.availability, previousHealth.availability),
      kpi('Erreurs serveur (5xx)', serverErrors, previousServerErrors, true),
      ...(seo.configured ? [
        kpi('Clics Google', seo.totals.clicks, previousSeo.configured ? previousSeo.totals.clicks : null),
        kpi('Impressions Google', seo.totals.impressions, previousSeo.configured ? previousSeo.totals.impressions : null),
        kpi('Position moyenne Google', seo.totals.position, previousSeo.configured ? previousSeo.totals.position : null, true),
      ] : []),
    ] as { label: string; value: number | null; previous: number | null; change: number | null; inverse?: boolean }[],
    timeline,
    pages: pages.map((page) => ({ ...page, previousViews: previousViews.get(page.path) ?? 0 })),
    sources: origin.map((row) => ({ ...row, previousVisits: previousSources.get(row.source) ?? 0 })),
    countries: breakdown.countries.map((row) => ({ country: COUNTRIES[row.key]?.[1] ?? (row.key || 'Inconnu'), code: row.key, visitors: row.visitors })),
    devices: breakdown.devices,
    tools: toolData.tools.map((tool) => ({ slug: tool.tool, name: names.get(tool.tool) ?? tool.tool, opens: tool.opens, previousOpens: previousOpens.get(tool.tool) ?? 0, visitors: tool.visitors, downloads: tool.downloads, previousDownloads: previousDownloads.get(tool.tool) ?? 0, errorRate: tool.errorRate }))
      .filter((tool) => tool.opens || tool.downloads).sort((a, b) => b.downloads - a.downloads || b.opens - a.opens),
    articles: blog.articles.map((article) => ({ title: article.title, category: article.category, views: article.views, readers: article.readers, readSeconds: article.readSeconds, toTools: article.toTools })),
    conversions: Array.from(new Set(Array.from(conversionTotals.keys()).concat(Array.from(previousConversionTotals.keys())))).map((name) => ({ name: CONVERSION_LABELS[name] ?? name, count: conversionTotals.get(name) ?? 0, previous: previousConversionTotals.get(name) ?? 0 })),
    routes: health.routes,
    seo,
    alerts: alerts.filter((alert) => alert.ts >= range.from && alert.ts < range.to),
  };
}

export type Report = Awaited<ReturnType<typeof buildReport>>;

// ---------------------------------------------------------------------------------------------
// CSV

const fr = (time: number) => new Date(time).toLocaleString('fr-FR', { timeZone: 'Africa/Brazzaville' });

/** The tables a report exports as CSV, by name. */
export const CSV_DATASETS: Record<string, { label: string; build: (report: Report) => string }> = {
  resume: { label: 'Résumé', build: (report) => toCsv(report.kpis, [
    { label: 'Indicateur', value: (row) => row.label },
    { label: 'Valeur', value: (row) => row.value },
    { label: 'Période précédente', value: (row) => row.previous },
    { label: 'Évolution vs période précédente (%)', value: (row) => row.change },
  ]) },
  pages: { label: 'Pages', build: (report) => toCsv(report.pages, [{ label: 'Page', value: (row) => row.path }, { label: 'Vues', value: (row) => row.views }, { label: 'Visiteurs', value: (row) => row.visitors }]) },
  sources: { label: 'Sources', build: (report) => toCsv(report.sources, [{ label: 'Source', value: (row) => row.source }, { label: 'Visites', value: (row) => row.visits }]) },
  pays: { label: 'Pays', build: (report) => toCsv(report.countries, [{ label: 'Pays', value: (row) => row.country }, { label: 'Code', value: (row) => row.code }, { label: 'Visiteurs', value: (row) => row.visitors }]) },
  outils: { label: 'Outils', build: (report) => toCsv(report.tools, [
    { label: 'Outil', value: (row) => row.name }, { label: 'Ouvertures', value: (row) => row.opens }, { label: 'Visiteurs', value: (row) => row.visitors },
    { label: 'Téléchargements', value: (row) => row.downloads }, { label: 'Taux d’erreur (%)', value: (row) => row.errorRate },
  ]) },
  articles: { label: 'Articles', build: (report) => toCsv(report.articles, [
    { label: 'Article', value: (row) => row.title }, { label: 'Catégorie', value: (row) => row.category }, { label: 'Vues', value: (row) => row.views },
    { label: 'Lecteurs', value: (row) => row.readers }, { label: 'Lecture moyenne (s)', value: (row) => row.readSeconds }, { label: 'Clics vers un outil', value: (row) => row.toTools },
  ]) },
  requetes: { label: 'Requêtes Google', build: (report) => report.seo.configured ? toCsv(report.seo.queries, seoColumns('Requête')) : toCsv([{ reason: report.seo.reason }], [{ label: 'Search Console indisponible', value: (row) => row.reason }]) },
  alertes: { label: 'Alertes', build: (report) => toCsv(report.alerts, [
    { label: 'Date', value: (row) => fr(row.ts) }, { label: 'Niveau', value: (row) => row.level }, { label: 'Titre', value: (row) => row.title },
    { label: 'Message', value: (row) => row.message }, { label: 'Envoi', value: (row) => Object.entries(row.sent).map(([channel, status]) => `${channel} : ${status}`).join(', ') },
  ]) },
};

function seoColumns(first: string): CsvColumn<SeoSummary['queries'][number]>[] {
  return [
    { label: first, value: (row) => row.key }, { label: 'Clics', value: (row) => row.clicks }, { label: 'Impressions', value: (row) => row.impressions },
    { label: 'CTR (%)', value: (row) => row.ctr }, { label: 'Position moyenne', value: (row) => row.position },
  ];
}

// ---------------------------------------------------------------------------------------------
// PDF

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const BLUE = rgb(0.145, 0.388, 0.922);
const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.39, 0.45, 0.55);
const LINE = rgb(0.89, 0.91, 0.94);
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const show = (value: number | null | undefined) => (value === null || value === undefined ? '-' : nf.format(value).replace(/ | /g, ' '));

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont, private footer: string) { this.addPage(); }

  addPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN;
    const number = this.doc.getPageCount();
    this.page.drawText(pdfText(`${this.footer} · page ${number}`), { x: MARGIN, y: 24, size: 8, font: this.font, color: MUTED });
  }

  ensure(height: number) { if (this.y - height < MARGIN) this.addPage(); }

  text(value: string, options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; gap?: number } = {}) {
    const size = options.size ?? 10;
    this.ensure(size + 4);
    this.page.drawText(pdfText(value), { x: options.x ?? MARGIN, y: this.y - size, size, font: options.bold ? this.bold : this.font, color: options.color ?? INK });
    this.y -= size + (options.gap ?? 6);
  }

  fit(value: string, width: number, size: number, bold = false) {
    const font = bold ? this.bold : this.font;
    let text = pdfText(value);
    while (text.length > 1 && font.widthOfTextAtSize(text, size) > width) text = `${text.slice(0, -2)}…`;
    return text;
  }

  heading(value: string) {
    this.ensure(40);
    this.y -= 10;
    this.text(value, { size: 13, bold: true, color: BLUE, gap: 8 });
  }

  /** A table: the first column takes the rest of the width, the others `widths`, right-aligned. */
  table(headers: string[], rows: (string | number | null)[][], widths: number[]) {
    const size = 9;
    const total = A4[0] - 2 * MARGIN;
    const first = total - widths.reduce((sum, width) => sum + width, 0);
    const columns = [first, ...widths];
    const drawRow = (cells: (string | number | null)[], bold: boolean) => {
      this.ensure(16);
      let x = MARGIN;
      cells.forEach((cell, index) => {
        const raw = typeof cell === 'number' ? show(cell) : cell ?? '-';
        const text = this.fit(raw, columns[index] - 6, size, bold);
        const width = (bold ? this.bold : this.font).widthOfTextAtSize(text, size);
        this.page.drawText(text, { x: index === 0 ? x : x + columns[index] - width, y: this.y - size, size, font: bold ? this.bold : this.font, color: bold ? MUTED : INK });
        x += columns[index];
      });
      this.y -= size + 6;
      this.page.drawLine({ start: { x: MARGIN, y: this.y + 2 }, end: { x: MARGIN + total, y: this.y + 2 }, thickness: 0.5, color: LINE });
    };
    drawRow(headers, true);
    if (!rows.length) { this.text('Aucune donnée sur la période.', { size: 9, color: MUTED }); return; }
    for (const row of rows) drawRow(row, false);
    this.y -= 4;
  }
}

export async function reportPdf(report: Report): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(pdfText(`Rapport JcHub — ${report.label}`));
  doc.setAuthor('JcHub');
  doc.setCreator('JcHub Control Center');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new Writer(doc, font, bold, `Rapport JcHub — ${report.label} — généré le ${fr(report.generatedAt)}`);

  writer.text('JcHub · Control Center', { size: 9, bold: true, color: BLUE, gap: 4 });
  writer.text(`Rapport — ${report.label}`, { size: 22, bold: true, gap: 6 });
  writer.text(`Du ${new Date(`${report.range.from}T12:00:00Z`).toLocaleDateString('fr-FR')} au ${new Date(`${report.range.to}T12:00:00Z`).toLocaleDateString('fr-FR')} · heure de Brazzaville`, { size: 10, color: MUTED, gap: 14 });

  writer.heading('Chiffres clés');
  writer.table(['Indicateur', 'Valeur', 'vs période préc.'], report.kpis.map((kpi) => [kpi.label, kpi.value, kpi.change === null ? '-' : `${kpi.change > 0 ? '+' : ''}${show(kpi.change)} %`]), [90, 110]);

  if (report.seo.configured) {
    writer.heading('Google (Search Console)');
    writer.table(['Indicateur', 'Valeur'], [['Clics', report.seo.totals.clicks], ['Impressions', report.seo.totals.impressions], ['CTR (%)', report.seo.totals.ctr], ['Position moyenne', report.seo.totals.position]], [110]);
    writer.table(['Requête', 'Clics', 'Impr.', 'Position'], report.seo.queries.slice(0, 10).map((row) => [row.key, row.clicks, row.impressions, row.position]), [55, 65, 65]);
  } else {
    writer.heading('Google (Search Console)');
    writer.text(report.seo.reason, { size: 9, color: MUTED });
  }

  writer.heading('Pages les plus vues');
  writer.table(['Page', 'Vues', 'Visiteurs'], report.pages.slice(0, 15).map((row) => [row.path, row.views, row.visitors]), [70, 70]);

  writer.heading('Provenance des visites');
  writer.table(['Source', 'Visites'], report.sources.slice(0, 10).map((row) => [row.source, row.visits]), [90]);
  writer.table(['Pays', 'Visiteurs'], report.countries.slice(0, 10).map((row) => [row.country, row.visitors]), [90]);

  writer.heading('Outils');
  writer.table(['Outil', 'Ouvertures', 'Téléch.', 'Erreurs (%)'], report.tools.slice(0, 15).map((row) => [row.name, row.opens, row.downloads, row.errorRate]), [70, 60, 70]);

  writer.heading('Articles');
  writer.table(['Article', 'Vues', 'Lecteurs', 'Lecture (s)'], report.articles.slice(0, 15).map((row) => [row.title, row.views, row.readers, row.readSeconds]), [55, 60, 70]);

  writer.heading('Conversions');
  writer.table(['Action', 'Nombre'], report.conversions.map((row) => [row.name, row.count]), [90]);

  writer.heading('Alertes de la période');
  writer.table(['Alerte', 'Date', 'Niveau'], report.alerts.slice(0, 20).map((row) => [row.title, new Date(row.ts).toLocaleDateString('fr-FR', { timeZone: 'Africa/Brazzaville' }), row.level]), [80, 70]);

  return Buffer.from(await doc.save());
}

// ---------------------------------------------------------------------------------------------
// E-mail

export type ReportPeriod = { range: Range; label: string; slug: string; kind: 'week' | 'month' | 'days' };

/** The period of a week (Monday, YYYY-MM-DD) or of a month (YYYY-MM); null when invalid. */
export function reportPeriod(options: { week?: string | null; month?: string | null }): ReportPeriod | null {
  if (options.week) {
    const range = weekRange(options.week);
    return range ? { range, label: weekLabel(options.week), slug: `semaine-${options.week}`, kind: 'week' } : null;
  }
  if (options.month) {
    const range = monthRange(options.month);
    return range ? { range, label: monthLabel(options.month), slug: options.month, kind: 'month' } : null;
  }
  return null;
}

/**
 * The report by e-mail with its Excel dashboard and its PDF attached: every Monday for the week
 * before (daily cron), or on demand from Control Center › Rapports.
 */
export async function sendReport(period: ReportPeriod): Promise<{ ok: boolean; detail?: string }> {
  const report = await buildReport(period.range, period.label);
  const [pdf, workbook] = await Promise.all([reportPdf(report), import('@/lib/insights/report-xlsx').then(({ reportWorkbook }) => reportWorkbook(report))]);
  const against = period.kind === 'week' ? 'la semaine d’avant' : period.kind === 'month' ? 'le mois d’avant' : 'la période d’avant';
  const lines = report.kpis.map((kpi) => `- ${kpi.label} : ${show(kpi.value)}${kpi.change === null ? '' : ` (${kpi.change > 0 ? '+' : ''}${show(kpi.change)} % par rapport à ${against})`}`);
  const top = report.pages.slice(0, 5).map((page, index) => `${index + 1}. ${page.path} — ${show(page.views)} vues`).join('\n');
  const adminHost = (process.env.ADMIN_HOST || 'admin.jchub.dev').trim();
  const name = `${report.label.charAt(0).toLowerCase()}${report.label.slice(1)}`;
  return sendEmail(
    `JcHub — rapport : ${name}`,
    [
      `Voici le résumé (${name}) :`,
      lines.join('\n'),
      `Pages les plus vues :\n${top || 'aucune'}`,
      `${report.alerts.length} alerte(s) sur la période.`,
      `En pièces jointes : le tableau de bord Excel (graphiques de comparaison et un onglet par sujet) et le rapport PDF. Tous les chiffres : https://${adminHost}/admin/insights/rapports`,
    ].join('\n\n'),
    [
      { name: downloadName(`rapport-${period.slug}`, 'xlsx'), content: Buffer.from(workbook) },
      { name: downloadName(`rapport-${period.slug}`, 'pdf'), content: pdf },
    ],
  );
}
