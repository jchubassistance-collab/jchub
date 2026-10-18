import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

// Use these instead of next/link and next/navigation on public pages: they keep the
// visitor in their language and translate the address (/outils ↔ /en/tools).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
