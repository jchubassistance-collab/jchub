export type TrafficPeriod = 'minute' | 'hour' | 'day' | 'month';
export type PricingUnit = 'request' | 'thousand' | 'million';
export type TrafficSource = 'volume' | 'users';

export type ApiCostInputs = {
  trafficSource: TrafficSource;
  trafficValue: number;
  trafficPeriod: TrafficPeriod;
  users: number;
  callsPerUserPerDay: number;
  retryRatePercent: number;
  price: number;
  pricingUnit: PricingUnit;
  rateLimitPerMinute: number;
  monthlyQuota: number;
  monthlyBudget: number;
};

export type ApiCostEstimate = {
  requests: {
    normalPerMinute: number;
    additionalRetriesPerMinute: number;
    totalPerMinute: number;
    normalPerHour: number;
    additionalRetriesPerHour: number;
    totalPerHour: number;
    normalPerDay: number;
    additionalRetriesPerDay: number;
    totalPerDay: number;
    normalPerMonth: number;
    additionalRetriesPerMonth: number;
    totalPerMonth: number;
    totalPerYear: number;
  };
  costs: {
    perRequest: number;
    perThousandRequests: number;
    perMillionRequests: number;
    hourly: number;
    daily: number;
    monthly: number;
    yearly: number;
    additionalRetriesMonthly: number;
  };
  rateLimit: {
    configured: boolean;
    usagePercent: number;
    remainingPerMinute: number;
    excessPerMinute: number;
  };
  monthlyQuota: {
    configured: boolean;
    usagePercent: number;
    remainingRequests: number;
    excessRequests: number;
  };
  budget: {
    configured: boolean;
    usagePercent: number;
    remaining: number;
    overage: number;
  };
};

export const DAYS_PER_AVERAGE_MONTH = 365.25 / 12;
export const DAYS_PER_AVERAGE_YEAR = 365.25;
export const MAX_INPUT_VALUE = 1e15;

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const PRICE_UNIT_MULTIPLIERS: Record<PricingUnit, number> = {
  request: 1,
  thousand: 1_000,
  million: 1_000_000,
};
function validateInputs(input: ApiCostInputs) {
  const values = [
    input.trafficValue,
    input.users,
    input.callsPerUserPerDay,
    input.retryRatePercent,
    input.price,
    input.rateLimitPerMinute,
    input.monthlyQuota,
    input.monthlyBudget,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > MAX_INPUT_VALUE)) {
    throw new RangeError(`Values must be between 0 and ${MAX_INPUT_VALUE}.`);
  }
  if (input.retryRatePercent > 100) {
    throw new RangeError('Retry / error rate must not exceed 100%.');
  }
}

function getNormalRequestsPerDay(input: ApiCostInputs) {
  if (input.trafficSource === 'users') {
    return input.users * input.callsPerUserPerDay;
  }

  switch (input.trafficPeriod) {
    case 'minute':
      return input.trafficValue * MINUTES_PER_DAY;
    case 'hour':
      return input.trafficValue * 24;
    case 'day':
      return input.trafficValue;
    case 'month':
      return input.trafficValue / DAYS_PER_AVERAGE_MONTH;
  }
}

function getUsage(limit: number, consumption: number) {
  return {
    configured: limit > 0,
    usagePercent: limit > 0 ? (consumption / limit) * 100 : 0,
    remaining: limit > 0 ? Math.max(0, limit - consumption) : 0,
    excess: limit > 0 ? Math.max(0, consumption - limit) : 0,
  };
}

export function calculateApiCost(input: ApiCostInputs): ApiCostEstimate {
  validateInputs(input);

  const normalPerDay = getNormalRequestsPerDay(input);
  const isDirectTraffic = input.trafficSource === 'volume';
  const normalPerMinute = isDirectTraffic && input.trafficPeriod === 'minute'
    ? input.trafficValue
    : normalPerDay / MINUTES_PER_DAY;
  const normalPerHour = isDirectTraffic && input.trafficPeriod === 'hour'
    ? input.trafficValue
    : normalPerDay / 24;
  const normalPerMonth = isDirectTraffic && input.trafficPeriod === 'month'
    ? input.trafficValue
    : normalPerDay * DAYS_PER_AVERAGE_MONTH;
  const retryMultiplier = input.retryRatePercent / 100;
  const additionalRetriesPerMinute = normalPerMinute * retryMultiplier;
  const additionalRetriesPerHour = normalPerHour * retryMultiplier;
  const additionalRetriesPerDay = normalPerDay * retryMultiplier;
  const additionalRetriesPerMonth = normalPerMonth * retryMultiplier;
  const totalMultiplier = 1 + retryMultiplier;
  const totalPerMinute = normalPerMinute * totalMultiplier;
  const totalPerHour = normalPerHour * totalMultiplier;
  const totalPerDay = normalPerDay * totalMultiplier;
  const totalPerMonth = normalPerMonth * totalMultiplier;
  const totalPerYear = totalPerMonth * 12;
  const perRequest = input.price / PRICE_UNIT_MULTIPLIERS[input.pricingUnit];

  const rateLimit = getUsage(input.rateLimitPerMinute, totalPerMinute);
  const quotaUsage = getUsage(input.monthlyQuota, totalPerMonth);
  const budgetUsage = getUsage(input.monthlyBudget, totalPerMonth * perRequest);

  return {
    requests: {
      normalPerMinute,
      additionalRetriesPerMinute,
      totalPerMinute,
      normalPerHour,
      additionalRetriesPerHour,
      totalPerHour,
      normalPerDay,
      additionalRetriesPerDay,
      totalPerDay,
      normalPerMonth,
      additionalRetriesPerMonth,
      totalPerMonth,
      totalPerYear,
    },
    costs: {
      perRequest,
      perThousandRequests: perRequest * 1_000,
      perMillionRequests: perRequest * 1_000_000,
      hourly: totalPerHour * perRequest,
      daily: totalPerDay * perRequest,
      monthly: totalPerMonth * perRequest,
      yearly: totalPerYear * perRequest,
      additionalRetriesMonthly: additionalRetriesPerMonth * perRequest,
    },
    rateLimit: {
      configured: rateLimit.configured,
      usagePercent: rateLimit.usagePercent,
      remainingPerMinute: rateLimit.remaining,
      excessPerMinute: rateLimit.excess,
    },
    monthlyQuota: {
      configured: quotaUsage.configured,
      usagePercent: quotaUsage.usagePercent,
      remainingRequests: quotaUsage.remaining,
      excessRequests: quotaUsage.excess,
    },
    budget: {
      configured: budgetUsage.configured,
      usagePercent: budgetUsage.usagePercent,
      remaining: input.monthlyBudget - totalPerMonth * perRequest,
      overage: budgetUsage.excess,
    },
  };
}
