import type { Metadata } from 'next';
import { ApiCostCalculator } from '@/components/tools/ApiCostCalculator';

const pageTitle = 'API Cost Calculator – Estimate API Usage & Costs | JcHub';
const pageDescription = "Calculate API costs, estimate monthly usage, simulate request volumes, and monitor API rate limits with JcHub's free API Cost Calculator.";
const pageUrl = 'https://jchub.dev/tools/api-cost-calculator';

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  keywords: [
    'API Cost Calculator',
    'API Pricing Calculator',
    'API Usage Calculator',
    'API Budget Calculator',
    'API Rate Limit Calculator',
    'API Cost Estimator',
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'website',
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
  },
  twitter: {
    card: 'summary',
    title: pageTitle,
    description: pageDescription,
  },
};

const faqs = [
  {
    question: 'What is an API cost calculator?',
    answer: 'An API cost calculator estimates the cost of API calls from expected request volume and a provider’s price per request or request bundle. It can also help compare traffic with a rate limit, quota, or spending budget.',
  },
  {
    question: 'How do I calculate API costs?',
    answer: 'Convert the provider price to a per-request rate, multiply it by the expected number of billable requests, and add any retries or failed calls that are charged. For example, 1,000 requests at $1 per 1,000 requests cost $1 before retry overhead.',
  },
  {
    question: 'How much does 1 million API requests cost?',
    answer: 'The price depends on the API provider and endpoint. Multiply the provider’s price per 1,000 requests by 1,000, or enter the per-million price directly in the calculator.',
  },
  {
    question: 'How do API rate limits work?',
    answer: 'A rate limit caps how many requests an API accepts during a time window, often per minute. Compare your peak request rate—not only your monthly average—to the provider’s limit, and account for retries that also consume requests.',
  },
  {
    question: 'How do retries affect API costs?',
    answer: 'Retries increase the total number of requests. If 100,000 normal requests have a 5% retry rate, the estimate adds 5,000 requests; those additional calls may also use quota and incur charges.',
  },
  {
    question: 'How can I prevent unexpected API costs?',
    answer: 'Estimate normal traffic and retry behavior, set provider-side usage alerts and hard limits where available, monitor actual usage, and use timeouts, backoff, and idempotency to avoid unnecessary repeated calls.',
  },
];

export default function ApiCostCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#eff6ff] text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.05) 1px,transparent 1px)', backgroundSize: '42px 42px', maskImage: 'radial-gradient(ellipse at center,black 15%,transparent 80%)' }} />
        <header className="relative mx-auto max-w-7xl px-4 pb-9 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-800">Free developer tool</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">API Cost Calculator</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">Estimate API usage, monthly costs, and rate-limit consumption.</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Model request volume, pricing, retries, quotas, and budgets in your browser. Your calculations stay on this device—no account, backend, or external API calls.</p>
        </header>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <ApiCostCalculator />

        <article className="mt-16 max-w-4xl space-y-4 text-slate-700 [&_a]:font-semibold [&_a]:text-blue-800 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:pt-5 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_p]:text-sm [&_p]:leading-7">
          <h2>Frequently asked questions</h2>
          <div className="not-prose divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white px-5 sm:px-7">
            {faqs.map((faq) => (
              <details key={faq.question} className="py-4 first:pt-5 last:pb-5">
                <summary className="cursor-pointer font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{faq.question}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
