import { apiMessage } from '@/lib/api-messages';
import { NextRequest, NextResponse } from 'next/server';
import { parseDelimitedText, stringifyCsvRows, toCsvCellValue } from '@/lib/csv';
import { enforceDailyConversionQuota } from '@/lib/rate-limit';
import {
  cleanUpTemporaryBlobs,
  readTemporaryBlob,
  TemporaryBlobError,
} from '@/lib/temporary-conversion-blobs';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Demande de conversion invalide.') }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('url' in body) || typeof body.url !== 'string') {
    return NextResponse.json({ error: apiMessage(request, 'Fichier temporaire manquant.') }, { status: 400 });
  }

  const url = body.url;
  try {
    const file = await readTemporaryBlob(url, 'excel-to-csv');
    let csvContent: string;
    if (/\.csv$/i.test(file.pathname)) {
      const rows = parseDelimitedText(file.buffer.toString('utf8'), ',');
      csvContent = stringifyCsvRows(rows.map((row) => row.map(toCsvCellValue)));
    } else if (/\.xlsx$/i.test(file.pathname)) {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Uint8Array.from(file.buffer).buffer);
      const sheets = workbook.worksheets.map((worksheet) => {
        const rows: string[][] = [];
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          rows.push(Array.from(
            { length: row.cellCount },
            (_, index) => toCsvCellValue(row.getCell(index + 1).value),
          ));
        });
        return rows.length
          ? `# Feuille: ${worksheet.name}\n${stringifyCsvRows(rows)}`
          : `# Feuille: ${worksheet.name}`;
      });
      csvContent = sheets.join('\n\n');
    } else {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier doit être un classeur Excel .xlsx ou un CSV.') }, { status: 400 });
    }

    if (!csvContent.trim()) {
      return NextResponse.json({ error: apiMessage(request, 'Aucune donnée exploitable n’a été trouvée dans le fichier.') }, { status: 400 });
    }
    const limited = await enforceDailyConversionQuota(request, 'excel-to-csv');
    if (limited) return limited;

    return new NextResponse(csvContent, {
      headers: { 'Content-Type': 'text/csv;charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: apiMessage(request, error.message) }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Erreur lors de la conversion en CSV.') }, { status: 500 });
  } finally {
    await cleanUpTemporaryBlobs([url], 'excel-to-csv');
  }
}
