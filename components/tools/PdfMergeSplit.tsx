'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, Combine, Download, FileArchive, FileText, Loader2, Scissors, Trash2, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { pageGroupLabel, parsePageRanges, uniqueNames } from '@/lib/pdf-pages';
import { downloadName } from '@/lib/download-name';

const copy = bilingual({
  merge: 'Fusionner',
  split: 'Découper',
  modeLabel: 'Choisir l’opération',
  addMany: 'Ajouter des PDF',
  addOne: 'Choisir un PDF',
  replace: 'Choisir un autre PDF',
  dropHint: 'ou glisse tes fichiers ici',
  mergeLimits: (max: number) => `PDF uniquement · 50 Mo maximum par fichier · jusqu’à ${max} fichiers`,
  splitLimits: 'PDF uniquement · 50 Mo maximum',
  pages: (count: number) => `${count} page${count > 1 ? 's' : ''}`,
  reading: 'Lecture…',
  kilobytes: 'Ko',
  megabytes: 'Mo',
  moveUp: (name: string) => `Monter ${name}`,
  moveDown: (name: string) => `Descendre ${name}`,
  remove: (name: string) => `Retirer ${name}`,
  order: 'L’ordre de la liste est celui du PDF final. Utilise les flèches pour le changer.',
  needTwo: 'Ajoute au moins deux PDF à fusionner.',
  merging: 'Fusion en cours…',
  mergeButton: 'Fusionner les PDF',
  merged: (pages: number, size: string) => `PDF fusionné prêt : ${pages} pages, ${size}.`,
  downloadMerged: 'Télécharger le PDF fusionné',
  splitMode: 'Mode de découpe',
  modeExtract: 'Extraire ces pages dans un seul PDF',
  modeRanges: 'Un PDF par plage de pages',
  modeEach: 'Un PDF par page',
  ranges: 'Pages',
  rangesPlaceholder: 'Ex. 1-3, 5, 8-',
  rangesHelp: 'Sépare les plages par des virgules. « 8- » va jusqu’à la dernière page.',
  splitting: 'Découpe en cours…',
  splitButton: 'Découper le PDF',
  ready: (count: number) => `${count} fichier${count > 1 ? 's' : ''} prêt${count > 1 ? 's' : ''}.`,
  download: 'Télécharger',
  downloadZip: 'Tout télécharger (.zip)',
  privacy: 'Tout se passe dans ton navigateur : tes PDF ne sont envoyés à aucun serveur.',
  notPdf: 'Seuls les fichiers PDF sont acceptés.',
  tooLarge: (name: string) => `${name} dépasse la limite de 50 Mo.`,
  maxFiles: (max: number) => `Tu peux ajouter jusqu’à ${max} PDF.`,
  encrypted: (name: string) => `${name} est protégé par un mot de passe : retire la protection puis réessaie.`,
  unreadable: (name: string) => `${name} n’est pas un PDF lisible.`,
  failed: 'L’opération a échoué. Vérifie tes fichiers puis réessaie.',
  rangeEmpty: 'Indique les pages à garder, par exemple 1-3, 5.',
  rangeSyntax: (part: string) => `« ${part} » n’est pas une plage valide. Exemple : 1-3, 5, 8-.`,
  rangeOut: (part: string, count: number) => `« ${part} » ne correspond à aucune page entre 1 et ${count}.`,
  mergedName: 'fusion',
  pagesName: 'pages',
  selectionName: 'selection',
  zipName: 'decoupe',
}, {
  merge: 'Merge',
  split: 'Split',
  modeLabel: 'Choose the operation',
  addMany: 'Add PDFs',
  addOne: 'Choose a PDF',
  replace: 'Choose another PDF',
  dropHint: 'or drop your files here',
  mergeLimits: (max: number) => `PDF only · 50 MB maximum per file · up to ${max} files`,
  splitLimits: 'PDF only · 50 MB maximum',
  pages: (count: number) => `${count} page${count === 1 ? '' : 's'}`,
  reading: 'Reading…',
  kilobytes: 'KB',
  megabytes: 'MB',
  moveUp: (name: string) => `Move ${name} up`,
  moveDown: (name: string) => `Move ${name} down`,
  remove: (name: string) => `Remove ${name}`,
  order: 'The order of the list is the order of the final PDF. Use the arrows to change it.',
  needTwo: 'Add at least two PDFs to merge.',
  merging: 'Merging…',
  mergeButton: 'Merge the PDFs',
  merged: (pages: number, size: string) => `Merged PDF ready: ${pages} pages, ${size}.`,
  downloadMerged: 'Download the merged PDF',
  splitMode: 'Split mode',
  modeExtract: 'Extract these pages into one PDF',
  modeRanges: 'One PDF per page range',
  modeEach: 'One PDF per page',
  ranges: 'Pages',
  rangesPlaceholder: 'E.g. 1-3, 5, 8-',
  rangesHelp: 'Separate the ranges with commas. “8-” runs to the last page.',
  splitting: 'Splitting…',
  splitButton: 'Split the PDF',
  ready: (count: number) => `${count} file${count === 1 ? '' : 's'} ready.`,
  download: 'Download',
  downloadZip: 'Download all (.zip)',
  privacy: 'Everything happens in your browser: your PDFs are never sent to a server.',
  notPdf: 'Only PDF files are accepted.',
  tooLarge: (name: string) => `${name} exceeds the 50 MB limit.`,
  maxFiles: (max: number) => `You can add up to ${max} PDFs.`,
  encrypted: (name: string) => `${name} is password-protected: remove the protection and try again.`,
  unreadable: (name: string) => `${name} is not a readable PDF.`,
  failed: 'The operation failed. Check your files and try again.',
  rangeEmpty: 'Enter the pages to keep, for example 1-3, 5.',
  rangeSyntax: (part: string) => `“${part}” is not a valid range. Example: 1-3, 5, 8-.`,
  rangeOut: (part: string, count: number) => `“${part}” matches no page between 1 and ${count}.`,
  mergedName: 'merged',
  pagesName: 'pages',
  selectionName: 'selection',
  zipName: 'split',
});

