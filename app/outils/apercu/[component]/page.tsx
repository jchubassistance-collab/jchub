import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolRenderer } from '@/components/tools/ToolRenderer';
import { isToolComponentName } from '@/lib/tool-components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aperçu d’outil',
  robots: { index: false, follow: false },
};

/**
 * Renders any registered tool component without its catalog entry, so a tool generated
 * from the admin can be tested on its Vercel preview before the Pull Request is merged.
 * Never available on the production deployment.
 */
export default async function ToolPreviewPage({ params }: { params: Promise<{ component: string }> }) {
  if (process.env.VERCEL_ENV === 'production') notFound();
  const { component } = await params;
  if (!isToolComponentName(component)) notFound();

  return (
    <div className="template-home min-h-screen bg-[#eff6ff] py-10 text-[#0f172a]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aperçu de test : cette page n’existe pas sur le site en production. Vérifie que l’outil fonctionne avec de vrais cas avant d’approuver.
        </p>
        <h1 className="mb-6 text-3xl font-black">{component}</h1>
        <div className="rounded-[2rem] border border-blue-100 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] md:p-8">
          <ToolRenderer component={component} />
        </div>
      </div>
    </div>
  );
}
