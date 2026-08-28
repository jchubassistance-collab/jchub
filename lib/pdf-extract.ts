// lib/pdf-extract.ts — Extraction de texte depuis un PDF
import pdf from 'pdf-parse';
import { Buffer } from 'buffer';

export type PdfMetadata = {
  text: string;
  numPages: number;
  info: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
};

/**
 * Extrait le texte et les métadonnées d'un PDF depuis un Buffer
 */
export async function extractPdfFromBuffer(buffer: Buffer): Promise<PdfMetadata> {
  try {
    const data = await pdf(buffer, {
      max: 50, // limite à 50 pages pour l'extraction de texte
    });

    return {
      text: data.text || '',
      numPages: data.numpages,
      info: {
        Title: data.info?.Title,
        Author: data.info?.Author,
        Subject: data.info?.Subject,
        Keywords: data.info?.Keywords,
        Creator: data.info?.Creator,
        Producer: data.info?.Producer,
        CreationDate: data.info?.CreationDate,
        ModDate: data.info?.ModDate,
      },
    };
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error('Impossible d\'extraire le texte du PDF');
  }
}

/**
 * Extrait un échantillon du texte (début, milieu, fin) pour analyse IA
 */
export function getPdfSample(text: string, maxLength = 8000): string {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;

  // Prendre le début + un échantillon du milieu + la fin
  const third = Math.floor(maxLength / 3);
  const start = cleanText.slice(0, third);
  const middle = cleanText.slice(cleanText.length / 2 - third / 2, cleanText.length / 2 + third / 2);
  const end = cleanText.slice(-third);

  return `${start}\n\n[...]\n\n${middle}\n\n[...]\n\n${end}`;
}
