'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  unsupported: 'Le fichier doit être un classeur Excel .xlsx ou un CSV.',
  tooLarge: 'Le fichier ne doit pas dépasser 10 Mo.',
  selectFile: 'Sélectionne un fichier Excel ou CSV pour commencer.',
  unknown: 'Erreur inconnue lors de la conversion.',
  choose: 'Choisir un fichier .xlsx ou CSV',
  selected: 'Fichier sélectionné : ',
  noFile: 'Aucun fichier sélectionné',
  title: 'Conversion Excel → CSV',
  text: 'Les classeurs .xlsx sont exportés en CSV, feuille par feuille. Les formules sont remplacées par leur résultat enregistré. Limite : 5 conversions par jour et par adresse IP ; fichier temporaire privé, supprimé après traitement.',
  converting: 'Conversion en cours…',
  convert: 'Convertir en CSV',
  download: 'Télécharger le CSV',
}, {
  unsupported: 'The file must be an Excel .xlsx workbook or a CSV.',
  tooLarge: 'The file must not exceed 10 MB.',
  selectFile: 'Select an Excel or CSV file to get started.',
  unknown: 'Unknown error during the conversion.',
  choose: 'Choose an .xlsx or CSV file',
  selected: 'Selected file: ',
  noFile: 'No file selected',
  title: 'Excel → CSV conversion',
  text: '.xlsx workbooks are exported to CSV, sheet by sheet. Formulas are replaced by their saved result. Limit: 5 conversions per day per IP address; private temporary file, deleted after processing.',
  converting: 'Converting…',
  convert: 'Convert to CSV',
  download: 'Download the CSV',
});
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ExcelToCsvTool() {
  const t = copy[useLocale()];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('conversion.csv');

  useEffect(() => {
    if (downloadUrl) return () => URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setError(null);
    setDownloadUrl(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    const name = nextFile.name.toLowerCase();
    const isSupported = /\.(xlsx|csv)$/i.test(name);
    if (!isSupported) {
      setError(t.unsupported);
      setFile(null);
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError(t.tooLarge);
      setFile(null);
      return;
    }

    setFile(nextFile);
    setOutputName(nextFile.name.replace(/\.(xlsx|csv)$/i, '') + '.csv');
  };

  const handleConvert = async () => {
    if (!file) {
      setError(t.selectFile);
      return;
    }

    const uploadedUrls: string[] = [];
    try {
      setIsLoading(true);
      setError(null);
      setDownloadUrl(null);

      const uploadUrl = await uploadConversionFile('excel-to-csv', file);
      uploadedUrls.push(uploadUrl);
      const response = await postConversion('/api/tools/excel-to-csv', { url: uploadUrl });
      const blob = await response.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : t.unknown);
    } finally {
      await cleanUpConversionFiles('excel-to-csv', uploadedUrls);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50"
        >
          <UploadCloud className="h-5 w-5" />
          {t.choose}
        </button>

        <div className="mt-4 min-h-10 text-sm text-slate-300">
          {file ? <span className="font-medium text-white">{t.selected}{file.name}</span> : t.noFile}
        </div>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <span className="flex items-center gap-2 font-semibold text-[#dfeeff]"><FileSpreadsheet className="h-4 w-4" /> {t.title}</span>
        <span className="mt-1 block text-xs">{t.text}</span>
      </div>

      <button
        type="button"
        disabled={!file || isLoading}
        onClick={handleConvert}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
        {isLoading ? t.converting : t.convert}
      </button>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={outputName}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/20"
        >
          <Download className="h-5 w-5" />
          {t.download}
        </a>
      )}
    </div>
  );
}
