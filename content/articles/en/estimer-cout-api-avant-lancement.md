---
slug: estimate-api-cost-before-launch
title: How to estimate the cost of an API before you launch
description: >-
  Number of users, calls per day, retries, price per request: the method to
  estimate an API’s monthly bill before your app goes live.
excerpt: >-
  Number of users, calls per day, retries, price per request: the method to
  estimate an API’s monthly bill before your app goes live.
keywords:
  - api cost
  - estimate api cost
  - api pricing
  - api quota
  - rate limit
  - api budget
sourceHash: ae6ce0590c8733ed6a1d2c89
translatedAt: '2026-11-04T14:17:50.610Z'
---
An API billed per request always looks cheap: half a cent per call, who cares? Then the app finds its users, every screen fires three calls, every network error adds one more, and the monthly bill arrives. Estimating the cost **before** launch takes ten minutes and avoids that kind of surprise. Here’s the method, with a worked example.

## The five numbers you need

1. **The base volume**: how many daily active users, and how many calls each one triggers.
2. **The retry rate**: the share of calls repeated after an error or a timeout.
3. **The price**: per request, per thousand or per million requests, depending on the provider’s pricing.
4. **The provider’s limits**: maximum requests per minute, monthly quota included.
5. **Your budget**: what you’re willing to pay each month.

## Step 1: count the calls per user

This is the most underestimated number. Don’t count “one search = one call”: look at what your app really does. A results screen may call the API for the search, then for each item shown, then for suggestions.

The most reliable method: use your prototype for a normal session with the developer tools’ **Network** tab open, and count the requests to the API. Then multiply by the number of sessions a user has in a day.

## Step 2: add the retries

On mobile networks, requests fail and are retried automatically. Each retry is usually **billed like a normal call**. Count at least **5%** more for a consumer app, more if your users often have an unstable connection.

## Step 3: a worked example

Take a delivery app calling a routing API:

- **2,000 daily active users**, **15 calls** each: 30,000 calls a day.
- **5% retries**: 30,000 × 1.05 = **31,500 calls a day**.
- **Per month** (30.44 days on average): about **958,800 calls**.
- **Price**: $0.50 per 1,000 calls, so 958.8 × 0.50 ≈ **$479 a month**.

Over a year, that’s close to **$5,750**. That figure alone can change your business model, or your choice of provider.

## Step 4: check the limits, not just the price

Budget isn’t the only trap. If the provider caps you at **20 requests per minute**, our example is already stuck: 31,500 calls a day average **22 calls per minute**. And activity is never even: at lunchtime you can easily see three to five times the average.

Above the limit, the API answers **429 Too Many Requests** and your users see errors. So compare the limit to your **peak**, not your average.

Do the same with the **monthly quota** included in your plan: beyond it, each call may cost more, or be refused.

## Run the numbers instantly

Instead of redoing these multiplications for every assumption, use JcHub’s [API Cost Calculator](/en/tools/api-cost-calculator). You enter:

- your traffic, as a request volume or as users and calls per day;
- your retry rate;
- the price, per request, per thousand or per million;
- if you know them, the per-minute limit, the monthly quota and your budget.

The tool gives you the number of requests per minute, hour, day, month and year, the cost at each scale, the share caused by retries, and tells you whether you exceed your limit, your quota or your budget.

## Three ways to lower the bill

- **Cache** responses that rarely change. A route computed five minutes ago between the same two points doesn’t need to be computed again.
- **Batch calls** when the API allows it: one request for twenty items rather than twenty requests.
- **Limit retries**: a growing delay between attempts, and a maximum number of attempts.

## Test several scenarios

Don’t settle for a single number. Compute three cases: **cautious** (few users), **expected**, and **success** (ten times more). If the “success” scenario would ruin you, better to know before launch than after. That’s often when you negotiate a volume plan with the provider, or change your architecture.

## Key takeaways

- Count your app’s real calls, not the ones you imagine.
- Add retries: they are billed too.
- Compare the per-minute limit to your **peak**, not your average.
- Compute a cautious, expected and success scenario with the [API Cost Calculator](/en/tools/api-cost-calculator).
