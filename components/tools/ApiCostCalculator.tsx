'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Braces, KeyRound, Link2, RotateCcw } from 'lucide-react';
import {
  calculateApiCost,
  DAYS_PER_AVERAGE_MONTH,
  MAX_INPUT_VALUE,
  type ApiCostInputs,
  type PricingUnit,
  type TrafficPeriod,
  type TrafficSource,
} from '@/lib/api-cost-calculator';

const INITIAL_INPUTS: ApiCostInputs = {
  trafficSource: 'volume',
  trafficValue: 50_000,
  trafficPeriod: 'day',
  users: 1_000,
  callsPerUserPerDay: 50,
  retryRatePercent: 5,
  price: 1.2,
  pricingUnit: 'thousand',
  rateLimitPerMinute: 60,
  monthlyQuota: 2_500_000,
  monthlyBudget: 250,
};

type FormValues = Record<keyof ApiCostInputs, string | TrafficSource | TrafficPeriod | PricingUnit>;

const PERIODS: { value: TrafficPeriod; label: string }[] = [
  { value: 'minute', label: 'Requests per minute' },
  { value: 'hour', label: 'Requests per hour' },
  { value: 'day', label: 'Requests per day' },
  { value: 'month', label: 'Requests per month' },
];

const PRICING_UNITS: { value: PricingUnit; label: string }[] = [
  { value: 'request', label: 'per request' },
  { value: 'thousand', label: 'per 1,000 requests' },
  { value: 'million', label: 'per 1 million requests' },
];

function toFormValues(inputs: ApiCostInputs): FormValues {
  return Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [
      key,
      typeof value === 'number' ? String(value) : value,
    ]),
  ) as FormValues;
}

