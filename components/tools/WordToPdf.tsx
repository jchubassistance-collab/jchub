'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileText, Loader2, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  selectDocx: 'Sélectionne un document Word au format .docx.',
  tooLarge: 'Le fichier dépasse la taille maximale de 10 Mo.',
  unknown: 'Erreur inconnue.',
  choose: 'Choisir un document Word',
  noFile: 'Aucun fichier sélectionné',
  formats: 'Format .docx · 10 Mo maximum',
  layout: 'Mise en page conservée',
  layoutText: 'Convertis ton document Word en PDF prêt à partager.',
  converting: 'Conversion en cours…',
  convert: 'Convertir en PDF',
  download: 'Télécharger le PDF',
  quota: '5 conversions par jour et par adresse IP. Le document est transféré dans un espace privé temporaire, puis supprimé après traitement.',
}, {
  selectDocx: 'Select a Word document in .docx format.',
  tooLarge: 'The file exceeds the maximum size of 10 MB.',
  unknown: 'Unknown error.',
  choose: 'Choose a Word document',
  noFile: 'No file selected',
  formats: '.docx format · 10 MB maximum',
  layout: 'Layout preserved',
  layoutText: 'Convert your Word document into a PDF ready to share.',
  converting: 'Converting…',
  convert: 'Convert to PDF',
  download: 'Download the PDF',
  quota: '5 conversions per day per IP address. The document is transferred to a temporary private space, then deleted after processing.',
});
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';
import { downloadName } from '@/lib/download-name';

const MAX_WORD_SIZE_BYTES = 10 * 1024 * 1024;

export function WordToPdf() {
  const t = copy[useLocale()];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState(downloadName('document', 'pdf'));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setDownloadUrl(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith('.docx')) {
      setError(t.selectDocx);
      setFile(null);
      return;
    }
    if (selected.size > MAX_WORD_SIZE_BYTES) {
      setError(t.tooLarge);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selected);
    setFileName(downloadName(selected.name, 'pdf', '', 'document'));
  };

  const convert = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setDownloadUrl(null);
    const uploadedUrls: string[] = [];
    try {
      const url = await uploadConversionFile('word-to-pdf', file);
      uploadedUrls.push(url);
      const response = await postConversion('/api/tools/word-to-pdf', { url });
      setDownloadUrl(URL.createObjectURL(await response.blob()));
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.unknown);
    } finally {
      await cleanUpConversionFiles('word-to-pdf', uploadedUrls);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
        <input ref={inputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileChange} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50">
          <UploadCloud className="h-5 w-5" /> {t.choose}
        </button>
        <div className="mt-4 min-h-10 text-sm text-slate-300">{file ? <span className="font-medium text-white">{file.name}</span> : t.noFile}</div>
        <p className="text-xs text-slate-400">{t.formats}</p>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <span className="flex items-center gap-2 font-semibold text-[#dfeeff]"><FileText className="h-4 w-4" /> {t.layout}</span>
        <span className="mt-1 block text-xs">{t.layoutText}</span>
      </div>

      <button type="button" disabled={!file || isLoading} onClick={convert} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
        {isLoading ? t.converting : t.convert}
      </button>
      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
      {downloadUrl && <a href={downloadUrl} download={fileName} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/20"><Download className="h-5 w-5" /> {t.download}</a>}
      <p className="text-center text-xs text-slate-400">{t.quota}</p>
    </div>
  );
}
