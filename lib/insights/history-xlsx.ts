import 'server-only';

import ExcelJS from 'exceljs';
import { addChartsToWorkbook, cellRef, type ChartSpec } from '@/lib/insights/xlsx-charts';
import { addTable, argb, BLUE, CHANGE_FORMAT, colorChanges, GREEN, HEADER_ROW, INK, MUTED, NAVY, PALETTE, TILE, type Column } from '@/lib/insights/report-xlsx';
import { GA_FULL_UNTIL, type History } from '@/lib/insights/history';

/**
 * The history (Control Center › Historique) as an Excel workbook: a dashboard with the whole
 * period and the comparison week after week, then one sheet per source.
 */

const ORANGE = 'F59E0B';
const date = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const short = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const DEVICE: Record<string, string> = { desktop: 'Ordinateur', mobile: 'Mobile', tablet: 'Tablette', DESKTOP: 'Ordinateur', MOBILE: 'Mobile', TABLET: 'Tablette' };

type Day = History['daily'][number];
type Week = History['weeks'][number];

function dashboard(workbook: ExcelJS.Workbook, history: History): number {
  const sheet = workbook.addWorksheet('Tableau de bord', { properties: { tabColor: { argb: argb(BLUE) } } });
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
  sheet.getColumn(1).width = 2;
  for (let column = 2; column <= 13; column += 1) sheet.getColumn(column).width = 12.5;
  sheet.mergeCells(2, 2, 3, 13);
  const title = sheet.getCell(2, 2);
  title.value = `Historique de jchub.dev — du ${date(history.range.from)} au ${date(history.range.to)}`;
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(NAVY) } };
  title.alignment = { vertical: 'middle', indent: 1 };
  sheet.getRow(2).height = 24;
  sheet.getRow(3).height = 24;
  sheet.mergeCells(4, 2, 4, 13);
  const subtitle = sheet.getCell(4, 2);
  subtitle.value = `Toutes les sources réunies jour par jour. Google Analytics est complet jusqu’au ${date(GA_FULL_UNTIL)}, puis ne compte que les visiteurs qui acceptent les cookies. Généré le ${new Date(history.builtAt).toLocaleString('fr-FR', { timeZone: 'Africa/Brazzaville' })}.`;
  subtitle.font = { name: 'Calibri', size: 9, color: { argb: argb(MUTED) } };
  subtitle.alignment = { vertical: 'middle', wrapText: true };
  sheet.getRow(4).height = 30;

  const tiles: [string, number, string][] = [
    ['Visiteurs (Analytics)', history.totals.gaUsers, 'somme des visiteurs quotidiens'],
    ['Pages vues (Analytics)', history.totals.gaPageviews, ''],
    ['Sessions (Analytics)', history.totals.gaSessions, ''],
    ['Clics depuis Google', history.totals.googleClicks, 'Search Console'],
    ['Impressions Google', history.totals.googleImpressions, 'Search Console'],
    ['Visiteurs (mesure du site)', history.totals.siteVisitors, 'depuis le 28 octobre'],
    ['Pages vues (mesure du site)', history.totals.sitePageviews, 'depuis le 28 octobre'],
    ['Inscrits newsletter', history.totals.newsletter, ''],
    ['Messages de contact', history.totals.contacts, ''],
    ['Commentaires', history.totals.comments, ''],
    ['Demandes de modèles', history.totals.resources, ''],
  ];
  tiles.forEach(([label, value, note], index) => {
    const row = 6 + Math.floor(index / 4) * 4;
    const column = 2 + (index % 4) * 3;
    for (let line = row; line < row + 3; line += 1) {
      sheet.mergeCells(line, column, line, column + 2);
      sheet.getCell(line, column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(TILE) } };
      sheet.getCell(line, column).alignment = { vertical: 'middle', indent: 1 };
    }
    sheet.getCell(row, column).value = label.toUpperCase();
    sheet.getCell(row, column).font = { name: 'Calibri', size: 8, bold: true, color: { argb: argb(MUTED) } };
    sheet.getCell(row + 1, column).value = value;
    sheet.getCell(row + 1, column).numFmt = '#,##0';
    sheet.getCell(row + 1, column).font = { name: 'Calibri', size: 20, bold: true, color: { argb: argb(INK) } };
    sheet.getCell(row + 2, column).value = note;
    sheet.getCell(row + 2, column).font = { name: 'Calibri', size: 9, color: { argb: argb(MUTED) } };
    sheet.getRow(row + 1).height = 30;
  });

  // Where each figure comes from, and for which days.
  let line = 6 + Math.ceil(tiles.length / 4) * 4 + 1;
  sheet.getCell(line, 2).value = 'SOURCES ET PÉRIODES COUVERTES';
  sheet.getCell(line, 2).font = { name: 'Calibri', size: 9, bold: true, color: { argb: argb(MUTED) } };
  line += 1;
  for (const item of history.coverage) {
    sheet.mergeCells(line, 2, line, 4);
    sheet.mergeCells(line, 5, line, 7);
    sheet.mergeCells(line, 8, line, 13);
    sheet.getCell(line, 2).value = item.source;
    sheet.getCell(line, 2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: argb(INK) } };
    sheet.getCell(line, 5).value = item.from && item.to ? `${short(item.from)} → ${short(item.to)}` : item.status;
    sheet.getCell(line, 5).font = { name: 'Calibri', size: 10, color: { argb: argb(item.status === 'ok' ? GREEN : 'DC2626') } };
    sheet.getCell(line, 8).value = item.note;
    sheet.getCell(line, 8).font = { name: 'Calibri', size: 9, color: { argb: argb(MUTED) } };
    sheet.getCell(line, 8).alignment = { wrapText: true, vertical: 'middle' };
    sheet.getRow(line).height = 28;
    for (let column = 2; column <= 13; column += 1) sheet.getCell(line, column).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    line += 1;
  }
  return line + 1;
}

