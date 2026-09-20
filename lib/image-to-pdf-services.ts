import { Readable } from 'node:stream';

export function hasAdobeImagePdfConfig() {
  return Boolean(process.env.ADOBE_PDF_CLIENT_ID && process.env.ADOBE_PDF_CLIENT_SECRET);
}

export async function convertImageToPdfWithAdobe(buffer: Buffer, mimeType: 'image/jpeg' | 'image/png'): Promise<Buffer> {
  if (!hasAdobeImagePdfConfig()) {
    throw new Error('Configuration Adobe Image vers PDF absente.');
  }

  const sdk = await import('@adobe/pdfservices-node-sdk');
  const credentials = new sdk.ServicePrincipalCredentials({
    clientId: process.env.ADOBE_PDF_CLIENT_ID!,
    clientSecret: process.env.ADOBE_PDF_CLIENT_SECRET!,
  });
  const pdfServices = new sdk.PDFServices({ credentials });
  const inputAsset = await pdfServices.upload({
    readStream: Readable.from(buffer),
    mimeType,
  });
  const job = new sdk.CreatePDFJob({ inputAsset });
  const pollingURL = await pdfServices.submit({ job });
  const response = await pdfServices.getJobResult({
    pollingURL,
    resultType: sdk.CreatePDFResult,
  });
  if (!response.result) {
    throw new Error('Adobe PDF Services n’a retourné aucun PDF.');
  }

  return readAdobeAsset(pdfServices, response.result.asset);
}

export async function convertImageToOcrPdfWithAdobe(buffer: Buffer, mimeType: 'image/jpeg' | 'image/png'): Promise<Buffer> {
  if (!hasAdobeImagePdfConfig()) {
    throw new Error('Configuration Adobe OCR absente.');
  }

  const sdk = await import('@adobe/pdfservices-node-sdk');
  const credentials = new sdk.ServicePrincipalCredentials({
    clientId: process.env.ADOBE_PDF_CLIENT_ID!,
    clientSecret: process.env.ADOBE_PDF_CLIENT_SECRET!,
  });
  const pdfServices = new sdk.PDFServices({ credentials });
  const imageAsset = await pdfServices.upload({
    readStream: Readable.from(buffer),
    mimeType,
  });
  const createJob = new sdk.CreatePDFJob({ inputAsset: imageAsset });
  const createPollingUrl = await pdfServices.submit({ job: createJob });
  const createResponse = await pdfServices.getJobResult({
    pollingURL: createPollingUrl,
    resultType: sdk.CreatePDFResult,
  });
  if (!createResponse.result) {
    throw new Error('Adobe n’a pas créé le PDF intermédiaire.');
  }

  const ocrInput = await pdfServices.getContent({ asset: createResponse.result.asset });
  const ocrInputChunks: Buffer[] = [];
  for await (const chunk of ocrInput.readStream as AsyncIterable<Buffer | Uint8Array | string>) {
    ocrInputChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const pdfAsset = await pdfServices.upload({
    readStream: Readable.from(Buffer.concat(ocrInputChunks)),
    mimeType: sdk.MimeType.PDF,
  });
  const ocrJob = new sdk.OCRJob({
    inputAsset: pdfAsset,
    params: new sdk.OCRParams({
      ocrLocale: sdk.OCRSupportedLocale.FR_FR,
      ocrType: sdk.OCRSupportedType.SEARCHABLE_IMAGE_EXACT,
    }),
  });
  const ocrPollingUrl = await pdfServices.submit({ job: ocrJob });
  const ocrResponse = await pdfServices.getJobResult({
    pollingURL: ocrPollingUrl,
    resultType: sdk.OCRResult,
  });
  if (!ocrResponse.result) {
    throw new Error('Adobe n’a pas terminé la reconnaissance OCR.');
  }

  return readAdobeAsset(pdfServices, ocrResponse.result.asset);
}

async function readAdobeAsset(pdfServices: any, asset: any): Promise<Buffer> {
  const output = await pdfServices.getContent({ asset });
  const chunks: Buffer[] = [];
  for await (const chunk of output.readStream as AsyncIterable<Buffer | Uint8Array | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