type Copy = (typeof copy)['fr'];
type PdfItem = { id: string; file: File; pages?: number; error?: string };
type Output = { name: string; blob: Blob; pages: number };
type SplitMode = 'extract' | 'ranges' | 'each';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function isPdf(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

/** Page count of a PDF, or the message explaining why it cannot be used. */
async function readPdf(file: File, t: Copy): Promise<{ pages?: number; error?: string }> {
  const { PDFDocument, EncryptedPDFError } = await import('pdf-lib');
  try {
    const document = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
    return { pages: document.getPageCount() };
  } catch (cause) {
    return { error: cause instanceof EncryptedPDFError ? t.encrypted(file.name) : t.unreadable(file.name) };
  }
}

/** A new PDF made of the given pages (0-based) of each source, in order. */
async function buildPdf(parts: { file: File; pages?: number[] }[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();
  for (const part of parts) {
    const source = await PDFDocument.load(await part.file.arrayBuffer());
    const copied = await output.copyPages(source, part.pages ?? source.getPageIndices());
    copied.forEach((page) => output.addPage(page));
  }
  const bytes = await output.save();
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}

function formatSize(bytes: number, locale: string, t: Copy): string {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return bytes < 1024 * 1024 ? `${number.format(Math.max(1, Math.round(bytes / 1024)))} ${t.kilobytes}` : `${number.format(bytes / 1024 / 1024)} ${t.megabytes}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PdfMergeSplit() {
  const locale = useLocale();
  const t = copy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'merge' | 'split'>('merge');
  const [mergeFiles, setMergeFiles] = useState<PdfItem[]>([]);
  const [splitFile, setSplitFile] = useState<PdfItem | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('extract');
  const [ranges, setRanges] = useState('');
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const resetResult = () => { setOutputs([]); setError(''); };

  const addFiles = async (files: File[]) => {
    resetResult();
    const accepted: PdfItem[] = [];
    for (const file of files) {
      if (!isPdf(file)) { setError(t.notPdf); continue; }
      if (file.size > MAX_FILE_SIZE) { setError(t.tooLarge(file.name)); continue; }
      if (mode === 'merge' && mergeFiles.length + accepted.length >= MAX_FILES) { setError(t.maxFiles(MAX_FILES)); break; }
      accepted.push({ id: `${Date.now()}-${accepted.length}-${file.name}`, file });
      if (mode === 'split') break;
    }
    if (!accepted.length) return;
    if (mode === 'split') setSplitFile(accepted[0]);
    else setMergeFiles((current) => [...current, ...accepted]);
    // Page counts come in as each file is read; a protected or damaged file shows its error.
    for (const item of accepted) {
      const result = await readPdf(item.file, t);
      if (mode === 'split') setSplitFile((current) => current?.id === item.id ? { ...current, ...result } : current);
      else setMergeFiles((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...result } : entry));
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) void addFiles(Array.from(event.dataTransfer.files));
  };

  const move = (index: number, offset: number) => {
    resetResult();
    setMergeFiles((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + offset, 0, item);
      return next;
    });
  };

  const switchMode = (next: 'merge' | 'split') => {
    if (busy || next === mode) return;
    setMode(next);
    resetResult();
  };

  const readyToMerge = mergeFiles.length >= 2 && mergeFiles.every((item) => item.pages);

  const merge = async () => {
    if (!readyToMerge) { setError(t.needTwo); return; }
    setBusy(true); resetResult();
    try {
      const blob = await buildPdf(mergeFiles.map((item) => ({ file: item.file })));
      const pages = mergeFiles.reduce((sum, item) => sum + (item.pages ?? 0), 0);
      setOutputs([{ name: downloadName(mergeFiles[0].file.name, 'pdf', t.mergedName, 'document'), blob, pages }]);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  };

  const split = async () => {
    if (!splitFile?.pages) return;
    const pageCount = splitFile.pages;
    let groups: number[][];
    if (splitMode === 'each') {
      groups = Array.from({ length: pageCount }, (_, index) => [index + 1]);
    } else {
      const parsed = parsePageRanges(ranges, pageCount);
      if (!parsed.ok) {
        setOutputs([]);
        setError(parsed.reason === 'empty' ? t.rangeEmpty : parsed.reason === 'syntax' ? t.rangeSyntax(parsed.part) : t.rangeOut(parsed.part, pageCount));
        return;
      }
      groups = splitMode === 'extract' ? [parsed.groups.flat()] : parsed.groups;
    }
    setBusy(true); resetResult();
    try {
      // pages-1-3 for a run of pages, selection for pages picked here and there. Repeated labels
      // are numbered before -jchub is added, so that every name still ends with it.
      const label = (group: number[]) => isContiguous(group) ? `${t.pagesName}-${pageGroupLabel(group)}` : t.selectionName;
      const names = uniqueNames(groups.map(label)).map((detail) => downloadName(splitFile.file.name, 'pdf', detail, 'document'));
      const results: Output[] = [];
      for (let index = 0; index < groups.length; index += 1) {
        const blob = await buildPdf([{ file: splitFile.file, pages: groups[index].map((page) => page - 1) }]);
        results.push({ name: names[index], blob, pages: groups[index].length });
      }
      setOutputs(results);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!splitFile) return;
    const { zipSync } = await import('fflate');
    // PDFs are already compressed: storing them as they are keeps the ZIP fast to build.
    const files: Record<string, [Uint8Array, { level: 0 }]> = {};
    for (const output of outputs) files[output.name] = [new Uint8Array(await output.blob.arrayBuffer()), { level: 0 }];
    const zip = zipSync(files);
    downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), downloadName(splitFile.file.name, 'zip', t.zipName, 'document'));
  };

  const tabClass = (active: boolean) => `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base transition ${active ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'font-medium text-slate-500 hover:text-slate-900'}`;

  return <div className="space-y-5 text-slate-700">
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={t.modeLabel}>
      <button type="button" aria-pressed={mode === 'merge'} disabled={busy} onClick={() => switchMode('merge')} className={tabClass(mode === 'merge')}><Combine className="h-4 w-4" /> {t.merge}</button>
      <button type="button" aria-pressed={mode === 'split'} disabled={busy} onClick={() => switchMode('split')} className={tabClass(mode === 'split')}><Scissors className="h-4 w-4" /> {t.split}</button>
    </div>

    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition sm:py-8 ${dragging ? 'border-slate-500 bg-slate-50' : 'border-slate-300 bg-white'}`}
    >
      <input ref={inputRef} type="file" multiple={mode === 'merge'} accept="application/pdf,.pdf" className="hidden" onChange={onInput} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy || (mode === 'merge' && mergeFiles.length >= MAX_FILES)} className="mx-auto flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-lg font-medium text-slate-900 transition hover:border-slate-400 disabled:opacity-50"><UploadCloud className="h-5 w-5" /> {mode === 'merge' ? t.addMany : splitFile ? t.replace : t.addOne}</button>
      <p className="mt-3 text-sm text-slate-500">{t.dropHint} · {mode === 'merge' ? t.mergeLimits(MAX_FILES) : t.splitLimits}</p>
    </div>

    {mode === 'merge' && mergeFiles.length > 0 && <>
      <ol className="max-h-80 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
        {mergeFiles.map((item, index) => <li key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 ring-1 ring-slate-200">{index + 1}</span>
          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{item.file.name}</span><span className="text-xs text-slate-500">{formatSize(item.file.size, locale, t)} · {item.pages ? t.pages(item.pages) : item.error ? '' : t.reading}</span>{item.error && <span role="alert" className="mt-1 block text-xs text-rose-700">{item.error}</span>}</span>
          <button type="button" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={t.moveUp(item.file.name)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => move(index, 1)} disabled={busy || index === mergeFiles.length - 1} aria-label={t.moveDown(item.file.name)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          <button type="button" onClick={() => { resetResult(); setMergeFiles((current) => current.filter((entry) => entry.id !== item.id)); }} disabled={busy} aria-label={t.remove(item.file.name)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
        </li>)}
      </ol>
      <p className="text-sm text-slate-500">{t.order}</p>
    </>}

    {mode === 'split' && splitFile && <>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <FileText className="h-5 w-5 shrink-0 text-slate-500" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{splitFile.file.name}</span><span className="text-xs text-slate-500">{formatSize(splitFile.file.size, locale, t)} · {splitFile.pages ? t.pages(splitFile.pages) : splitFile.error ? '' : t.reading}</span>{splitFile.error && <span role="alert" className="mt-1 block text-xs text-rose-700">{splitFile.error}</span>}</span>
        <button type="button" onClick={() => { resetResult(); setSplitFile(null); }} disabled={busy} aria-label={t.remove(splitFile.file.name)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-base text-slate-600">{t.splitMode}<select value={splitMode} disabled={busy} onChange={(event) => { resetResult(); setSplitMode(event.target.value as SplitMode); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:border-slate-500 focus:outline-none"><option value="extract">{t.modeExtract}</option><option value="ranges">{t.modeRanges}</option><option value="each">{t.modeEach}</option></select></label>
        <label className={`text-base ${splitMode === 'each' ? 'text-slate-400' : 'text-slate-600'}`}>{t.ranges}<input value={ranges} disabled={busy || splitMode === 'each'} onChange={(event) => { resetResult(); setRanges(event.target.value); }} placeholder={t.rangesPlaceholder} inputMode="numeric" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none disabled:opacity-50" /></label>
      </div>
      {splitMode !== 'each' && <p className="text-sm text-slate-500">{t.rangesHelp}</p>}
    </>}

    <button
      type="button"
      disabled={busy || (mode === 'merge' ? !readyToMerge : !splitFile?.pages)}
      onClick={() => void (mode === 'merge' ? merge() : split())}
      className="flex min-h-16 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'merge' ? <Combine className="h-5 w-5" /> : <Scissors className="h-5 w-5" />}
      {busy ? (mode === 'merge' ? t.merging : t.splitting) : mode === 'merge' ? t.mergeButton : t.splitButton}
    </button>
    {mode === 'merge' && mergeFiles.length === 1 && !error && <p className="text-center text-sm text-slate-500">{t.needTwo}</p>}
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

    {outputs.length > 0 && <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p role="status" className="text-sm font-medium text-emerald-800">{mode === 'merge' ? t.merged(outputs[0].pages, formatSize(outputs[0].blob.size, locale, t)) : t.ready(outputs.length)}</p>
      {mode === 'merge'
        ? <button type="button" onClick={() => downloadBlob(outputs[0].blob, outputs[0].name)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 font-bold text-emerald-800 hover:bg-emerald-100"><Download className="h-5 w-5" /> {t.downloadMerged}</button>
        : <>
          <ul className="max-h-72 space-y-2 overflow-auto">
            {outputs.map((output) => <li key={output.name} className="flex items-center gap-3 rounded-lg bg-white p-3">
              <FileText className="h-5 w-5 shrink-0 text-emerald-700" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{output.name}</span><span className="text-xs text-slate-500">{t.pages(output.pages)} · {formatSize(output.blob.size, locale, t)}</span></span>
              <button type="button" onClick={() => downloadBlob(output.blob, output.name)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><Download className="h-4 w-4" /> {t.download}</button>
            </li>)}
          </ul>
          {outputs.length > 1 && <button type="button" onClick={() => void downloadZip()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 font-bold text-emerald-800 hover:bg-emerald-100"><FileArchive className="h-5 w-5" /> {t.downloadZip}</button>}
        </>}
    </div>}

    <p className="text-center text-sm text-slate-500">{t.privacy}</p>
  </div>;
}

function isContiguous(group: number[]): boolean {
  return group.every((page, index) => index === 0 || page === group[index - 1] + 1);
}
