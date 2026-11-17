import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/**
 * Native Excel charts added to a workbook written by exceljs, which cannot draw charts itself.
 * Each chart is DrawingML that reads its figures from the workbook's cells (so it follows any
 * change made in Excel) and carries a copy of them, for viewers that do not recompute
 * (aperçus, Google Sheets, LibreOffice). Pure functions, checked by tests/insights-batch3.test.js.
 */

export type ChartSeries = {
  name: string;
  /** Cell holding the name, e.g. 'Évolution'!$C$1 (built with cellRef). */
  nameRef: string;
  categoriesRef: string;
  valuesRef: string;
  categories: string[];
  values: (number | null)[];
  color: string;
  dashed?: boolean;
};

export type ChartSpec = {
  kind: 'line' | 'column' | 'bar' | 'doughnut';
  title: string;
  series: ChartSeries[];
  /** Cells covered, 0-based: from the top-left corner of `from` to the top-left corner of `to`. */
  from: { col: number; row: number };
  to: { col: number; row: number };
  /** Doughnut: one color per slice. */
  pointColors?: string[];
  /** Shows each value on its bar. */
  labels?: boolean;
};

const NS_C = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const REL_DRAWING = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing';
const REL_CHART = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart';
const TYPE_DRAWING = 'application/vnd.openxmlformats-officedocument.drawing+xml';
const TYPE_CHART = 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml';

export function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** 'Sheet name'!$A$2:$A$8 — `col` and `row` are 1-based, as in Excel. */
export function cellRef(sheet: string, col: number, row: number, toCol = col, toRow = row): string {
  const letters = (index: number) => {
    let name = '';
    for (let rest = index; rest > 0; rest = Math.floor((rest - 1) / 26)) name = String.fromCharCode(65 + ((rest - 1) % 26)) + name;
    return name;
  };
  const start = `$${letters(col)}$${row}`;
  const end = `$${letters(toCol)}$${toRow}`;
  return `'${sheet.replace(/'/g, "''")}'!${start}${start === end ? '' : `:${end}`}`;
}

const color = (hex: string) => `<a:srgbClr val="${hex.replace('#', '').toUpperCase()}"/>`;
const text = (size: number, hex: string, bold = false) =>
  `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${size * 100}" b="${bold ? 1 : 0}"><a:solidFill>${color(hex)}</a:solidFill><a:latin typeface="Calibri"/></a:defRPr></a:pPr><a:endParaRPr lang="fr-FR"/></a:p></c:txPr>`;

function stringCache(values: string[]) {
  return `<c:strCache><c:ptCount val="${values.length}"/>${values.map((value, index) => `<c:pt idx="${index}"><c:v>${xmlEscape(value)}</c:v></c:pt>`).join('')}</c:strCache>`;
}
function numberCache(values: (number | null)[]) {
  return `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${values.length}"/>${values.map((value, index) => (value === null || !Number.isFinite(value) ? '' : `<c:pt idx="${index}"><c:v>${value}</c:v></c:pt>`)).join('')}</c:numCache>`;
}

