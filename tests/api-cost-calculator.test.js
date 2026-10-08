import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateApiCost } from '../lib/api-cost-calculator.ts';

function input(overrides = {}) {
  return {
    trafficSource: 'volume',
    trafficValue: 1_000,
    trafficPeriod: 'day',
    users: 100,
    callsPerUserPerDay: 20,
    retryRatePercent: 0,
    price: 1,
    pricingUnit: 'thousand',
    rateLimitPerMinute: 60,
    monthlyQuota: 100_000,
    monthlyBudget: 100,
    ...overrides,
  };
}

test('calculates 1,000 requests at $1 per 1,000 requests', () => {
  const estimate = calculateApiCost(input({ trafficPeriod: 'month' }));
  assert.equal(estimate.requests.totalPerMonth, 1_000);
  assert.equal(estimate.costs.monthly, 1);
  assert.equal(estimate.costs.perRequest, 0.001);
  assert.equal(estimate.costs.perThousandRequests, 1);
  assert.equal(estimate.costs.perMillionRequests, 1_000);
});

test('calculates one million requests and pricing in each supported unit', () => {
  const estimate = calculateApiCost(input({
    trafficValue: 1_000_000,
    trafficPeriod: 'month',
    pricingUnit: 'million',
    price: 12,
  }));
  assert.equal(estimate.requests.totalPerMonth, 1_000_000);
  assert.equal(estimate.costs.monthly, 12);
  assert.equal(estimate.costs.perRequest, 0.000012);
});

test('zero traffic and zero price produce zero requests and cost', () => {
  const estimate = calculateApiCost(input({ trafficValue: 0, price: 0 }));
  assert.equal(estimate.requests.totalPerMonth, 0);
  assert.equal(estimate.costs.monthly, 0);
});

test('a zero retry rate adds no requests or cost', () => {
  const estimate = calculateApiCost(input({ retryRatePercent: 0 }));
  assert.equal(estimate.requests.additionalRetriesPerMonth, 0);
  assert.equal(estimate.costs.additionalRetriesMonthly, 0);
});

test('a 10% retry rate adds 10% billable requests and costs', () => {
  const estimate = calculateApiCost(input({ trafficPeriod: 'month', retryRatePercent: 10 }));
  assert.equal(estimate.requests.normalPerMonth, 1_000);
  assert.equal(estimate.requests.additionalRetriesPerMonth, 100);
  assert.equal(estimate.requests.totalPerMonth, 1_100);
  assert.equal(estimate.costs.additionalRetriesMonthly, 0.1);
});

test('rate-limit simulation handles below, at, and above the limit', () => {
  const below = calculateApiCost(input({ trafficValue: 60, trafficPeriod: 'minute', rateLimitPerMinute: 100 }));
  const equal = calculateApiCost(input({ trafficValue: 60, trafficPeriod: 'minute', rateLimitPerMinute: 60 }));
  const above = calculateApiCost(input({ trafficValue: 100, trafficPeriod: 'minute', rateLimitPerMinute: 60 }));
  assert.equal(below.rateLimit.excessPerMinute, 0);
  assert.equal(below.rateLimit.remainingPerMinute, 40);
  assert.equal(equal.rateLimit.usagePercent, 100);
  assert.equal(equal.rateLimit.excessPerMinute, 0);
  assert.equal(above.rateLimit.excessPerMinute, 40);
});

test('reports a monthly budget overage', () => {
  const estimate = calculateApiCost(input({
    trafficValue: 100_000,
    trafficPeriod: 'month',
    price: 2,
    pricingUnit: 'thousand',
    monthlyBudget: 50,
  }));
  assert.equal(estimate.costs.monthly, 200);
  assert.equal(estimate.budget.overage, 150);
  assert.equal(estimate.budget.remaining, -150);
});

test('preserves decimal request volumes and calculates user-based traffic', () => {
  const estimate = calculateApiCost(input({
    trafficSource: 'users',
    users: 2.5,
    callsPerUserPerDay: 4.2,
    price: 0.25,
    pricingUnit: 'request',
  }));
  assert.equal(estimate.requests.normalPerDay, 10.5);
  assert.equal(estimate.costs.daily, 2.625);
});

test('supports large request volumes without rounding the underlying estimate', () => {
  const estimate = calculateApiCost(input({
    trafficValue: 1_000_000_000_000,
    trafficPeriod: 'month',
    price: 0.5,
    pricingUnit: 'million',
  }));
  assert.equal(estimate.requests.totalPerMonth, 1_000_000_000_000);
  assert.equal(estimate.costs.monthly, 500_000);
});

test('converts minute, hour, day, month, and year consistently', () => {
  const estimate = calculateApiCost(input({
    trafficValue: 60,
    trafficPeriod: 'minute',
  }));
  assert.equal(estimate.requests.totalPerHour, 3_600);
  assert.equal(estimate.requests.totalPerDay, 86_400);
  assert.equal(estimate.requests.totalPerMonth, 86_400 * (365.25 / 12));
  assert.equal(estimate.requests.totalPerYear, 86_400 * 365.25);
  assert.equal(estimate.costs.yearly, estimate.costs.monthly * 12);
});

test('rejects negative, non-finite, excessive, and out-of-range retry inputs', () => {
  assert.throws(() => calculateApiCost(input({ price: -1 })), RangeError);
  assert.throws(() => calculateApiCost(input({ trafficValue: Number.POSITIVE_INFINITY })), RangeError);
  assert.throws(() => calculateApiCost(input({ trafficValue: 1e16 })), RangeError);
  assert.throws(() => calculateApiCost(input({ retryRatePercent: 101 })), RangeError);
});
