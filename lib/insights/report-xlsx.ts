import 'server-only';

import ExcelJS from 'exceljs';
import { addChartsToWorkbook, cellRef, type ChartSpec } from '@/lib/insights/xlsx-charts';
import type { Report } from '@/lib/insights/report';

/**
 * The report as an Excel workbook (Control Center › Rapports, and the weekly e-mail):
 * - « Tableau de bord »: the key figures as tiles, each compared with the period before, and six
 *   native Excel charts (period against the period before);
 * - one sheet per subject, formatted, filterable, with the gap and the change computed by formulas.
 */

export const BLUE = '2563EB';
export const NAVY = '1E3A8A';
export const INK = '0F172A';
export const MUTED = '64748B';
export const GREEN = '16A34A';
const RED = 'DC2626';
export const TILE = 'F1F5F9';
const PREVIOUS = '94A3B8';
export const PALETTE = ['2563EB', '16A34A', 'F59E0B', '9333EA', 'EF4444', '06B6D4', 'EC4899', '64748B', '84CC16', '0EA5E9'];
const SOURCE_LABELS: Record<string, string> = {
  google: 'Google', facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', whatsapp: 'WhatsApp', x: 'X (Twitter)', youtube: 'YouTube', bing: 'Bing', 'autre-moteur': 'Autres moteurs', direct: 'Accès direct', 'site-referent': 'Sites référents',
};

export const argb = (hex: string) => `FF${hex}`;
const date = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const HEADER_ROW = 4;

export type Column<T> = { header: string; width: number; value: (row: T, line: number) => ExcelJS.CellValue; format?: string; align?: 'left' | 'right' | 'center' };

