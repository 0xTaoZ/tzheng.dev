---
title: "What I learned from a small open source PR"
slug: "small-pr-good"
date: 2026-05-22
updated: 2026-10-06
excerpt: "A small PR can show real engineering skill when it is focused and easy for maintainers to review."
tags: ["learning", "open-source"]
category: "Open Source"
featured: true
status: "published"
readingTime: "2 min"
---

Before I tried open source, I thought contribution means a big feature. Now I think a small bug fix can be better for learning.

A good PR has a small story. Find the issue, understand why it happens, make a focused change, and add a fixture or test if possible.

The hard part is not only writing code. The hard part is reading the project style and respecting how maintainers think.

This changed how I see engineering. Good code is not loud. It is clear, reviewable, and it reduces work for other people.

## Update: checking the changed behavior

**6 October 2026.** The May note above describes the approach. A later example is [cfn-lint #4704](https://github.com/aws-cloudformation/cfn-lint/pull/4704).

The fix checks a whole lifecycle-policy value that uses `Fn::Select`. The function still has valid uses elsewhere, so the change stays at the policy layer. The [article about that patch](/articles/lint-at-the-owning-layer/) explains the input forms.

For a regression, I need a fixture that fails because of the reported problem. A neighboring case that already passes is useful too, but it checks something different. Together they help show that the fix handles the failure without changing the other case.

The review needs that explanation as well as the code. A short reproduction command and expected result make it easier for a maintainer to inspect the change.

I keep merged work in the [contribution record](/contributions/#record). A local test, upstream CI and a merge are different steps. The page links the step that actually happened, rather than treating a proposal as an accepted contribution.
