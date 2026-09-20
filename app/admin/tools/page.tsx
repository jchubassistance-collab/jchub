'use client';

import { useEffect, useState } from 'react';

type Tool = { slug: string; name: string; description: string; category: string; icon: string; status?: string };

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  useEffect(() => { fetch('/api/admin/tools', { cache: 'no-store' }).then((response) => response.json()).then((data: { tools?: Tool[] }) => setTools(data.tools || [])); }, []);
  return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Catalogue</p><h1 className="mt-2 text-3xl font-black text-slate-950">Outils</h1><p className="mt-2 text-sm text-slate-600">Vue rapide des outils actuellement visibles sur JcHub.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <div key={tool.slug} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-3xl">{tool.icon}</div><h2 className="mt-3 font-bold">{tool.name}</h2><p className="mt-2 text-sm text-slate-600">{tool.description}</p><span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-indigo-600">{tool.category}</span></div>)}</div></div>;
}