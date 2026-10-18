'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  carousel: 'carrousel',
  position: (current: number, total: number) => `Partenaire ${current} sur ${total}`,
  previous: 'Partenaire précédent',
  next: 'Partenaire suivant',
}, {
  carousel: 'carousel',
  position: (current: number, total: number) => `Partner ${current} of ${total}`,
  previous: 'Previous partner',
  next: 'Next partner',
});

function getNearestSlideIndex(track: HTMLElement): number {
  const slides = Array.from(track.children) as HTMLElement[];
  const trackLeft = track.getBoundingClientRect().left;

  return slides.reduce((nearest, slide, index) => {
    const currentDistance = Math.abs(slide.getBoundingClientRect().left - trackLeft);
    const nearestDistance = Math.abs(slides[nearest].getBoundingClientRect().left - trackLeft);
    return currentDistance < nearestDistance ? index : nearest;
  }, 0);
}

export function PartnerCarousel({ children, label }: { children: ReactNode; label: string }) {
  const t = copy[useLocale()];
  const trackRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = Children.count(children);

  useEffect(() => {
    if (slideCount < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || isPausedRef.current) return;

      const slides = Array.from(track.children) as HTMLElement[];
      const nextIndex = (getNearestSlideIndex(track) + 1) % slides.length;
      const target = slides[nextIndex];
      if (!target) return;

      setActiveIndex(nextIndex);
      track.scrollTo({
        left: target.offsetLeft - slides[0].offsetLeft,
        behavior: 'smooth',
      });
    }, 6000);

    return () => window.clearInterval(interval);
  }, [slideCount]);

  const scrollToSlide = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const targetIndex = Math.max(0, Math.min(index, slides.length - 1));
    const target = slides[targetIndex];
    if (!target) return;

    setActiveIndex(targetIndex);
    track.scrollTo({
      left: target.offsetLeft - slides[0].offsetLeft,
      behavior: 'smooth',
    });
  };

  const updateActiveSlide = () => {
    const track = trackRef.current;
    if (!track) return;

    setActiveIndex(getNearestSlideIndex(track));
  };

  return (
    <div
      aria-label={label}
      aria-roledescription={t.carousel}
      role="region"
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
      onFocusCapture={() => { isPausedRef.current = true; }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          isPausedRef.current = false;
        }
      }}
    >
      <div
        ref={trackRef}
        onScroll={updateActiveSlide}
        className="partner-carousel-track flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4"
      >
        {Children.map(children, (child, index) => (
          <div
            key={index}
            data-active={index === activeIndex}
            className="partner-carousel-slide min-w-full snap-start"
          >
            {child}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span aria-live="off" className="text-sm font-medium text-slate-500">
          {t.position(activeIndex + 1, slideCount)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={t.previous}
            title={t.previous}
            disabled={activeIndex === 0}
            onClick={() => scrollToSlide(activeIndex - 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-blue-200 bg-white text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={t.next}
            title={t.next}
            disabled={activeIndex >= slideCount - 1}
            onClick={() => scrollToSlide(activeIndex + 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-blue-200 bg-white text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