function seriesXml(spec: ChartSpec, series: ChartSeries, index: number): string {
  const head = `<c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:strRef><c:f>${xmlEscape(series.nameRef)}</c:f>${stringCache([series.name])}</c:strRef></c:tx>`;
  const data = `<c:cat><c:strRef><c:f>${xmlEscape(series.categoriesRef)}</c:f>${stringCache(series.categories)}</c:strRef></c:cat><c:val><c:numRef><c:f>${xmlEscape(series.valuesRef)}</c:f>${numberCache(series.values)}</c:numRef></c:val>`;
  if (spec.kind === 'line') {
    const line = `<c:spPr><a:ln w="${series.dashed ? 19050 : 31750}" cap="rnd"><a:solidFill>${color(series.color)}</a:solidFill>${series.dashed ? '<a:prstDash val="dash"/>' : ''}<a:round/></a:ln></c:spPr>`;
    const marker = series.dashed ? '<c:marker><c:symbol val="none"/></c:marker>' : `<c:marker><c:symbol val="circle"/><c:size val="5"/><c:spPr><a:solidFill>${color(series.color)}</a:solidFill><a:ln w="9525"><a:solidFill>${color('FFFFFF')}</a:solidFill></a:ln></c:spPr></c:marker>`;
    return `<c:ser>${head}${line}${marker}${data}<c:smooth val="0"/></c:ser>`;
  }
  if (spec.kind === 'doughnut') {
    const points = (spec.pointColors ?? []).map((hex, point) => `<c:dPt><c:idx val="${point}"/><c:bubble3D val="0"/><c:spPr><a:solidFill>${color(hex)}</a:solidFill><a:ln w="19050"><a:solidFill>${color('FFFFFF')}</a:solidFill></a:ln></c:spPr></c:dPt>`).join('');
    const labels = `<c:dLbls><c:numFmt formatCode="0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${text(9, 'FFFFFF', true)}<c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/><c:showBubbleSize val="0"/><c:showLeaderLines val="0"/></c:dLbls>`;
    return `<c:ser>${head}${points}${labels}${data}</c:ser>`;
  }
  const fill = `<c:spPr><a:solidFill>${color(series.color)}</a:solidFill></c:spPr><c:invertIfNegative val="0"/>`;
  const labels = spec.labels ? `<c:dLbls><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${text(8, '475569')}<c:dLblPos val="outEnd"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>` : '';
  return `<c:ser>${head}${fill}${labels}${data}</c:ser>`;
}

function axes(horizontal: boolean): string {
  const grid = `<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill>${color('E2E8F0')}</a:solidFill></a:ln></c:spPr></c:majorGridlines>`;
  const line = `<c:spPr><a:ln w="9525"><a:solidFill>${color('CBD5E1')}</a:solidFill></a:ln></c:spPr>`;
  // A horizontal bar chart lists its categories from the top: reversed, with the value axis below.
  const category = `<c:catAx><c:axId val="500001"/><c:scaling><c:orientation val="${horizontal ? 'maxMin' : 'minMax'}"/></c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'l' : 'b'}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${line}${text(8, '64748B')}<c:crossAx val="500002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`;
  const value = `<c:valAx><c:axId val="500002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'b' : 'l'}"/>${grid}<c:numFmt formatCode="#,##0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${text(8, '64748B')}<c:crossAx val="500001"/><c:crosses val="${horizontal ? 'max' : 'autoZero'}"/><c:crossBetween val="between"/></c:valAx>`;
  return category + value;
}

export function chartXml(spec: ChartSpec): string {
  const series = spec.series.map((item, index) => seriesXml(spec, item, index)).join('');
  let plot: string;
  if (spec.kind === 'line') {
    plot = `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series}<c:marker val="1"/><c:axId val="500001"/><c:axId val="500002"/></c:lineChart>${axes(false)}`;
  } else if (spec.kind === 'doughnut') {
    plot = `<c:doughnutChart><c:varyColors val="1"/>${series}<c:firstSliceAng val="0"/><c:holeSize val="58"/></c:doughnutChart>`;
  } else {
    const horizontal = spec.kind === 'bar';
    plot = `<c:barChart><c:barDir val="${horizontal ? 'bar' : 'col'}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}<c:gapWidth val="${horizontal ? 60 : 80}"/><c:overlap val="-10"/><c:axId val="500001"/><c:axId val="500002"/></c:barChart>${axes(horizontal)}`;
  }
  const title = `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr><a:r><a:rPr lang="fr-FR" sz="1200" b="1"><a:solidFill>${color('0F172A')}</a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xmlEscape(spec.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`;
  const legend = `<c:legend><c:legendPos val="${spec.kind === 'doughnut' ? 'r' : 'b'}"/><c:overlay val="0"/>${text(9, '334155')}</c:legend>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><c:lang val="fr-FR"/><c:roundedCorners val="0"/><c:chart>${title}<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${plot}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:solidFill>${color('FFFFFF')}</a:solidFill><a:ln w="9525"><a:solidFill>${color('E2E8F0')}</a:solidFill></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr><a:latin typeface="Calibri"/></a:defRPr></a:pPr><a:endParaRPr lang="fr-FR"/></a:p></c:txPr></c:chartSpace>`;
}

