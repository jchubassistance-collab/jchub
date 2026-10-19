'use client';

import { useRef, useState } from 'react';
import { Download, FileUp, Loader2, TableProperties } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';

const copy = bilingual({
  unsupported: 'Le fichier doit être un CSV (.csv) ou un fichier texte tabulé.',
  tooLarge: 'Le fichier ne doit pas dépasser 10 Mo.',
  selectCsv: 'Sélectionne un fichier CSV pour commencer.',
  unknown: 'Erreur inconnue lors de la conversion.',
  choose: 'Choisir un fichier CSV',
  selected: 'Fichier sélectionné : ',
  noFile: 'Aucun fichier sélectionné',
  title: 'Conversion CSV → Excel',
  text: 'Le tableau est transformé en classeur Excel .xlsx. Les champs CSV entre guillemets et les lignes tabulées sont pris en charge. Limite : 5 conversions par jour et par adresse IP ; fichier temporaire privé, supprimé après traitement.',
  converting: 'Conversion en cours…',
  convert: 'Convertir en Excel',
  download: 'Télécharger le fichier Excel',
}, {
  unsupported: 'The file must be a CSV (.csv) or a tab-separated text file.',
  tooLarge: 'The file must not exceed 10 MB.',
  selectCsv: 'Select a CSV file to get started.',
  unknown: 'Unknown error during the conversion.',
  choose: 'Choose a CSV file',
  selected: 'Selected file: ',
  noFile: 'No file selected',
  title: 'CSV → Excel conversion',
  text: 'The table is turned into an Excel .xlsx workbook. Quoted CSV fields and tab-separated lines are supported. Limit: 5 conversions per day per IP address; private temporary file, deleted after processing.',
  converting: 'Converting…',
  convert: 'Convert to Excel',
  download: 'Download the Excel file',
});
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function CsvToExcelTool() {
  const t = copy[useLocale()];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState(downloadName('conversion', 'xlsx'));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setError(null);
    setDownloadUrl(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    const name = nextFile.name.toLowerCase();
    const isSupported = /\.(csv|txt)$/i.test(name);
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
    setOutputName(downloadName(nextFile.name, 'xlsx', '', 'conversion'));
  };

  const handleConvert = async () => {
    if (!file) {
      setError(t.selectCsv);
      return;
    }

    const uploadedUrls: string[] = [];
    try {
      setIsLoading(true);
      setError(null);
      setDownloadUrl(null);

      const uploadUrl = await uploadConversionFile('csv-to-excel', file);
      uploadedUrls.push(uploadUrl);
      const response = await postConversion('/api/tools/csv-to-excel', { url: uploadUrl });
      setDownloadUrl(URL.createObjectURL(await response.blob()));
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : t.unknown);
    } finally {
      await cleanUpConversionFiles('csv-to-excel', uploadedUrls);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50"
        >
          <FileUp className="h-5 w-5" />
          {t.choose}
        </button>

        <div className="mt-4 min-h-10 text-sm text-slate-300">
          {file ? <span className="font-medium text-white">{t.selected}{file.name}</span> : t.noFile}
        </div>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <span className="flex items-center gap-2 font-semibold text-[#dfeeff]"><TableProperties className="h-4 w-4" /> {t.title}</span>
        <span className="mt-1 block text-xs">{t.text}</span>
      </div>

      <button
        type="button"
        disabled={!file || isLoading}
        onClick={handleConvert}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <TableProperties className="h-5 w-5" />}
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
