'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import type { Resource } from '@/lib/resources';
import { paintResourcePdf } from '@/lib/resource-pdf';
import { downloadName } from '@/lib/download-name';
import { trackEvent } from '@/lib/analytics-client';

const copy = bilingual({
  download: 'Télécharger le PDF',
  preparing: 'Préparation…',
  failed: 'Le PDF n’a pas pu être créé. Réessaie.',
}, {
  download: 'Download the PDF',
  preparing: 'Preparing…',
  failed: 'The PDF could not be created. Try again.',
});

/** Draws the PDF of a free resource in the browser and saves it. */
export function ResourcePdfButton({ resource }: { resource: Resource }) {
  const locale = useLocale();
  const t = copy[locale];
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  const download = async () => {
    setState('busy');
    try {
      const { jsPDF } = await import('jspdf');
      paintResourcePdf(jsPDF, resource, locale).save(downloadName(resource[locale].slug, 'pdf'));
      trackEvent('resource_download', { resource: resource.id, format: 'pdf' });
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <div>
      <button type="button" onClick={download} disabled={state === 'busy'} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:bg-[#60a5fa] hover:shadow-lg disabled:cursor-wait disabled:opacity-70">
        {state === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {state === 'busy' ? t.preparing : t.download}
      </button>
      {state === 'error' && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{t.failed}</p>}
    </div>
  );
}
