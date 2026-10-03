---
title: "A study timer should not decide what you learned"
slug: "results-before-rewards"
date: 2026-10-03
excerpt: "How StudyPulse separates time, evidence and arithmetic so a motivating interface does not reward the wrong behavior."
tags: ["typescript", "product-design", "evidence", "testing"]
category: "Product engineering"
featured: true
status: "published"
readingTime: "5 min"
---

A timer answers “how long was the session?” It does not answer “what can I now explain or recall?” If a study product treats those as the same question, its rewards can become detached from its purpose.

[StudyPulse](https://github.com/0xTaoZ/studypulse-app) is the tool I built for my own semester. Its planning, review and game systems have to agree on what progress means.

## Separate presence from evidence

Study time is useful context. A recall check is a different observation: it tests whether I can produce an answer. An imported quiz report is another kind of evidence with a different reliability boundary.

The product records time, but formal progress depends on checked results. A summary can establish that a topic was studied without establishing mastery.

This distinction changes the interface as well as the data model. Completing a session should lead to an opportunity to demonstrate learning, not automatically to a larger number.

## Separate grading from arithmetic

A language model can evaluate rubric points. The server should compute the score and reward from those evaluations.

StudyPulse bounds model-provided values and uses deterministic code for the resulting arithmetic. That makes the reward rule testable independently of a model response and prevents a free-form answer from directly declaring its own total.

This is a separation of responsibilities, not a guarantee that the grader is always correct.

## Imported evidence needs its own boundary

An external report is convenient because learning happens outside the application. But accepting its score verbatim would let the report decide its own value.

The Worker re-evaluates imported evidence, requires credited topics to quote the report, checks that quoted text is present, and discounts substantial disagreement. Those checks constrain what can be credited; they do not authenticate the origin of the report.

A determined user can still invent evidence. For a personal tool, the goal is useful self-measurement with limited incentives to game it. A high-stakes assessment platform would need a different model.

## Test the incentive, not just the button

A unit test that confirms “clicking returns success” says little about whether the rule rewards learning. The important cases are the ones that could produce progress without evidence or inflate a reward through inconsistent arithmetic.

The [public architecture notes](https://github.com/0xTaoZ/studypulse-app/blob/main/ARCHITECTURE.md) and domain tests describe those decisions. Exact rule versions evolve, so the source is the reference for current behavior.

## The product lesson

A pleasant interface cannot compensate for a bad reward function. Decide what the system should recognize, make the evidence boundary explicit, and put the arithmetic somewhere you can test it.
