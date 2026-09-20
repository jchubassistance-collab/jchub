'use client';

import { useRef, useState } from 'react';
import { Download, FileUp, Loader2, TableProperties } from 'lucide-react';
import * as XLSX from 'xlsx';

export function CsvToExcelTool() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('conversion.xlsx');

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
      setError('Le fichier doit être un CSV (.csv) ou un fichier texte tabulé.');
      setFile(null);
      return;
    }

    setFile(nextFile);
    setOutputName(nextFile.name.replace(/\.(csv|txt)$/i, '') + '.xlsx');
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Sélectionne un fichier CSV pour commencer.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDownloadUrl(null);

      const csvText = await file.text();
      const workbook = XLSX.read(csvText, {
        type: 'string',
        raw: false,
        FS: ',',
      });

      if (!workbook.SheetNames.length) {
        throw new Error('Le fichier CSV semble vide ou invalide.');
      }

      const outputBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : 'Erreur inconnue lors de la conversion.');
    } finally {
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
          Choisir un fichier CSV
        </button>

        <div className="mt-4 min-h-10 text-sm text-slate-300">
          {file ? <span className="font-medium text-white">Fichier sélectionné : {file.name}</span> : 'Aucun fichier sélectionné'}
        </div>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <span className="flex items-center gap-2 font-semibold text-[#dfeeff]"><TableProperties className="h-4 w-4" /> Conversion CSV → Excel</span>
        <span className="mt-1 block text-xs">Le tableau est transformé en fichier Excel .xlsx prêt à être utilisé.</span>
      </div>

      <button
        type="button"
        disabled={!file || isLoading}
        onClick={handleConvert}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <TableProperties className="h-5 w-5" />}
        {isLoading ? 'Conversion en cours…' : 'Convertir en Excel'}
      </button>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={outputName}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/20"
        >
          <Download className="h-5 w-5" />
          Télécharger le fichier Excel
        </a>
      )}
    </div>
  );
}