function drawingXml(charts: ChartSpec[]): string {
  const anchors = charts.map((chart, index) => `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${chart.from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${chart.to.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.to.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${index + 2}" name="${xmlEscape(`Graphique ${index + 1}`)}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${NS_C}"><c:chart xmlns:c="${NS_C}" xmlns:r="${NS_R}" r:id="rId${index + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="${NS_A}">${anchors}</xdr:wsDr>`;
}

function relationships(items: { id: string; type: string; target: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.map((item) => `<Relationship Id="${item.id}" Type="${item.type}" Target="${item.target}"/>`).join('')}</Relationships>`;
}

/** Elements that must come after <drawing> in a worksheet (ECMA-376 order). */
const AFTER_DRAWING = ['<legacyDrawing', '<legacyDrawingHF', '<drawingHF', '<picture', '<oleObjects', '<controls', '<webPublishItems', '<tableParts', '<extLst', '</worksheet>'];

/** Adds `charts` to the sheet stored as xl/worksheets/sheet{sheetNumber}.xml of an .xlsx file. */
export function addChartsToWorkbook(xlsx: Uint8Array, sheetNumber: number, charts: ChartSpec[]): Uint8Array {
  if (!charts.length) return xlsx;
  const files = unzipSync(xlsx);
  const sheetPath = `xl/worksheets/sheet${sheetNumber}.xml`;
  if (!files[sheetPath]) throw new Error(`Feuille ${sheetPath} absente du classeur.`);
  const next = (prefix: string) => {
    let number = 1;
    while (files[`${prefix}${number}.xml`]) number += 1;
    return number;
  };
  const drawingNumber = next('xl/drawings/drawing');
  const firstChart = next('xl/charts/chart');
  const contentTypes: string[] = [`<Override PartName="/xl/drawings/drawing${drawingNumber}.xml" ContentType="${TYPE_DRAWING}"/>`];

  charts.forEach((chart, index) => {
    files[`xl/charts/chart${firstChart + index}.xml`] = strToU8(chartXml(chart));
    contentTypes.push(`<Override PartName="/xl/charts/chart${firstChart + index}.xml" ContentType="${TYPE_CHART}"/>`);
  });
  files[`xl/drawings/drawing${drawingNumber}.xml`] = strToU8(drawingXml(charts));
  files[`xl/drawings/_rels/drawing${drawingNumber}.xml.rels`] = strToU8(relationships(charts.map((_, index) => ({ id: `rId${index + 1}`, type: REL_CHART, target: `../charts/chart${firstChart + index}.xml` }))));

  // The sheet points to the drawing through its relationships.
  const relsPath = `xl/worksheets/_rels/sheet${sheetNumber}.xml.rels`;
  const drawingRelId = 'rIdJcHubDrawing';
  const drawingRel = `<Relationship Id="${drawingRelId}" Type="${REL_DRAWING}" Target="../drawings/drawing${drawingNumber}.xml"/>`;
  files[relsPath] = files[relsPath]
    ? strToU8(strFromU8(files[relsPath]).replace('</Relationships>', `${drawingRel}</Relationships>`))
    : strToU8(relationships([{ id: drawingRelId, type: REL_DRAWING, target: `../drawings/drawing${drawingNumber}.xml` }]));

  let sheet = strFromU8(files[sheetPath]);
  if (!/<worksheet[^>]*xmlns:r=/.test(sheet)) sheet = sheet.replace('<worksheet', `<worksheet xmlns:r="${NS_R}"`);
  const position = Math.min(...AFTER_DRAWING.map((tag) => sheet.indexOf(tag)).filter((index) => index >= 0));
  sheet = `${sheet.slice(0, position)}<drawing r:id="${drawingRelId}"/>${sheet.slice(position)}`;
  files[sheetPath] = strToU8(sheet);

  files['[Content_Types].xml'] = strToU8(strFromU8(files['[Content_Types].xml']).replace('</Types>', `${contentTypes.join('')}</Types>`));
  return zipSync(files, { level: 6 });
}
