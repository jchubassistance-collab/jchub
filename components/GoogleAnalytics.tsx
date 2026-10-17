'use client';

import Script from 'next/script';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics({ nonce }: { nonce?: string }) {
  if (process.env.NODE_ENV !== 'production' || !measurementId) return null;

  return (
    <>
      <Script
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
        async
      />
      <Script id="google-analytics" nonce={nonce} strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
