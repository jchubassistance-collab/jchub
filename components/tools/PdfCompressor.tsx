'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileDown, FileText, Loader2, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';

const MAX_FILE_SIZE = 30 * 1024 * 1024;

export function PdfCompressor() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; originalSize: number; compressedSize: number; name: string; keptOriginal: boolean } | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setResult(null);
    setError(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!nextFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Le fichier doit être un PDF.');
      setFile(null);
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setError('Le fichier est trop volumineux. La taille maximale autorisée est de 30 Mo.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFile(nextFile);
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Sélectionne un fichier PDF pour commencer.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const uploadedUrls: string[] = [];
    try {
      const url = await uploadConversionFile('pdf-compressor', file);
      uploadedUrls.push(url);
      const response = await postConversion('/api/tools/pdf-compressor', { url });
      const blob = await response.blob();
      const keptOriginal = response.headers.get('X-Pdf-Original-Kept') === 'true';
      setResult({
        url: URL.createObjectURL(blob),
        originalSize: file.size,
        compressedSize: blob.size,
        name: keptOriginal ? file.name : file.name.replace(/\.pdf$/i, '') + '-compacte.pdf',
        keptOriginal,
      });
    } catch (compressError) {
      setError(compressError instanceof Error ? compressError.message : 'La compression a échoué.');
    } finally {
      await cleanUpConversionFiles('pdf-compressor', uploadedUrls);
      setIsLoading(false);
    }
  };

  const reductionPercent = result
    ? Math.max(0, Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100))
    : 0;

  return (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50"
        >
          <UploadCloud className="h-5 w-5" />
          Choisir un PDF
        </button>

        <div className="mt-4 min-h-10 text-sm text-slate-300">
          {file ? <span className="font-medium text-white">Fichier sélectionné : {file.name}</span> : 'Aucun fichier sélectionné'}
        </div>
      </div>

      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2 font-semibold text-[#dfeeff]">
          <Sparkles className="h-4 w-4 text-blue-300" />
          Objectif : réduire un PDF 15 Mo à moins de 2 Mo
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Ton PDF est envoyé dans un espace privé temporaire, traité sur le serveur puis supprimé. Maximum 100 pages et 5 compressions par jour et par adresse IP.
        </p>
      </div>

      <button
        type="button"
        disabled={!file || isLoading}
        onClick={handleCompress}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
        {isLoading ? 'Compression en cours…' : 'Compresser le PDF'}
      </button>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

      {result && (
        <div className={`space-y-3 rounded-2xl border px-4 py-3 text-sm ${result.keptOriginal ? 'border-amber-400/30 bg-amber-500/10 text-amber-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'}`}>
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            {result.keptOriginal ? 'PDF déjà optimisé' : 'Compression terminée'}
          </div>
          {result.keptOriginal && <p className="text-xs">La recompression aurait augmenté la taille. Le PDF original est conservé sans modification.</p>}
          <div className="flex flex-wrap gap-3 text-xs">
            <span>Avant : {(result.originalSize / 1024 / 1024).toFixed(2)} Mo</span>
            <span>Après : {(result.compressedSize / 1024 / 1024).toFixed(2)} Mo</span>
            <span>Réduction : {reductionPercent}%</span>
          </div>
          <a
            href={result.url}
            download={result.name}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-bold transition ${result.keptOriginal ? 'border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20' : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'}`}
          >
            <Download className="h-5 w-5" />
            {result.keptOriginal ? 'Télécharger le PDF original' : 'Télécharger le PDF compressé'}
          </a>
        </div>
      )}

      <div className="rounded-xl border border-[#9ccbff]/20 bg-[#071526] p-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-300">
          <FileDown className="h-4 w-4" />
          Astuce utile
        </div>
        <p className="mt-2">
          Pour un envoi par e-mail ou un dépôt sur un portail, cible souvent un fichier en dessous de 2 Mo. La compaction réduit la qualité d’image si nécessaire.
        </p>
      </div>
    </div>
  );
}
