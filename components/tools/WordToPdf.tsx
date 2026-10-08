'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileText, Loader2, UploadCloud } from 'lucide-react';

const MAX_WORD_SIZE_BYTES = 10 * 1024 * 1024;

export function WordToPdf() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('document.pdf');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setDownloadUrl(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith('.docx')) {
      setError('Sélectionne un document Word au format .docx.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_WORD_SIZE_BYTES) {
      setError('Le fichier dépasse la taille maximale de 10 Mo.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selected);
    setFileName(selected.name.replace(/\.docx$/i, '') + '.pdf');
  };

  const convert = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/tools/word-to-pdf', { method: 'POST', body: formData });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'La conversion a échoué.');
      }
      setDownloadUrl(URL.createObjectURL(await response.blob()));
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
        <input ref={inputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileChange} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50">
          <UploadCloud className="h-5 w-5" /> Choisir un document Word
        </button>
        <div className="mt-4 min-h-10 text-sm text-slate-300">{file ? <span className="font-medium text-white">{file.name}</span> : 'Aucun fichier sélectionné'}</div>
        <p className="text-xs text-slate-400">Format .docx · 10 Mo maximum</p>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <span className="flex items-center gap-2 font-semibold text-[#dfeeff]"><FileText className="h-4 w-4" /> Mise en page conservée</span>
        <span className="mt-1 block text-xs">Convertis ton document Word en PDF prêt à partager.</span>
      </div>

      <button type="button" disabled={!file || isLoading} onClick={convert} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
        {isLoading ? 'Conversion en cours…' : 'Convertir en PDF'}
      </button>
      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
      {downloadUrl && <a href={downloadUrl} download={fileName} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/20"><Download className="h-5 w-5" /> Télécharger le PDF</a>}
      <p className="text-center text-xs text-slate-400">Le document est converti côté serveur puis supprimé après traitement.</p>
    </div>
  );
}
