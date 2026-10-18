import { requestLocale } from '@/i18n/request-locale';

/**
 * English version of the messages API routes send to visitors. Routes keep writing
 * their messages in French; apiMessage() swaps in the English text when the call
 * comes from an English page. {name} placeholders are filled from `values`.
 */
const ENGLISH: Record<string, string> = {
  // lib/rate-limit.ts
  'Service temporairement indisponible.': 'Service temporarily unavailable.',
  'Trop de demandes. Réessaie dans quelques instants.': 'Too many requests. Try again in a moment.',
  'Tu as utilisé tes 5 recherches assistées du jour. Reviens demain 🙂': 'You have used your 5 assisted searches for today. Come back tomorrow 🙂',
  'Limite atteinte : 5 conversions par outil et par jour. Réessaie demain.': 'Limit reached: 5 conversions per tool per day. Try again tomorrow.',
  // lib/temporary-conversion-blobs.ts
  'Adresse du fichier temporaire invalide.': 'Invalid temporary file address.',
  'Fichier temporaire invalide.': 'Invalid temporary file.',
  'Le transfert a expiré. Téléverse le fichier à nouveau.': 'The transfer has expired. Upload the file again.',
  'Le fichier dépasse la taille maximale autorisée.': 'The file exceeds the maximum allowed size.',
  'Le type de fichier reçu n’est pas accepté.': 'The file type received is not accepted.',
  'Le fichier temporaire est introuvable.': 'The temporary file could not be found.',
  // Newsletter and contact
  'Le service newsletter est temporairement indisponible.': 'The newsletter service is temporarily unavailable.',
  'Adresse e-mail invalide.': 'Invalid email address.',
  'Inscription enregistrée. La synchronisation newsletter sera retentée prochainement.': 'Subscription saved. The newsletter sync will be retried soon.',
  'Impossible de t’inscrire pour le moment.': 'We can’t subscribe you right now.',
  'Le service de contact est temporairement indisponible.': 'The contact service is temporarily unavailable.',
  'Vérifie les champs du formulaire.': 'Check the form fields.',
  'Impossible d’envoyer ton message pour le moment.': 'We can’t send your message right now.',
  // File conversion tools
  'Demande de conversion invalide.': 'Invalid conversion request.',
  'Fichier temporaire manquant.': 'Missing temporary file.',
  'Le fichier doit être un CSV (.csv) ou un fichier texte tabulé.': 'The file must be a CSV (.csv) or a tab-separated text file.',
  'Le fichier CSV semble vide ou invalide.': 'The CSV file seems empty or invalid.',
  'Erreur lors de la conversion en Excel.': 'Error during the conversion to Excel.',
  'Le fichier doit être un classeur Excel .xlsx ou un CSV.': 'The file must be an Excel .xlsx workbook or a CSV.',
  'Aucune donnée exploitable n’a été trouvée dans le fichier.': 'No usable data was found in the file.',
  'Erreur lors de la conversion en CSV.': 'Error during the conversion to CSV.',
  'Paramètres de conversion invalides.': 'Invalid conversion settings.',
  'La résolution de cette image est trop élevée.': 'The resolution of this image is too high.',
  'La conversion de cette image a échoué.': 'The conversion of this image failed.',
  'Impossible de lire le fichier temporaire.': 'Could not read the temporary file.',
  'La taille totale des images ne doit pas dépasser 50 Mo.': 'The total size of the images must not exceed 50 MB.',
  'La création du PDF a échoué. Vérifie les images puis réessaie.': 'Creating the PDF failed. Check the images and try again.',
  'La configuration OCR.space est absente.': 'The OCR.space configuration is missing.',
  'Le fichier ne doit pas dépasser 10 Mo.': 'The file must not exceed 10 MB.',
  'Aucun fichier reçu.': 'No file received.',
  'Format accepté : JPG, PNG, GIF, WebP ou PDF.': 'Accepted formats: JPG, PNG, GIF, WebP or PDF.',
  'Le service OCR n’a pas pu analyser ce fichier.': 'The OCR service could not analyze this file.',
  'Erreur pendant l’analyse OCR.': 'Error during the OCR analysis.',
  'Demande de compression invalide.': 'Invalid compression request.',
  'Le fichier reçu n’est pas un PDF valide.': 'The file received is not a valid PDF.',
  'Le PDF ne doit pas dépasser {pages} pages.': 'The PDF must not exceed {pages} pages.',
  'La compression du PDF a échoué. Vérifie le fichier puis réessaie.': 'The PDF compression failed. Check the file and try again.',
  'Le fichier est trop volumineux. La taille maximale autorisée est de 4 Mo.': 'The file is too large. The maximum allowed size is 4 MB.',
  'Aucun fichier PDF reçu.': 'No PDF file received.',
  'Le fichier doit être un PDF.': 'The file must be a PDF.',
  'Erreur pendant la conversion du PDF en Word.': 'Error during the PDF to Word conversion.',
  'Le stockage temporaire des fichiers n’est pas configuré.': 'Temporary file storage is not configured.',
  'Demande de transfert invalide.': 'Invalid transfer request.',
  'Paramètres de transfert invalides.': 'Invalid transfer settings.',
  'Impossible de transférer le fichier temporairement.': 'Could not transfer the file temporarily.',
  'Demande de suppression invalide.': 'Invalid deletion request.',
  'Impossible de supprimer le fichier temporaire.': 'Could not delete the temporary file.',
  'Sélectionne un document Word au format .docx.': 'Select a Word document in .docx format.',
  'Le fichier doit peser moins de 10 Mo.': 'The file must weigh less than 10 MB.',
  'Le fichier reçu ne semble pas être un document DOCX valide.': 'The file received does not seem to be a valid DOCX document.',
  'La conversion Word vers PDF est momentanément indisponible.': 'Word to PDF conversion is temporarily unavailable.',
  'Erreur pendant la conversion du document Word en PDF.': 'Error during the Word to PDF conversion.',
};

/** `french` in the language of the page that called the API route. */
export function apiMessage(request: Request, french: string, values: Record<string, string | number> = {}): string {
  const template = requestLocale(request) === 'en' ? ENGLISH[french] ?? french : french;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in values ? String(values[name]) : placeholder));
}

/** Every French message with an English version, for the consistency test. */
export const TRANSLATED_API_MESSAGES = Object.keys(ENGLISH);
