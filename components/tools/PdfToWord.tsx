'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileText, Loader2, ScanLine, UploadCloud } from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';

const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024;

export function PdfToWord() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [hasConverted, setHasConverted] = useState(false);
  const [fileName, setFileName] = useState<string>('document.docx');
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setError(null);
    setDownloadUrl(null);
    setHasConverted(false);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!nextFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Le fichier doit être un PDF.');
      setFile(null);
      return;
    }

    if (nextFile.size > MAX_PDF_SIZE_BYTES) {
      setError('Le fichier est trop volumineux. La taille maximale autorisée est de 4 Mo.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFile(nextFile);
    setFileName(nextFile.name.replace(/\.pdf$/i, '') + '.docx');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Sélectionne un fichier PDF pour commencer.');
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setError('Le fichier est trop volumineux. La taille maximale autorisée est de 4 Mo.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDownloadUrl(null);
      setHasConverted(false);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('turnstileToken', turnstileToken);

      const response = await fetch('/api/tools/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'La conversion a échoué.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setHasConverted(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur inconnue.');
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
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50"
        >
          <UploadCloud className="h-5 w-5" />
          Choisir un fichier PDF
        </button>

        <div className="mt-4 min-h-10 text-sm text-slate-300">
          {file ? <span className="font-medium text-white">Fichier sélectionné : {file.name}</span> : 'Aucun fichier sélectionné'}
        </div>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <span className="flex items-center gap-2 font-semibold text-[#dfeeff]"><ScanLine className="h-4 w-4" /> Fidélité visuelle</span>
        <span className="mt-1 block text-xs">Le design du PDF est conservé dans le document Word.</span>
        <span className="mt-2 block text-[11px] text-slate-400">Taille maximale du fichier : 4 Mo.</span>
      </div>

      <button
        type="button"
        disabled={!file || isLoading}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
        {isLoading ? 'Conversion en cours…' : 'Convertir en Word'}
      </button>

      <TurnstileWidget onToken={setTurnstileToken} />

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

      {hasConverted && (
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
          Le document Word conserve le rendu visuel du PDF. Le texte peut être moins facilement modifiable.
        </div>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={fileName}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/20"
        >
          <Download className="h-5 w-5" />
          Télécharger le document Word
        </a>
      )}

      <p className="text-center text-xs text-slate-400">
        Le PDF est traité côté serveur, puis supprimé automatiquement après conversion. Seules les stats Firebase sont enregistrées.
      </p>
    </div>
  );
}
