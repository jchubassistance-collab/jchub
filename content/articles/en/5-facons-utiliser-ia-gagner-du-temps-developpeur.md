---
slug: 5-ways-developers-can-use-ai-to-save-time
title: 5 ways to use AI to save time as a developer
description: >-
  Understanding unfamiliar code, writing tests, debugging, generating
  boilerplate, documenting: five concrete uses of AI for developers, with their
  guardrails.
excerpt: >-
  Understanding unfamiliar code, writing tests, debugging, generating
  boilerplate, documenting: five concrete uses of AI for developers, with their
  guardrails.
keywords:
  - ai for developers
  - ai coding assistant
  - save time coding
  - chatgpt for developers
  - ai unit tests
sourceHash: 5a81ec294b4cc07aa06e99b7
translatedAt: '2026-11-04T14:17:52.617Z'
---
AI assistants don’t replace a developer, but they can save you hours every week, as long as you use them where they’re good and check what they produce. Here are five concrete uses, tested day to day, each with the trap to avoid.

## 1. Understand code you didn’t write

You take over a project and land on a 200-line function with no comments. Rather than dissecting it alone for an hour, paste it into the assistant and ask:

> “Explain what this function does, step by step. Point out the edge cases it doesn’t handle.”

You get a plain-language summary, then you check each point in the code. It also works very well for an unreadable regular expression: have it explained, then test it with real examples in the [regex tester](/en/tools/regex-tester).

**The trap**: AI can be confidently wrong about a detail. Its explanation is a lead, not the truth.

## 2. Write the tests you keep postponing

Writing tests is useful but repetitive: exactly what AI does fast. Give it your function and ask:

> “Write Jest unit tests for this function. Cover the normal case, empty inputs, negative values and errors.”

It often suggests cases you hadn’t thought of. Run the tests: if they fail, either the test is wrong, or you just found a real bug.

**The trap**: a generated test that “passes” may check nothing useful. Read the assertions, one by one.

## 3. Debug from an error message

A cryptic error message, a thirty-line stack trace: paste both, with the code involved, and ask for the **likely causes, from most to least probable**. For a format error, clean the data first: malformed JSON jumps out once it’s run through the [JSON formatter](/en/tools/json-formatter).

Give context: the language, the version, what you’ve already tried. A precise question gets a precise answer.

**The trap**: AI sometimes suggests hiding the error (an empty `try/catch`) instead of fixing it. Always ask *why* it crashes, not just *how* to silence the message.

## 4. Generate the boilerplate

Some tasks are anything but exciting: converting a data structure, writing a SQL query, a script that renames 300 files, a form with fifteen fields and their validation. Describe the expected input and output precisely:

> “Write a TypeScript function that turns this array of orders into a total per customer. Here is an example input and the expected output.”

One concrete input/output example beats a long paragraph of explanations.

**The trap**: generated code may call a function that doesn’t exist, or an old version of a library. Always run it, and read it before shipping.

## 5. Document and review

AI is very handy for the work around the code:

- drafting a project’s **README** from its structure;
- suggesting a clear **commit message** from a diff;
- **reviewing** a function and suggesting clearer variable names;
- explaining a change to a non-technical colleague.

**The trap**: wrong documentation is worse than none. Check that every command it mentions really works.

## Security rules to never forget

- **Never paste secrets**: API keys, passwords, tokens, customers’ personal data. Replace them with fake values before sharing code. Our article on [securing access in the vibe coding era](/en/blog/secure-access-vibe-coding-secret-generation) covers the right habits.
- **Follow your company’s rules**: some forbid sending internal code to an external service.
- **You stay responsible** for the code you ship, whether it came from you or from an AI.

## Ask good questions

The quality of the answer depends mostly on the quality of the request: context, precise task, expected format, example. We’re dedicating a full article to it, with before/after examples, coming next week.

## Key takeaways

- AI is most useful for repetitive tasks and for understanding unfamiliar code.
- Run and read everything it produces: it can be wrong with confidence.
- Ask why an error happens, not just how to hide it.
- Never put secrets or customer data in a conversation with an AI.