function parseFormValues(values: FormValues): ApiCostInputs {
  return {
    trafficSource: values.trafficSource as TrafficSource,
    trafficPeriod: values.trafficPeriod as TrafficPeriod,
    pricingUnit: values.pricingUnit as PricingUnit,
    trafficValue: Number(values.trafficValue),
    users: Number(values.users),
    callsPerUserPerDay: Number(values.callsPerUserPerDay),
    retryRatePercent: Number(values.retryRatePercent),
    price: Number(values.price),
    rateLimitPerMinute: Number(values.rateLimitPerMinute),
    monthlyQuota: Number(values.monthlyQuota),
    monthlyBudget: Number(values.monthlyBudget),
  };
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function Field({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = MAX_INPUT_VALUE,
  step = 'any',
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
          aria-describedby={`${id}-hint`}
        />
        {suffix && <span id={`${id}-hint`} className="pr-4 text-xs font-medium text-slate-500">{suffix}</span>}
      </div>
      {!suffix && <span id={`${id}-hint`} className="sr-only">Enter a non-negative value.</span>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,.045)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-right text-sm font-bold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

function UsageMeter({
  label,
  percent,
  description,
  warning,
}: {
  label: string;
  percent: number;
  description: string;
  warning: boolean;
}) {
  const progress = Math.min(percent, 100);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900">{label}</h3>
        <span className={`text-sm font-bold tabular-nums ${warning ? 'text-amber-700' : 'text-blue-800'}`}>
          {formatNumber(percent, 1)}%
        </span>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={`${formatNumber(percent, 1)}%`}
      >
        <div className={`h-full rounded-full transition-[width] ${warning ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
      </div>
      <p className={`mt-2 text-sm leading-6 ${warning ? 'text-amber-800' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

export function ApiCostCalculator() {
  const [values, setValues] = useState<FormValues>(() => toFormValues(INITIAL_INPUTS));
  const [formVersion, setFormVersion] = useState(0);

  const inputs = useMemo(() => parseFormValues(values), [values]);
  const { estimate, validationError } = useMemo(() => {
    try {
      return { estimate: calculateApiCost(inputs), validationError: '' };
    } catch (error) {
      return {
        estimate: null,
        validationError: error instanceof Error ? error.message : 'Check the entered values and try again.',
      };
    }
  }, [inputs]);

  const update = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setValues(toFormValues(INITIAL_INPUTS));
    setFormVersion((version) => version + 1);
  };

  return (
    <div className="space-y-7">
      <section key={formVersion} className="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-[0_16px_45px_rgba(37,99,235,.07)] sm:p-7 lg:p-8" aria-label="Calculator inputs">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm leading-6 text-slate-600">Enter a traffic estimate and price to see usage and cost update instantly.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            aria-label="Reset calculator to example values"
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        </div>

        {validationError && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{validationError} Estimates are hidden until the values are corrected.</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Traffic" description="Choose a direct traffic volume or estimate it from your users.">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-slate-700">Estimate traffic from</legend>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['volume', 'Request volume'],
                  ['users', 'Users'],
                ] as const).map(([source, label]) => (
                  <button
                    key={source}
                    type="button"
                    aria-pressed={inputs.trafficSource === source}
                    onClick={() => update('trafficSource', source)}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${inputs.trafficSource === source ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            {inputs.trafficSource === 'volume' ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <Field id="trafficValue" label={PERIODS.find((period) => period.value === inputs.trafficPeriod)?.label ?? 'Requests'} value={String(values.trafficValue)} onChange={(value) => update('trafficValue', value)} />
                <div>
                  <label htmlFor="trafficPeriod" className="mb-2 block text-sm font-semibold text-slate-700">Traffic period</label>
                  <select id="trafficPeriod" value={inputs.trafficPeriod} onChange={(event) => update('trafficPeriod', event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    {PERIODS.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field id="users" label="Number of users" value={String(values.users)} onChange={(value) => update('users', value)} />
                <Field id="callsPerUserPerDay" label="API calls per user/day" value={String(values.callsPerUserPerDay)} onChange={(value) => update('callsPerUserPerDay', value)} />
              </div>
            )}
            <p className="mt-3 text-xs leading-5 text-slate-500">Only the selected traffic estimate is used. The other values are kept so you can switch scenarios.</p>
          </Section>

          <Section title="Pricing" description="Select exactly what the entered USD price applies to.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="price" label="API price (USD)" value={String(values.price)} onChange={(value) => update('price', value)} suffix="USD" />
              <div>
                <label htmlFor="pricingUnit" className="mb-2 block text-sm font-semibold text-slate-700">Price unit</label>
                <select id="pricingUnit" value={inputs.pricingUnit} onChange={(event) => update('pricingUnit', event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  {PRICING_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                </select>
              </div>
            </div>
          </Section>

          <Section title="Usage" description="Retries and failed requests add billable traffic to the estimate.">
            <Field id="retryRatePercent" label="Retry / error rate (%)" value={String(values.retryRatePercent)} onChange={(value) => update('retryRatePercent', value)} max={100} suffix="%" />
            <p className="mt-3 text-xs leading-5 text-slate-500">For example, 5% adds 5 requests for every 100 normal requests.</p>
          </Section>

          <Section title="Limits" description="Set any limit to 0 to leave it unconfigured.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="rateLimitPerMinute" label="API rate limit" value={String(values.rateLimitPerMinute)} onChange={(value) => update('rateLimitPerMinute', value)} suffix="requests/min" />
              <Field id="monthlyQuota" label="Monthly API quota" value={String(values.monthlyQuota)} onChange={(value) => update('monthlyQuota', value)} suffix="requests" />
              <div className="sm:col-span-2">
                <Field id="monthlyBudget" label="Monthly budget limit" value={String(values.monthlyBudget)} onChange={(value) => update('monthlyBudget', value)} suffix="USD" />
              </div>
            </div>
          </Section>
        </div>
      </section>

      <section aria-live="polite" aria-atomic="false" className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Live estimate</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Your API usage and cost</h2>
        </div>
        {estimate ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Section title="Estimated Requests">
                <ResultItem label="per minute" value={formatNumber(estimate.requests.totalPerMinute)} />
                <ResultItem label="per hour" value={formatNumber(estimate.requests.totalPerHour)} />
                <ResultItem label="per day" value={formatNumber(estimate.requests.totalPerDay)} />
                <ResultItem label="per month" value={formatNumber(estimate.requests.totalPerMonth)} />
                <ResultItem label="per year" value={formatNumber(estimate.requests.totalPerYear)} />
              </Section>
              <Section title="Estimated Cost">
                <ResultItem label="Cost per request" value={formatMoney(estimate.costs.perRequest)} />
                <ResultItem label="Cost per 1,000 requests" value={formatMoney(estimate.costs.perThousandRequests)} />
                <ResultItem label="Cost per 1 million requests" value={formatMoney(estimate.costs.perMillionRequests)} />
                <ResultItem label="Hourly cost" value={formatMoney(estimate.costs.hourly)} />
                <ResultItem label="Daily cost" value={formatMoney(estimate.costs.daily)} />
                <ResultItem label="Monthly cost" value={formatMoney(estimate.costs.monthly)} />
                <ResultItem label="Yearly cost" value={formatMoney(estimate.costs.yearly)} />
              </Section>
              <Section title="Retries & errors">
                <ResultItem label="Normal requests/month" value={formatNumber(estimate.requests.normalPerMonth)} />
                <ResultItem label="Additional Requests from Retries" value={formatNumber(estimate.requests.additionalRetriesPerMonth)} />
                <ResultItem label="Total billable requests/month" value={formatNumber(estimate.requests.totalPerMonth)} />
                <ResultItem label="Additional Cost from Retries" value={formatMoney(estimate.costs.additionalRetriesMonthly)} />
              </Section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="API Limit Usage" description="Rate-limit usage includes the retry / error overhead.">
                {estimate.rateLimit.configured ? (
                  <div className="space-y-5">
                    <UsageMeter
                      label="Rate limit consumption"
                      percent={estimate.rateLimit.usagePercent}
                      warning={estimate.rateLimit.usagePercent >= 80}
                      description={estimate.rateLimit.excessPerMinute > 0
                        ? `Your traffic exceeds the API rate limit by ${formatNumber(estimate.rateLimit.excessPerMinute)} requests/minute.`
                        : `${formatNumber(estimate.rateLimit.remainingPerMinute)} requests/minute remaining.`}
                    />
                    <div className={`rounded-xl p-3 text-sm font-semibold ${estimate.rateLimit.excessPerMinute > 0 ? 'border border-red-200 bg-red-50 text-red-800' : estimate.rateLimit.usagePercent >= 80 ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                      {estimate.rateLimit.excessPerMinute > 0
                        ? `${formatNumber(estimate.requests.totalPerMinute)} expected requests/min exceeds the configured limit.`
                        : estimate.rateLimit.usagePercent >= 80
                          ? 'Traffic is close to the configured rate limit.'
                          : 'Traffic stays within the configured rate limit.'}
                    </div>
                  </div>
                ) : <p className="text-sm leading-6 text-slate-600">No rate limit configured. Enter a value above 0 to simulate one.</p>}
              </Section>
              <Section title="Monthly API quota" description="Monthly quota consumption includes retries.">
                {estimate.monthlyQuota.configured ? (
                  <UsageMeter
                    label="Quota consumption"
                    percent={estimate.monthlyQuota.usagePercent}
                    warning={estimate.monthlyQuota.usagePercent >= 80}
                    description={estimate.monthlyQuota.excessRequests > 0
                      ? `${formatNumber(estimate.monthlyQuota.excessRequests)} requests over quota.`
                      : `${formatNumber(estimate.monthlyQuota.remainingRequests)} requests remaining this month.`}
                  />
                ) : <p className="text-sm leading-6 text-slate-600">No monthly quota configured. Enter a value above 0 to monitor it.</p>}
              </Section>
            </div>

            <Section title="Budget Status" description="Projected spend is based on the average-month assumption stated below.">
              {estimate.budget.configured ? (
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
                  <div>
                    <ResultItem label="Estimated monthly cost" value={formatMoney(estimate.costs.monthly)} />
                    <ResultItem label="Configured monthly budget" value={formatMoney(inputs.monthlyBudget)} />
                    <ResultItem label={estimate.budget.overage > 0 ? 'Over budget by' : 'Remaining budget'} value={formatMoney(estimate.budget.overage > 0 ? estimate.budget.overage : estimate.budget.remaining)} />
                  </div>
                  <UsageMeter
                    label="Budget consumed"
                    percent={estimate.budget.usagePercent}
                    warning={estimate.budget.usagePercent >= 80}
                    description={estimate.budget.overage > 0
                      ? `Warning: estimated monthly API costs exceed your budget by ${formatMoney(estimate.budget.overage)}.`
                      : `${formatNumber(estimate.budget.remaining > 0 ? 100 - estimate.budget.usagePercent : 0, 1)}% of the budget remains.`}
                  />
                </div>
              ) : <p className="text-sm leading-6 text-slate-600">No monthly budget configured. Enter a value above 0 to monitor spending.</p>}
            </Section>
          </>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">Correct the highlighted input values to see your estimate.</div>
        )}
        <p className="text-xs leading-5 text-slate-500">
          Time conversion uses an average month of {formatNumber(DAYS_PER_AVERAGE_MONTH, 4)} days (365.25 days ÷ 12) and an average year of 365.25 days. Estimates use unrounded values internally; displayed values are rounded for readability.
        </p>
      </section>

      <section aria-label="Calculator benefits" className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: '🔒', title: '100% privé', description: 'Tout se passe dans ton navigateur' },
          { icon: '⚡', title: 'Instantané', description: "Pas d'attente, pas de serveur" },
          { icon: '🎨', title: 'Sans pub', description: 'Pas de tracking, pas de pub' },
        ].map((benefit) => (
          <div key={benefit.title} className="flex min-h-36 flex-col items-center justify-center rounded-3xl border border-blue-100 bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(37,99,235,.06)]">
            <span aria-hidden="true" className="text-3xl leading-none">{benefit.icon}</span>
            <h2 className="mt-3 text-lg font-extrabold text-slate-900">{benefit.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{benefit.description}</p>
          </div>
        ))}
      </section>

      <nav aria-label="Related JcHub developer tools" className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Related developer tools</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'JSON Formatter & Validator', href: '/outils/json-formatter', description: 'Format and validate JSON.', Icon: Braces },
            { label: 'URL Encoder / Decoder', href: '/outils/encodeur-url', description: 'Encode or decode URL values.', Icon: Link2 },
            { label: 'JWT Decoder', href: '/outils/decodeur-jwt', description: 'Inspect JWT headers and payloads.', Icon: KeyRound },
          ].map(({ label, href, description, Icon }) => (
            <Link key={href} href={href} className="group flex min-h-24 items-center gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-blue-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
