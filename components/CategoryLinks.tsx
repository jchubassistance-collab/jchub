import type { ComponentProps, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type CategoryLink = {
  key: string;
  href: ComponentProps<typeof Link>['href'];
  label: string;
  /** Second line, e.g. "4 outils". */
  detail: string;
  icon: ReactNode;
};

/** Cards leading to the category pages of the tools or of the blog. */
export function CategoryLinks({ items, label }: { items: CategoryLink[]; label: string }) {
  return (
    <nav aria-label={label} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="template-home__partner group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 hover:border-blue-300"
        >
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl text-blue-700">{item.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">{item.label}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-700" aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}