/** A formatted table: title, subtitle, frozen header with filters, alternating rows. Returns its last data row. */
export function addTable<T>(sheet: ExcelJS.Worksheet, title: string, subtitle: string, columns: Column<T>[], rows: T[], startRow = HEADER_ROW): number {
  sheet.getCell(startRow - 3, 1).value = title;
  sheet.getCell(startRow - 3, 1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: argb(INK) } };
  sheet.getCell(startRow - 2, 1).value = subtitle;
  sheet.getCell(startRow - 2, 1).font = { name: 'Calibri', size: 10, color: { argb: argb(MUTED) } };
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width;
    const cell = sheet.getCell(startRow, index + 1);
    cell.value = column.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(NAVY) } };
    cell.alignment = { vertical: 'middle', horizontal: column.align ?? (index === 0 ? 'left' : 'right'), wrapText: true };
  });
  sheet.getRow(startRow).height = 30;
  rows.forEach((row, rowIndex) => {
    const line = startRow + 1 + rowIndex;
    columns.forEach((column, index) => {
      const cell = sheet.getCell(line, index + 1);
      cell.value = column.value(row, line);
      cell.font = { name: 'Calibri', size: 10, color: { argb: argb(INK) } };
      cell.alignment = { vertical: 'middle', horizontal: column.align ?? (index === 0 ? 'left' : 'right') };
      if (column.format) cell.numFmt = column.format;
      if (rowIndex % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
  });
  if (!rows.length) {
    sheet.getCell(startRow + 1, 1).value = 'Aucune donnée sur la période.';
    sheet.getCell(startRow + 1, 1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: argb(MUTED) } };
  } else {
    sheet.autoFilter = { from: { row: startRow, column: 1 }, to: { row: startRow + rows.length, column: columns.length } };
  }
  sheet.views = [{ state: 'frozen', ySplit: startRow, showGridLines: false }];
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  return startRow + rows.length;
}

/** Green when the change is good, red when it is bad (a rise of errors is bad). */
export function colorChanges(sheet: ExcelJS.Worksheet, ref: string, inverse = false) {
  sheet.addConditionalFormatting({
    ref,
    rules: [
      { type: 'cellIs', operator: 'greaterThan', formulae: ['0'], priority: 1, style: { font: { color: { argb: argb(inverse ? RED : GREEN) }, bold: true } } },
      { type: 'cellIs', operator: 'lessThan', formulae: ['0'], priority: 2, style: { font: { color: { argb: argb(inverse ? GREEN : RED) }, bold: true } } },
    ],
  });
}

export const CHANGE_FORMAT = '+0%;-0%;0%';
const changeFormula = (current: string, previous: string, line: number) => ({ formula: `IF(${previous}${line}=0,"",${current}${line}/${previous}${line}-1)` });
const changeResult = (current: number, previous: number) => (previous ? current / previous - 1 : '');

function dashboard(workbook: ExcelJS.Workbook, report: Report) {
  const sheet = workbook.addWorksheet('Tableau de bord', { properties: { tabColor: { argb: argb(BLUE) } } });
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
  sheet.getColumn(1).width = 2;
  for (let column = 2; column <= 13; column += 1) sheet.getColumn(column).width = 12.5;

  sheet.mergeCells(2, 2, 3, 13);
  const title = sheet.getCell(2, 2);
  title.value = `Rapport JcHub — ${report.label}`;
  title.font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(NAVY) } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(2).height = 24;
  sheet.getRow(3).height = 24;
  sheet.mergeCells(4, 2, 4, 13);
  const subtitle = sheet.getCell(4, 2);
  subtitle.value = `Du ${date(report.range.from)} au ${date(report.range.to)}, comparé à la période précédente (du ${date(report.previousRange.from)} au ${date(report.previousRange.to)}). Heure de Brazzaville. Graphiques : trait plein = période, pointillés ou gris = période précédente.`;
  subtitle.font = { name: 'Calibri', size: 9, color: { argb: argb(MUTED) } };
  subtitle.alignment = { vertical: 'middle', wrapText: true };
  sheet.getRow(4).height = 30;

  // Key figures: four tiles a row, each over three columns.
  report.kpis.forEach((kpi, index) => {
    const row = 6 + Math.floor(index / 4) * 4;
    const column = 2 + (index % 4) * 3;
    for (let line = row; line < row + 3; line += 1) {
      sheet.mergeCells(line, column, line, column + 2);
      sheet.getCell(line, column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(TILE) } };
      sheet.getCell(line, column).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
    const label = sheet.getCell(row, column);
    label.value = kpi.label.toUpperCase();
    label.font = { name: 'Calibri', size: 8, bold: true, color: { argb: argb(MUTED) } };
    const value = sheet.getCell(row + 1, column);
    value.value = kpi.value ?? '—';
    value.numFmt = Number.isInteger(kpi.value ?? 0) ? '#,##0' : '#,##0.0';
    value.font = { name: 'Calibri', size: 20, bold: true, color: { argb: argb(INK) } };
    const change = sheet.getCell(row + 2, column);
    const good = kpi.change === null || kpi.change === 0 ? null : (kpi.change > 0) !== Boolean(kpi.inverse);
    const before = kpi.previous === null ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(kpi.previous);
    change.value = kpi.change === null ? `Période préc. : ${before}` : `${kpi.change > 0 ? '▲' : kpi.change < 0 ? '▼' : '='} ${kpi.change > 0 ? '+' : ''}${kpi.change.toLocaleString('fr-FR')} %   (préc. : ${before})`;
    change.font = { name: 'Calibri', size: 9, bold: good !== null, color: { argb: argb(good === null ? MUTED : good ? GREEN : RED) } };
    sheet.getRow(row + 1).height = 30;
  });
  return 6 + Math.ceil(report.kpis.length / 4) * 4;
}

