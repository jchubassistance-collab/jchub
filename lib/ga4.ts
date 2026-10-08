import 'server-only';

import crypto from 'node:crypto';

type ReportRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };
type Report = { rows?: ReportRow[]; metricHeaders?: Array<{ name?: string }>; dimensionHeaders?: Array<{ name?: string }> };

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!email || !privateKey || !propertyId) return null;
  return { email, privateKey, propertyId };
}

async function getAccessToken() {
  const credentials = getCredentials();
  if (!credentials) return null;
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({
    iss: credentials.email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  }));
  const signature = crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(credentials.privateKey);
  const assertion = `${header}.${claim}.${base64Url(signature)}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    cache: 'no-store',
  });
  const data = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || 'Token Google Analytics indisponible.');
  return { token: data.access_token, propertyId: credentials.propertyId };
}

async function runReport(access: { token: string; propertyId: string }, dimensions: string[], metrics: string[], limit = 10, startDate = '28daysAgo', endDate = 'yesterday', chronological = false, dimensionFilter?: unknown): Promise<Report> {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${access.propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateRanges: [{ startDate, endDate }], dimensions: dimensions.map((name) => ({ name })), metrics: metrics.map((name) => ({ name })), limit: String(limit), ...(dimensionFilter ? { dimensionFilter } : {}), orderBys: chronological ? [{ dimension: { dimensionName: dimensions[0] }, desc: false }] : [{ metric: { metricName: metrics[0] }, desc: true }] }),
    cache: 'no-store',
  });
  const data = await response.json() as Report & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || 'Rapport GA4 indisponible.');
  return data;
}

function rowsToObjects(report: Report) {
  const dimensions = (report.dimensionHeaders || []).map((header) => header.name || 'dimension');
  const metrics = (report.metricHeaders || []).map((header) => header.name || 'metric');
  return (report.rows || []).map((row) => Object.fromEntries([
    ...dimensions.map((name, index) => [name, row.dimensionValues?.[index]?.value || '']),
    ...metrics.map((name, index) => [name, Number(row.metricValues?.[index]?.value || 0)]),
  ]));
}

export async function getGa4Overview() {
  const access = await getAccessToken();
  if (!access) return { configured: false as const };
  const blogPathFilter = { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog', caseSensitive: true } } };
  const [summary, timeline, dailyViews, monthlyViews, yearlyViews, pages, sources, channels, devices, countries, events, currentPeriodViews, previousPeriodViews] = await Promise.all([
    runReport(access, [], ['activeUsers', 'sessions', 'conversions', 'bounceRate', 'averageSessionDuration', 'newUsers'], 1),
    runReport(access, ['date'], ['activeUsers', 'newUsers', 'conversions'], 31, '28daysAgo', 'yesterday', true),
    runReport(access, ['date'], ['screenPageViews'], 366, '365daysAgo', 'yesterday', true, blogPathFilter),
    runReport(access, ['yearMonth'], ['screenPageViews'], 24, '730daysAgo', 'yesterday', true, blogPathFilter),
    runReport(access, ['year'], ['screenPageViews'], 10, '1825daysAgo', 'yesterday', true, blogPathFilter),
    runReport(access, ['pagePath'], ['screenPageViews', 'activeUsers'], 10),
    runReport(access, ['sessionSourceMedium'], ['sessions', 'activeUsers', 'newUsers', 'bounceRate', 'screenPageViewsPerSession', 'averageSessionDuration', 'conversions'], 10),
    runReport(access, ['sessionDefaultChannelGroup'], ['sessions'], 8),
    runReport(access, ['deviceCategory'], ['activeUsers'], 10),
    runReport(access, ['country'], ['activeUsers'], 10),
    runReport(access, ['eventName'], ['eventCount'], 50),
    runReport(access, [], ['screenPageViews'], 1, '28daysAgo', 'yesterday', false, blogPathFilter),
    runReport(access, [], ['screenPageViews'], 1, '56daysAgo', '29daysAgo', false, blogPathFilter),
  ]);
  const summaryData = rowsToObjects(summary)[0] || {};
  const sessions = Number(summaryData.sessions || 0);
  const eventsData = rowsToObjects(events);
  const eventCount = (names: string[]) => eventsData.filter((event) => names.includes(String(event.eventName))).reduce((total, event) => total + Number(event.eventCount || 0), 0);
  return {
    configured: true as const,
    period: '28 derniers jours',
    visitors: Number(summaryData.activeUsers || 0),
    sessions,
    conversions: Number(summaryData.conversions || 0),
    bounceRate: Number((Number(summaryData.bounceRate || 0) * 100).toFixed(1)),
    averageSessionDuration: Number(summaryData.averageSessionDuration || 0),
    newUsers: Number(summaryData.newUsers || 0),
    conversionRate: sessions ? Number(((Number(summaryData.conversions || 0) / sessions) * 100).toFixed(2)) : 0,
    timeline: rowsToObjects(timeline),
    dailyViews: rowsToObjects(dailyViews),
    monthlyViews: rowsToObjects(monthlyViews),
    yearlyViews: rowsToObjects(yearlyViews),
    currentPeriodViews: Number(rowsToObjects(currentPeriodViews)[0]?.screenPageViews || 0),
    previousPeriodViews: Number(rowsToObjects(previousPeriodViews)[0]?.screenPageViews || 0),
    pages: rowsToObjects(pages),
    sources: rowsToObjects(sources),
    channels: rowsToObjects(channels),
    devices: rowsToObjects(devices),
    countries: rowsToObjects(countries),
    newsletter: eventCount(['newsletter_signup', 'newsletter_subscribe']),
    socialClicks: eventCount(['social_click', 'share']),
  };
}

export async function getGa4ToolViews(paths: string[]) {
  const access = await getAccessToken();
  if (!access || !paths.length) return { configured: Boolean(access), views: {} as Record<string, number> };
  const report = await runReport(access, ['pagePath'], ['screenPageViews'], Math.min(paths.length, 100), '28daysAgo', 'yesterday', false, {
    filter: { fieldName: 'pagePath', inListFilter: { values: paths, caseSensitive: true } },
  });
  return { configured: true, views: Object.fromEntries(rowsToObjects(report).map((row) => [String(row.pagePath), Number(row.screenPageViews || 0)])) };
}
