import { NextRequest, NextResponse } from 'next/server';
import { parseDelimitedText } from '@/lib/csv';
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
    return NextResponse.json({ error: 'Demande de conversion invalide.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('url' in body) || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'Fichier temporaire manquant.' }, { status: 400 });
  }

  const url = body.url;
  try {
    const file = await readTemporaryBlob(url, 'csv-to-excel');
    if (!/\.csv$|\.txt$/i.test(file.pathname)) {
      return NextResponse.json({ error: 'Le fichier doit être un CSV (.csv) ou un fichier texte tabulé.' }, { status: 400 });
    }
    const csvText = file.buffer.toString('utf8');
    const rows = parseDelimitedText(csvText, /\.txt$/i.test(file.pathname) ? '\t' : ',');
    if (!rows.length || !rows.some((row) => row.some((cell) => cell.length > 0))) {
      return NextResponse.json({ error: 'Le fichier CSV semble vide ou invalide.' }, { status: 400 });
    }

    const limited = await enforceDailyConversionQuota(request, 'csv-to-excel');
    if (limited) return limited;

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Données').addRows(rows);
    const output = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(output), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: 'Erreur lors de la conversion en Excel.' }, { status: 500 });
  } finally {
    await cleanUpTemporaryBlobs([url], 'csv-to-excel');
  }
}