export async function reportWorkbook(report: Report): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JcHub Control Center';
  workbook.created = new Date(report.generatedAt);
  workbook.title = `Rapport JcHub — ${report.label}`;
  const chartsTop = dashboard(workbook, report);
  const charts: ChartSpec[] = [];
  const period = `du ${date(report.range.from)} au ${date(report.range.to)}`;

  // Évolution: one line a day, beside the same day of the period before. The charts read it.
  const evolution = workbook.addWorksheet('Évolution');
  const timeline = report.timeline;
  const hasGoogle = timeline.some((day) => day.googleClicks !== null);
  const evolutionColumns: Column<Report['timeline'][number]>[] = [
    { header: 'Jour', width: 14, value: (row) => row.label },
    { header: 'Date', width: 12, value: (row) => new Date(`${row.day}T12:00:00Z`), format: 'dd/mm/yyyy', align: 'center' },
    { header: 'Visiteurs', width: 12, value: (row) => row.visitors, format: '#,##0' },
    { header: 'Visiteurs (préc.)', width: 14, value: (row) => row.previousVisitors, format: '#,##0' },
    { header: 'Pages vues', width: 12, value: (row) => row.pageviews, format: '#,##0' },
    { header: 'Pages vues (préc.)', width: 14, value: (row) => row.previousPageviews, format: '#,##0' },
    { header: 'Utilisations d’outils', width: 14, value: (row) => row.toolUses, format: '#,##0' },
    { header: 'Utilisations (préc.)', width: 14, value: (row) => row.previousToolUses, format: '#,##0' },
    ...(hasGoogle ? [
      { header: 'Clics Google', width: 12, value: (row: Report['timeline'][number]) => row.googleClicks, format: '#,##0' },
      { header: 'Clics Google (préc.)', width: 14, value: (row: Report['timeline'][number]) => row.previousGoogleClicks, format: '#,##0' },
    ] : []),
  ];
  const lastDay = addTable(evolution, 'Évolution jour par jour', `Chaque jour ${period} à côté du même jour de la période précédente.`, evolutionColumns, timeline);
  if (timeline.length) {
    // Totals and change, computed by Excel.
    const total = lastDay + 1;
    const changeRow = lastDay + 2;
    evolution.getCell(total, 1).value = 'Total';
    evolution.getCell(changeRow, 1).value = 'Évolution';
    for (let column = 3; column <= evolutionColumns.length; column += 1) {
      const letter = evolution.getColumn(column).letter;
      const cell = evolution.getCell(total, column);
      const sum = timeline.reduce((acc, row) => acc + Number(evolutionColumns[column - 1].value(row, 0) ?? 0), 0);
      cell.value = { formula: `SUM(${letter}${HEADER_ROW + 1}:${letter}${lastDay})`, result: sum };
      cell.numFmt = '#,##0';
      if (column % 2 === 1) {
        const previousLetter = evolution.getColumn(column + 1).letter;
        const previousSum = timeline.reduce((acc, row) => acc + Number(evolutionColumns[column].value(row, 0) ?? 0), 0);
        const changeCell = evolution.getCell(changeRow, column);
        changeCell.value = { formula: `IF(${previousLetter}${total}=0,"",${letter}${total}/${previousLetter}${total}-1)`, result: changeResult(sum, previousSum) };
        changeCell.numFmt = CHANGE_FORMAT;
      }
    }
    for (const line of [total, changeRow]) {
      evolution.getRow(line).font = { name: 'Calibri', size: 10, bold: true, color: { argb: argb(INK) } };
      evolution.getRow(line).eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; });
    }
    colorChanges(evolution, `C${changeRow}:${evolution.getColumn(evolutionColumns.length).letter}${changeRow}`);

    const categories = timeline.map((row) => row.label);
    const categoriesRef = cellRef('Évolution', 1, HEADER_ROW + 1, 1, lastDay);
    const series = (column: number, name: string, values: (number | null)[], color: string, dashed = false) => ({
      name, nameRef: cellRef('Évolution', column, HEADER_ROW), categoriesRef, valuesRef: cellRef('Évolution', column, HEADER_ROW + 1, column, lastDay), categories, values, color, dashed,
    });
    charts.push({
      kind: 'line', title: 'Visiteurs par jour', from: { col: 1, row: chartsTop }, to: { col: 7, row: chartsTop + 16 },
      series: [series(3, 'Visiteurs', timeline.map((row) => row.visitors), BLUE), series(4, 'Visiteurs (préc.)', timeline.map((row) => row.previousVisitors), PREVIOUS, true)],
    });
    charts.push({
      kind: 'column', title: 'Pages vues par jour', from: { col: 7, row: chartsTop }, to: { col: 13, row: chartsTop + 16 },
      series: [series(5, 'Pages vues', timeline.map((row) => row.pageviews), BLUE), series(6, 'Pages vues (préc.)', timeline.map((row) => row.previousPageviews), 'CBD5E1')],
    });
    charts.push(hasGoogle ? {
      kind: 'line', title: 'Clics depuis Google par jour', from: { col: 7, row: chartsTop + 34 }, to: { col: 13, row: chartsTop + 50 },
      series: [series(9, 'Clics Google', timeline.map((row) => row.googleClicks), GREEN), series(10, 'Clics Google (préc.)', timeline.map((row) => row.previousGoogleClicks), PREVIOUS, true)],
    } : {
      kind: 'column', title: 'Utilisations d’outils par jour', from: { col: 7, row: chartsTop + 34 }, to: { col: 13, row: chartsTop + 50 },
      series: [series(7, 'Utilisations d’outils', timeline.map((row) => row.toolUses), GREEN), series(8, 'Utilisations (préc.)', timeline.map((row) => row.previousToolUses), 'CBD5E1')],
    });
  }

  // Pages
  const pages = workbook.addWorksheet('Pages');
  const pageRows = report.pages;
  const lastPage = addTable(pages, 'Pages les plus vues', `Pages du site ${period}, comparées à la période précédente.`, [
    { header: 'Page', width: 52, value: (row) => row.path },
    { header: 'Vues', width: 11, value: (row) => row.views, format: '#,##0' },
    { header: 'Vues (préc.)', width: 12, value: (row) => row.previousViews, format: '#,##0' },
    { header: 'Écart', width: 10, value: (row, line) => ({ formula: `B${line}-C${line}`, result: row.views - row.previousViews }), format: '+#,##0;-#,##0;0' },
    { header: 'Évolution', width: 11, value: (row, line) => ({ ...changeFormula('B', 'C', line), result: changeResult(row.views, row.previousViews) }), format: CHANGE_FORMAT },
    { header: 'Visiteurs', width: 11, value: (row) => row.visitors, format: '#,##0' },
  ], pageRows);
  if (pageRows.length) {
    colorChanges(pages, `D${HEADER_ROW + 1}:E${lastPage}`);
    const top = Math.min(pageRows.length, 10);
    const categories = pageRows.slice(0, top).map((row) => row.path);
    const categoriesRef = cellRef('Pages', 1, HEADER_ROW + 1, 1, HEADER_ROW + top);
    charts.push({
      kind: 'bar', title: 'Top 10 des pages', from: { col: 1, row: chartsTop + 17 }, to: { col: 7, row: chartsTop + 33 }, labels: true,
      series: [
        { name: 'Vues', nameRef: cellRef('Pages', 2, HEADER_ROW), categoriesRef, valuesRef: cellRef('Pages', 2, HEADER_ROW + 1, 2, HEADER_ROW + top), categories, values: pageRows.slice(0, top).map((row) => row.views), color: BLUE },
        { name: 'Vues (préc.)', nameRef: cellRef('Pages', 3, HEADER_ROW), categoriesRef, valuesRef: cellRef('Pages', 3, HEADER_ROW + 1, 3, HEADER_ROW + top), categories, values: pageRows.slice(0, top).map((row) => row.previousViews), color: 'CBD5E1' },
      ],
    });
  }

  // Sources
  const sourcesSheet = workbook.addWorksheet('Sources');
  const sourceRows = report.sources.map((row) => ({ ...row, name: SOURCE_LABELS[row.source] ?? row.source }));
  const lastSource = addTable(sourcesSheet, 'Provenance des visites', `D’où viennent les visites ${period} (hors navigation interne).`, [
    { header: 'Source', width: 24, value: (row) => row.name },
    { header: 'Visites', width: 11, value: (row) => row.visits, format: '#,##0' },
    { header: 'Visites (préc.)', width: 13, value: (row) => row.previousVisits, format: '#,##0' },
    { header: 'Évolution', width: 11, value: (row, line) => ({ ...changeFormula('B', 'C', line), result: changeResult(row.visits, row.previousVisits) }), format: CHANGE_FORMAT },
    { header: 'Part', width: 10, value: (row, line) => ({ formula: `B${line}/SUM($B$${HEADER_ROW + 1}:$B$${HEADER_ROW + sourceRows.length})`, result: row.visits / Math.max(1, sourceRows.reduce((sum, item) => sum + item.visits, 0)) }), format: '0.0%' },
  ], sourceRows);
  if (sourceRows.length) {
    colorChanges(sourcesSheet, `D${HEADER_ROW + 1}:D${lastSource}`);
    charts.push({
      kind: 'doughnut', title: 'Provenance des visites', from: { col: 7, row: chartsTop + 17 }, to: { col: 13, row: chartsTop + 33 },
      pointColors: sourceRows.map((_, index) => PALETTE[index % PALETTE.length]),
      series: [{ name: 'Visites', nameRef: cellRef('Sources', 2, HEADER_ROW), categoriesRef: cellRef('Sources', 1, HEADER_ROW + 1, 1, lastSource), valuesRef: cellRef('Sources', 2, HEADER_ROW + 1, 2, lastSource), categories: sourceRows.map((row) => row.name), values: sourceRows.map((row) => row.visits), color: BLUE }],
    });
  }

  // Outils
  const toolsSheet = workbook.addWorksheet('Outils');
  const toolRows = report.tools;
  const lastTool = addTable(toolsSheet, 'Outils', `Ouvertures et téléchargements de résultats ${period}.`, [
    { header: 'Outil', width: 34, value: (row) => row.name },
    { header: 'Téléchargements', width: 15, value: (row) => row.downloads, format: '#,##0' },
    { header: 'Téléch. (préc.)', width: 14, value: (row) => row.previousDownloads, format: '#,##0' },
    { header: 'Évolution', width: 11, value: (row, line) => ({ ...changeFormula('B', 'C', line), result: changeResult(row.downloads, row.previousDownloads) }), format: CHANGE_FORMAT },
    { header: 'Ouvertures', width: 12, value: (row) => row.opens, format: '#,##0' },
    { header: 'Ouvertures (préc.)', width: 15, value: (row) => row.previousOpens, format: '#,##0' },
    { header: 'Visiteurs', width: 11, value: (row) => row.visitors, format: '#,##0' },
    { header: 'Taux d’erreur', width: 12, value: (row) => (row.errorRate === null ? null : row.errorRate / 100), format: '0.0%' },
  ], toolRows);
  if (toolRows.length) {
    colorChanges(toolsSheet, `D${HEADER_ROW + 1}:D${lastTool}`);
    const top = Math.min(toolRows.length, 10);
    const categories = toolRows.slice(0, top).map((row) => row.name);
    const categoriesRef = cellRef('Outils', 1, HEADER_ROW + 1, 1, HEADER_ROW + top);
    charts.push({
      kind: 'bar', title: 'Téléchargements par outil', from: { col: 1, row: chartsTop + 34 }, to: { col: 7, row: chartsTop + 50 }, labels: true,
      series: [
        { name: 'Téléchargements', nameRef: cellRef('Outils', 2, HEADER_ROW), categoriesRef, valuesRef: cellRef('Outils', 2, HEADER_ROW + 1, 2, HEADER_ROW + top), categories, values: toolRows.slice(0, top).map((row) => row.downloads), color: GREEN },
        { name: 'Téléch. (préc.)', nameRef: cellRef('Outils', 3, HEADER_ROW), categoriesRef, valuesRef: cellRef('Outils', 3, HEADER_ROW + 1, 3, HEADER_ROW + top), categories, values: toolRows.slice(0, top).map((row) => row.previousDownloads), color: 'CBD5E1' },
      ],
    });
  }

  // Articles
  addTable(workbook.addWorksheet('Articles'), 'Articles du blog', `Lectures ${period} (français et anglais réunis).`, [
    { header: 'Article', width: 60, value: (row) => row.title },
    { header: 'Catégorie', width: 22, value: (row) => row.category, align: 'left' },
    { header: 'Vues', width: 10, value: (row) => row.views, format: '#,##0' },
    { header: 'Lecteurs', width: 10, value: (row) => row.readers, format: '#,##0' },
    { header: 'Lecture moyenne (s)', width: 16, value: (row) => row.readSeconds, format: '#,##0' },
    { header: 'Clics vers un outil', width: 16, value: (row) => row.toTools, format: '#,##0' },
  ], report.articles);

  // Pays
  addTable(workbook.addWorksheet('Pays'), 'Pays des visiteurs', `Visiteurs par pays ${period}.`, [
    { header: 'Pays', width: 30, value: (row) => row.country },
    { header: 'Code', width: 8, value: (row) => row.code, align: 'center' },
    { header: 'Visiteurs', width: 12, value: (row) => row.visitors, format: '#,##0' },
  ], report.countries);

  // Google
  const google = workbook.addWorksheet('Google');
  if (report.seo.configured) {
    const seoColumns = (first: string, width: number): Column<{ key: string; clicks: number; impressions: number; ctr: number; position: number }>[] => [
      { header: first, width, value: (row) => row.key },
      { header: 'Clics', width: 10, value: (row) => row.clicks, format: '#,##0' },
      { header: 'Impressions', width: 12, value: (row) => row.impressions, format: '#,##0' },
      { header: 'CTR', width: 9, value: (row) => row.ctr / 100, format: '0.0%' },
      { header: 'Position', width: 10, value: (row) => row.position, format: '0.0' },
    ];
    const lastQuery = addTable(google, 'Requêtes Google', `Ce que les gens ont cherché avant d’arriver sur le site, ${period} (Search Console).`, seoColumns('Requête', 46), report.seo.queries);
    addTable(google, 'Pages dans Google', 'Pages du site affichées dans les résultats.', seoColumns('Page', 46), report.seo.pages, lastQuery + 5);
    google.views = [{ showGridLines: false }];
  } else {
    google.getCell(1, 1).value = 'Google Search Console';
    google.getCell(1, 1).font = { name: 'Calibri', size: 16, bold: true };
    google.getCell(2, 1).value = report.seo.reason;
    google.getColumn(1).width = 120;
  }

  // Conversions
  const conversions = workbook.addWorksheet('Conversions');
  const lastConversion = addTable(conversions, 'Conversions', `Actions des visiteurs ${period}.`, [
    { header: 'Action', width: 34, value: (row) => row.name },
    { header: 'Nombre', width: 11, value: (row) => row.count, format: '#,##0' },
    { header: 'Nombre (préc.)', width: 14, value: (row) => row.previous, format: '#,##0' },
    { header: 'Évolution', width: 11, value: (row, line) => ({ ...changeFormula('B', 'C', line), result: changeResult(row.count, row.previous) }), format: CHANGE_FORMAT },
  ], report.conversions);
  if (report.conversions.length) colorChanges(conversions, `D${HEADER_ROW + 1}:D${lastConversion}`);

  // Alertes
  addTable(workbook.addWorksheet('Alertes'), 'Alertes', `Alertes envoyées ${period}.`, [
    { header: 'Date', width: 18, value: (row) => new Date(row.ts), format: 'dd/mm/yyyy hh:mm', align: 'left' },
    { header: 'Niveau', width: 11, value: (row) => row.level, align: 'center' },
    { header: 'Alerte', width: 40, value: (row) => row.title, align: 'left' },
    { header: 'Détail', width: 80, value: (row) => row.message, align: 'left' },
  ], report.alerts);

  const buffer = new Uint8Array(await workbook.xlsx.writeBuffer() as ArrayBuffer);
  // The dashboard is the first sheet: xl/worksheets/sheet1.xml.
  return addChartsToWorkbook(buffer, 1, charts);
}
