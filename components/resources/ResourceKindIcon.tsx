import { FileSignature, ListChecks, ScrollText } from 'lucide-react';
import type { ResourceKind } from '@/lib/resources';

const ICONS = { cheatsheet: ScrollText, checklist: ListChecks, template: FileSignature } satisfies Record<ResourceKind, unknown>;

export function ResourceKindIcon({ kind, className }: { kind: ResourceKind; className?: string }) {
  const Icon = ICONS[kind];
  return <Icon className={className} aria-hidden="true" />;
}
