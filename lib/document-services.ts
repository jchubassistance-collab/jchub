import { Readable } from 'node:stream';

export function hasAdobePdfServicesConfig() {
  return Boolean(process.env.JCHUB_ADOBE_PDF_CLIENT_ID && process.env.JCHUB_ADOBE_PDF_CLIENT_SECRET);
}

export async function convertPdfWithAdobe(buffer: Buffer): Promise<Buffer> {
  if (!hasAdobePdfServicesConfig()) {
    throw new Error('Configuration Adobe PDF Services absente.');
  }

  const sdk = await import('@adobe/pdfservices-node-sdk');
  const credentials = new sdk.ServicePrincipalCredentials({
    clientId: process.env.JCHUB_ADOBE_PDF_CLIENT_ID!,
    clientSecret: process.env.JCHUB_ADOBE_PDF_CLIENT_SECRET!,
  });
  const pdfServices = new sdk.PDFServices({ credentials });
  const inputAsset = await pdfServices.upload({
    readStream: Readable.from(buffer),
    mimeType: sdk.MimeType.PDF,
  });
  const job = new sdk.ExportPDFJob({
    inputAsset,
    params: new sdk.ExportPDFParams({
      targetFormat: sdk.ExportPDFTargetFormat.DOCX,
    }),
  });
  const pollingURL = await pdfServices.submit({ job });
  const response = await pdfServices.getJobResult({
    pollingURL,
    resultType: sdk.ExportPDFResult,
  });
  if (!response.result) {
    throw new Error('Adobe PDF Services n’a retourné aucun document.');
  }
  const resultAsset = response.result.asset;
  const output = await pdfServices.getContent({ asset: resultAsset });
  const chunks: Buffer[] = [];

  for await (const chunk of output.readStream as AsyncIterable<Buffer | Uint8Array | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
