'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ResourceKindIcon } from '@/components/resources/ResourceKindIcon';
import type { ResourceKind } from '@/lib/resources';

export type LibraryItem = {
  id: string;
  kind: ResourceKind;
  title: string;
  summary: string;
  href: string;
  access: string;
  format: string;
};

type Labels = {
  all: string;
  filterLabel: string;
  kinds: Record<ResourceKind, string>;
  open: string;
  empty: string;
};

const ALL = 'all';

/** Every resource, filtered by type. Each one opens its own page. */
export function ResourceLibrary({ items, labels }: { items: LibraryItem[]; labels: Labels }) {
  const [kind, setKind] = useState<ResourceKind | typeof ALL>(ALL);
  const kinds = (Object.keys(labels.kinds) as ResourceKind[]).filter((value) => items.some((item) => item.kind === value));
  const shown = kind === ALL ? items : items.filter((item) => item.kind === kind);
  const chip = (active: boolean) => `shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-blue-800'}`;

  return (
    <div>
      <div role="group" aria-label={labels.filterLabel} className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1">
        <button type="button" aria-pressed={kind === ALL} onClick={() => setKind(ALL)} className={chip(kind === ALL)}>
          {labels.all} <span className="ml-1 opacity-70">{items.length}</span>
        </button>
        {kinds.map((value) => (
          <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={chip(kind === value)}>
            {labels.kinds[value]} <span className="ml-1 opacity-70">{items.filter((item) => item.kind === value).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? <p className="text-slate-600">{labels.empty}</p> : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => (
            <li key={item.id}>
              <NextLink href={item.href} className="group flex h-full flex-col rounded-[1.25rem] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,.05)] transition duration-300 hover:shadow-[0_18px_40px_rgba(37,99,235,.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span className="flex items-center justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eff6ff] text-blue-700"><ResourceKindIcon kind={item.kind} className="h-5 w-5" /></span>
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{labels.kinds[item.kind]}</span>
                </span>
                <span className="mt-5 text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{item.title}</span>
                <span className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.summary}</span>
                <span className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-blue-800">{item.access}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.format}</span>
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">{labels.open} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
