'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void; }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
};

export function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>();
  const [verified, setVerified] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    const render = () => {
      if (!window.turnstile || !containerRef.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          onToken(token);
          setVerified(true);
        },
        'expired-callback': () => {
          onToken('');
          setVerified(false);
        },
        'error-callback': () => {
          onToken('');
          setVerified(false);
        },
      });
    };

    if (window.turnstile) render();
    else {
      const script = document.querySelector('script[data-turnstile]');
      script?.addEventListener('load', render);
      return () => script?.removeEventListener('load', render);
    }
  }, [onToken, siteKey]);

  if (!siteKey || verified) return null;
  return <div ref={containerRef} data-turnstile-widget className="min-h-[65px]" />;
}