export async function historyWorkbook(history: History): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JcHub Control Center';
  workbook.created = new Date(history.builtAt);
  workbook.title = 'Historique de jchub.dev';
  const top = dashboard(workbook, history);
  const charts: ChartSpec[] = [];
  const period = `du ${date(history.range.from)} au ${date(history.range.to)}`;

  // Jour par jour
  const daily = workbook.addWorksheet('Jour par jour');
  const dayColumns: Column<Day>[] = [
    { header: 'Jour', width: 8, value: (row) => short(row.day), align: 'center' },
    { header: 'Date', width: 12, value: (row) => new Date(`${row.day}T12:00:00Z`), format: 'dd/mm/yyyy', align: 'center' },
    { header: 'Visiteurs (Analytics)', width: 13, value: (row) => row.gaUsers, format: '#,##0' },
    { header: 'Nouveaux visiteurs', width: 12, value: (row) => row.gaNewUsers, format: '#,##0' },
    { header: 'Sessions', width: 10, value: (row) => row.gaSessions, format: '#,##0' },
    { header: 'Pages vues (Analytics)', width: 13, value: (row) => row.gaPageviews, format: '#,##0' },
    { header: 'Durée moy. (s)', width: 10, value: (row) => row.gaDuration, format: '#,##0' },
    { header: 'Rebond', width: 9, value: (row) => (row.gaBounce === null ? null : row.gaBounce / 100), format: '0%' },
    { header: 'Clics Google', width: 10, value: (row) => row.googleClicks, format: '#,##0' },
    { header: 'Impressions Google', width: 12, value: (row) => row.googleImpressions, format: '#,##0' },
    { header: 'CTR Google', width: 9, value: (row) => (row.googleCtr === null ? null : row.googleCtr / 100), format: '0.0%' },
    { header: 'Position Google', width: 10, value: (row) => row.googlePosition, format: '0.0' },
    { header: 'Visiteurs (site)', width: 11, value: (row) => row.siteVisitors, format: '#,##0' },
    { header: 'Pages vues (site)', width: 11, value: (row) => row.sitePageviews, format: '#,##0' },
    { header: 'Utilisations d’outils', width: 12, value: (row) => row.siteToolUses, format: '#,##0' },
    { header: 'Inscrits newsletter', width: 11, value: (row) => row.newsletter, format: '#,##0' },
    { header: 'Messages', width: 10, value: (row) => row.contacts, format: '#,##0' },
    { header: 'Commentaires', width: 11, value: (row) => row.comments, format: '#,##0' },
    { header: 'Demandes de modèles', width: 12, value: (row) => row.resources, format: '#,##0' },
    { header: 'Remarque', width: 34, value: (row) => (row.gaUsers !== null && row.gaPartial ? 'Analytics : visiteurs avec cookies seulement' : ''), align: 'left' },
  ];
  const lastDay = addTable(daily, 'Jour par jour', `Chaque jour ${period}, toutes sources. Case vide : la source ne mesurait pas ce jour-là.`, dayColumns, history.daily);
  const days = history.daily;
  const dayCategories = days.map((row) => short(row.day));
  const dayCategoriesRef = cellRef('Jour par jour', 1, HEADER_ROW + 1, 1, lastDay);
  const daySeries = (column: number, name: string, values: (number | null)[], color: string, dashed = false) => ({
    name, nameRef: cellRef('Jour par jour', column, HEADER_ROW), categoriesRef: dayCategoriesRef, valuesRef: cellRef('Jour par jour', column, HEADER_ROW + 1, column, lastDay), categories: dayCategories, values, color, dashed,
  });
  charts.push({
    kind: 'line', title: 'Visiteurs par jour depuis le 3 septembre', from: { col: 1, row: top }, to: { col: 13, row: top + 18 },
    series: [
      daySeries(3, 'Visiteurs (Analytics)', days.map((row) => row.gaUsers), BLUE),
      daySeries(13, 'Visiteurs (site)', days.map((row) => row.siteVisitors), GREEN),
      daySeries(9, 'Clics Google', days.map((row) => row.googleClicks), ORANGE, true),
    ],
  });
  charts.push({
    kind: 'line', title: 'Impressions dans Google par jour', from: { col: 7, row: top + 38 }, to: { col: 13, row: top + 55 },
    series: [daySeries(10, 'Impressions Google', days.map((row) => row.googleImpressions), '9333EA')],
  });

  // Semaines
  const weeksSheet = workbook.addWorksheet('Semaines');
  const weeks = history.weeks;
  const weekColumns: Column<Week>[] = [
    { header: 'Semaine', width: 14, value: (row) => `Sem. ${short(row.week)}`, align: 'left' },
    { header: 'Jours', width: 7, value: (row) => row.days, align: 'center' },
    { header: 'Visiteurs (Analytics)', width: 13, value: (row) => row.gaUsers, format: '#,##0' },
    { header: 'Évolution', width: 10, value: (row, line) => (line === HEADER_ROW + 1 ? '' : { formula: `IF(C${line - 1}=0,"",C${line}/C${line - 1}-1)`, result: '' }), format: CHANGE_FORMAT },
    { header: 'Pages vues (Analytics)', width: 13, value: (row) => row.gaPageviews, format: '#,##0' },
    { header: 'Sessions', width: 10, value: (row) => row.gaSessions, format: '#,##0' },
    { header: 'Clics Google', width: 10, value: (row) => row.googleClicks, format: '#,##0' },
    { header: 'Évolution', width: 10, value: (row, line) => (line === HEADER_ROW + 1 ? '' : { formula: `IF(G${line - 1}=0,"",G${line}/G${line - 1}-1)`, result: '' }), format: CHANGE_FORMAT },
    { header: 'Impressions Google', width: 12, value: (row) => row.googleImpressions, format: '#,##0' },
    { header: 'Visiteurs (site)', width: 11, value: (row) => row.siteVisitors, format: '#,##0' },
    { header: 'Pages vues (site)', width: 11, value: (row) => row.sitePageviews, format: '#,##0' },
    { header: 'Inscrits newsletter', width: 11, value: (row) => row.newsletter, format: '#,##0' },
    { header: 'Messages', width: 10, value: (row) => row.contacts, format: '#,##0' },
    { header: 'Commentaires', width: 11, value: (row) => row.comments, format: '#,##0' },
    { header: 'Demandes de modèles', width: 12, value: (row) => row.resources, format: '#,##0' },
  ];
  const lastWeek = addTable(weeksSheet, 'Semaine par semaine', 'Du lundi au dimanche. Évolution : par rapport à la semaine d’avant (la première et la dernière semaine peuvent être incomplètes).', weekColumns, weeks);
  if (weeks.length) {
    colorChanges(weeksSheet, `D${HEADER_ROW + 2}:D${lastWeek}`);
    colorChanges(weeksSheet, `H${HEADER_ROW + 2}:H${lastWeek}`);
    const categories = weeks.map((row) => `Sem. ${short(row.week)}`);
    const categoriesRef = cellRef('Semaines', 1, HEADER_ROW + 1, 1, lastWeek);
    const series = (column: number, name: string, values: number[], color: string) => ({ name, nameRef: cellRef('Semaines', column, HEADER_ROW), categoriesRef, valuesRef: cellRef('Semaines', column, HEADER_ROW + 1, column, lastWeek), categories, values, color });
    charts.push({
      kind: 'column', title: 'Comparaison semaine par semaine', from: { col: 1, row: top + 19 }, to: { col: 13, row: top + 37 },
      series: [series(3, 'Visiteurs (Analytics)', weeks.map((row) => row.gaUsers), BLUE), series(7, 'Clics Google', weeks.map((row) => row.googleClicks), ORANGE), series(10, 'Visiteurs (site)', weeks.map((row) => row.siteVisitors), GREEN)],
    });
  }

  // Google Analytics
  if (history.ga.configured) {
    const ga = history.ga;
    const pagesSheet = workbook.addWorksheet('Pages (Analytics)');
    addTable(pagesSheet, 'Pages les plus vues', `Google Analytics, ${period}.`, [
      { header: 'Page', width: 60, value: (row) => row.path },
      { header: 'Pages vues', width: 12, value: (row) => row.pageviews, format: '#,##0' },
      { header: 'Visiteurs', width: 11, value: (row) => row.users, format: '#,##0' },
      { header: 'Durée moy. (s)', width: 12, value: (row) => row.duration, format: '#,##0' },
    ], ga.pages);
    if (ga.pages.length) {
      const count = Math.min(10, ga.pages.length);
      const categories = ga.pages.slice(0, count).map((row) => row.path);
      charts.push({
        kind: 'bar', title: 'Top 10 des pages (Analytics)', from: { col: 1, row: top + 38 }, to: { col: 7, row: top + 55 }, labels: true,
        series: [{ name: 'Pages vues', nameRef: cellRef('Pages (Analytics)', 2, HEADER_ROW), categoriesRef: cellRef('Pages (Analytics)', 1, HEADER_ROW + 1, 1, HEADER_ROW + count), valuesRef: cellRef('Pages (Analytics)', 2, HEADER_ROW + 1, 2, HEADER_ROW + count), categories, values: ga.pages.slice(0, count).map((row) => row.pageviews), color: BLUE }],
      });
    }
    addTable(workbook.addWorksheet('Sources (Analytics)'), 'Sources et supports', `D’où venaient les sessions, ${period}.`, [
      { header: 'Source / support', width: 40, value: (row) => row.source },
      { header: 'Sessions', width: 11, value: (row) => row.sessions, format: '#,##0' },
      { header: 'Visiteurs', width: 11, value: (row) => row.users, format: '#,##0' },
      { header: 'Sessions engagées', width: 14, value: (row) => row.engaged, format: '#,##0' },
    ], ga.sources);
    const channels = workbook.addWorksheet('Canaux (Analytics)');
    const lastChannel = addTable(channels, 'Canaux d’acquisition', `Regroupement de Google Analytics, ${period}.`, [
      { header: 'Canal', width: 30, value: (row) => row.channel },
      { header: 'Sessions', width: 11, value: (row) => row.sessions, format: '#,##0' },
    ], ga.channels);
    if (ga.channels.length) {
      charts.push({
        kind: 'doughnut', title: 'Canaux d’acquisition (Analytics)', from: { col: 1, row: top + 56 }, to: { col: 7, row: top + 73 },
        pointColors: ga.channels.map((_, index) => PALETTE[index % PALETTE.length]),
        series: [{ name: 'Sessions', nameRef: cellRef('Canaux (Analytics)', 2, HEADER_ROW), categoriesRef: cellRef('Canaux (Analytics)', 1, HEADER_ROW + 1, 1, lastChannel), valuesRef: cellRef('Canaux (Analytics)', 2, HEADER_ROW + 1, 2, lastChannel), categories: ga.channels.map((row) => row.channel), values: ga.channels.map((row) => row.sessions), color: BLUE }],
      });
    }
    const countries = workbook.addWorksheet('Pays (Analytics)');
    addTable(countries, 'Pays', `Visiteurs par pays, ${period}.`, [
      { header: 'Pays', width: 28, value: (row) => row.country },
      { header: 'Visiteurs', width: 11, value: (row) => row.users, format: '#,##0' },
      { header: 'Sessions', width: 11, value: (row) => row.sessions, format: '#,##0' },
    ], ga.countries);
    if (ga.countries.length) {
      const count = Math.min(10, ga.countries.length);
      charts.push({
        kind: 'bar', title: 'Top 10 des pays (Analytics)', from: { col: 7, row: top + 56 }, to: { col: 13, row: top + 73 }, labels: true,
        series: [{ name: 'Visiteurs', nameRef: cellRef('Pays (Analytics)', 2, HEADER_ROW), categoriesRef: cellRef('Pays (Analytics)', 1, HEADER_ROW + 1, 1, HEADER_ROW + count), valuesRef: cellRef('Pays (Analytics)', 2, HEADER_ROW + 1, 2, HEADER_ROW + count), categories: ga.countries.slice(0, count).map((row) => row.country), values: ga.countries.slice(0, count).map((row) => row.users), color: GREEN }],
      });
    }
    addTable(workbook.addWorksheet('Villes (Analytics)'), 'Villes', `Visiteurs par ville, ${period}.`, [
      { header: 'Ville', width: 26, value: (row) => row.city },
      { header: 'Pays', width: 22, value: (row) => row.country, align: 'left' },
      { header: 'Visiteurs', width: 11, value: (row) => row.users, format: '#,##0' },
    ], ga.cities);
    addTable(workbook.addWorksheet('Appareils (Analytics)'), 'Appareils', `Type d’appareil, ${period}.`, [
      { header: 'Appareil', width: 20, value: (row) => DEVICE[row.device] ?? row.device },
      { header: 'Visiteurs', width: 11, value: (row) => row.users, format: '#,##0' },
      { header: 'Sessions', width: 11, value: (row) => row.sessions, format: '#,##0' },
    ], ga.devices);
    addTable(workbook.addWorksheet('Événements (Analytics)'), 'Événements', `Actions mesurées par Google Analytics (clics, téléchargements, défilement…), ${period}.`, [
      { header: 'Événement', width: 30, value: (row) => row.name },
      { header: 'Nombre', width: 11, value: (row) => row.count, format: '#,##0' },
      { header: 'Visiteurs', width: 11, value: (row) => row.users, format: '#,##0' },
    ], ga.events);
  } else {
    const sheet = workbook.addWorksheet('Analytics');
    sheet.getCell(1, 1).value = 'Google Analytics indisponible';
    sheet.getCell(1, 1).font = { name: 'Calibri', size: 16, bold: true };
    sheet.getCell(2, 1).value = history.ga.reason;
    sheet.getColumn(1).width = 140;
  }

  // Google Search Console
  if (history.seo.configured) {
    const seo = history.seo;
    const columns = (first: string, width: number): Column<{ key: string; clicks: number; impressions: number; ctr: number; position: number }>[] => [
      { header: first, width, value: (row) => row.key },
      { header: 'Clics', width: 10, value: (row) => row.clicks, format: '#,##0' },
      { header: 'Impressions', width: 12, value: (row) => row.impressions, format: '#,##0' },
      { header: 'CTR', width: 9, value: (row) => row.ctr / 100, format: '0.0%' },
      { header: 'Position', width: 10, value: (row) => row.position, format: '0.0' },
    ];
    addTable(workbook.addWorksheet('Requêtes Google'), 'Requêtes Google', `Ce que les gens ont tapé dans Google avant de voir le site, ${period}.`, columns('Requête', 50), seo.queries);
    addTable(workbook.addWorksheet('Pages Google'), 'Pages dans Google', `Pages du site affichées dans Google, ${period}.`, columns('Page', 60), seo.pages);
    addTable(workbook.addWorksheet('Pays Google'), 'Pays (Google)', `Pays des recherches, ${period} (codes ISO à trois lettres).`, columns('Pays', 12), seo.countries);
  } else {
    const sheet = workbook.addWorksheet('Search Console');
    sheet.getCell(1, 1).value = 'Google Search Console indisponible';
    sheet.getCell(1, 1).font = { name: 'Calibri', size: 16, bold: true };
    sheet.getCell(2, 1).value = history.seo.reason;
    sheet.getColumn(1).width = 140;
  }

  const buffer = new Uint8Array(await workbook.xlsx.writeBuffer() as ArrayBuffer);
  return addChartsToWorkbook(buffer, 1, charts);
}
