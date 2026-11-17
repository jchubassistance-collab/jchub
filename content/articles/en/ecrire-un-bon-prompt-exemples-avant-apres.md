---
slug: how-to-write-a-good-prompt-before-after
title: 'How to write a good prompt: before and after examples'
description: >-
  Context, precise task, expected format, example: the method to get useful
  answers from an AI, illustrated by four prompts rewritten before and after.
excerpt: >-
  Context, precise task, expected format, example: the method to get useful
  answers from an AI, illustrated by four prompts rewritten before and after.
keywords:
  - write a prompt
  - good prompt
  - ai prompt examples
  - chatgpt prompt
  - prompt engineering
sourceHash: 20e84938037a0422bbd57766
translatedAt: '2026-11-04T14:17:53.955Z'
---
Two people ask an AI “the same question” and get very different answers. The difference is almost never the tool: it’s the **request**, the prompt. Good news: writing a good prompt isn’t magic. It comes down to five ingredients, shown here with four rewritten examples.

## The five ingredients of a good prompt

1. **Context**: who you are, who the result is for, in what situation.
2. **A precise task**: a clear verb (write, summarize, fix, compare), not “tell me about”.
3. **The expected format**: length, structure, tone, language, table or list.
4. **An example**: a model of what you want, when possible.
5. **Constraints**: what to avoid, what information not to make up.

You don’t need all five every time. But when an answer disappoints you, one of them is almost always missing.

## Example 1: replying to an unhappy customer

**Before**
> “Write a reply to an unhappy customer.”

The AI doesn’t know what happened or what you can offer. It writes a generic apology letter.

**After**
> “I run an online clothing shop in Lagos. A customer received their order 5 days late and in the wrong size. Write a short WhatsApp reply (5 lines max), warm and professional. Offer a free exchange with free delivery. Don’t invent any other compensation.”

Context, task, format, constraint: the answer is usable as is.

## Example 2: a SQL query

**Before**
> “How do I get the best customers in SQL?”

**After**
> “PostgreSQL database. Table orders(id, customer_id, amount, created_at) and table customers(id, name). Write a query returning the 10 customers who spent the most in 2026, with their name and total, sorted from highest to lowest. Explain the query in three sentences.”

By giving the table structure and the database system, you avoid a query that won’t run on your side. Keep our [SQL cheat sheet](/en/resources/sql-cheat-sheet) nearby to check the syntax.

## Example 3: a product description

**Before**
> “Write a description for my soap.”

**After**
> “Write a product listing for a handmade shea butter soap, made in Ghana, sold for 25 cedis. Audience: women aged 25 to 45, buying on Facebook. Format: a catchy title, 3 bullet points on the benefits, one call-to-action sentence. No medical claims. Here’s a listing I like, copy its tone: [paste your favorite listing].”

The tone example is often the most powerful ingredient: AI imitates a style it’s shown very well.

## Example 4: debugging code

**Before**
> “My code doesn’t work, help me.”

**After**
> “Node.js 22, Express. This route returns a 500 error when the cart is empty. Here is the route’s code and the full error message. Give the likely causes, from most to least probable, then suggest a fix that handles the empty cart without hiding other errors.”

Version, code, exact message, expected behavior: everything a colleague would ask you before helping.

## A template to copy

When you don’t know where to start, just fill in this frame:

> “Context: I am [who you are] and I need [result] for [recipient]. Task: [precise verb + object]. Format: [length, structure, tone]. Example of what I like: [paste an example]. Avoid: [what you don’t want].”

There’s nothing magic about it, but it forces you to give the information most often missing.

## Iterate instead of rewriting everything

A prompt isn’t a one-shot exam. If the answer is almost right, **fix it in the conversation**:

- “Shorter, 3 sentences max.”
- “Keep the structure but use a more formal tone.”
- “Replace the example with a case in local currency.”
- “What did you assume that I didn’t tell you?”

That last question is precious: it reveals the AI’s assumptions, which you can then correct.

## The most common mistakes

- **Too vague**: “tell me about marketing” gets a textbook answer.
- **Several tasks at once**: split into steps, one request per message.
- **Trusting without checking**: figures, dates, quotes and commands must be verified.
- **Sharing sensitive data**: no passwords, API keys or customers’ personal information.

For concrete coding uses, also read [our five ways to use AI as a developer](/en/blog/5-ways-developers-can-use-ai-to-save-time).

## Key takeaways

- Context, precise task, format, example, constraints: five ingredients.
- One example of what you want beats a long explanation.
- Fix in the conversation instead of starting over.
- Always check the facts, figures and code suggested.
