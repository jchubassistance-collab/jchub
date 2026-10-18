'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Check, Copy, Eye, Linkedin, MessageCircle, Twitter } from 'lucide-react';
import { trackEvent } from '@/lib/analytics-client';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  views: 'vues',
  share: 'Partager',
  shareTwitter: 'Partager sur Twitter',
  shareLinkedin: 'Partager sur LinkedIn',
  copyLink: 'Copier le lien',
  copied: 'Copié',
  link: 'Lien',
}, {
  views: 'views',
  share: 'Share',
  shareTwitter: 'Share on Twitter',
  shareLinkedin: 'Share on LinkedIn',
  copyLink: 'Copy the link',
  copied: 'Copied',
  link: 'Link',
});

/** `slug` is the article's French slug: both languages share one view counter. */
export function BlogInteractions({ slug, title }: { slug: string; title: string }) {
  const t = copy[useLocale()];
  const [views, setViews] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}/view`, { method: 'POST' })
      .then((response) => response.json())
      .then((data) => setViews(typeof data.views === 'number' ? data.views : null))
      .catch(() => undefined);
  }, [slug]);

  const share = (network: 'twitter' | 'linkedin') => {
    trackEvent('social_click', { network, content_type: 'article' });
    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(title);
    const target = network === 'twitter'
      ? `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`
      : `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    window.open(target, '_blank', 'noopener,noreferrer,width=640,height=520');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    trackEvent('social_click', { network: 'copy_link', content_type: 'article' });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
      <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{views ?? '...'} {t.views}</span>
      <span className="mx-1 text-gray-300">|</span>
      <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" />{t.share}</span>
      <button type="button" onClick={() => share('twitter')} aria-label={t.shareTwitter} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-sky-300 hover:text-sky-600"><Twitter className="h-4 w-4" /></button>
      <button type="button" onClick={() => share('linkedin')} aria-label={t.shareLinkedin} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-blue-300 hover:text-blue-600"><Linkedin className="h-4 w-4" /></button>
      <button type="button" onClick={copyLink} aria-label={t.copyLink} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold hover:border-brand-300 hover:text-brand-600">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? t.copied : t.link}</button>
    </div>
  );
}
