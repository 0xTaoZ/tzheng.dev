---
title: "StudyPulse"
slug: "studypulse"
date: "2026-10-03"
status: "active"
type: "Full-stack product"
featured: true
priority: 1
stack: ["TypeScript", "React", "Workers", "D1"]
github: "https://github.com/0xTaoZ/studypulse-app"
excerpt: "A study tracker that connects planning, recall checks and spaced review. Built for my own cyber security semester."
outcome: "Key decision: evidence earns progress; elapsed time alone does not."
---

## The problem

A study timer measures attendance, not understanding. I needed a system that could help me decide what to study next, keep a review schedule, and make progress depend on something I could demonstrate.

StudyPulse combines a weekly plan, focus timer, topic-level memory model and recall checks. A game layer makes progress visible, but the reward rules have to remain consistent with the learning model.

## Architecture

A single Cloudflare Worker serves the API and static assets. The client uses React and TanStack Query. Hono handles routes, Zod validates inputs, and D1 with Drizzle stores the data. Shared TypeScript modules contain the domain logic as pure functions.

```text
React client
    → Worker routes
    → services / domain rules
    → repositories
    → D1
```

The personal deployment is access-controlled. The [public source](https://github.com/0xTaoZ/studypulse-app) is a standalone export with deployment-specific configuration removed; it is not an anonymous live demo.

## Two kinds of judgment

The grading model evaluates rubric points. The server computes scores, rewards and mastery. Those responsibilities are separate because a language model's judgment and its arithmetic have different failure modes.

Model-provided numbers are bounded. Evidence imported from an external quiz report is checked against quoted text and discounted rather than accepted at face value. A summary can count as study without establishing mastery.

This is a single-user learning product, not a high-stakes exam platform. An invented report is still possible; the system does not claim to prevent all cheating.

## A constraint that shaped the implementation

The forecast uses an analytic calculation rather than a simulation to stay within the hosting plan's CPU budget. Topic recall estimates drive review scheduling; time alone cannot establish that a topic has been learned.

The [architecture notes](https://github.com/0xTaoZ/studypulse-app/blob/main/ARCHITECTURE.md) explain the memory model and reward rules. Unit and API tests are part of the public source.

## What this demonstrates

Product reasoning and implementation meet here: deciding what the system should reward, isolating arithmetic from model judgment, keeping domain rules testable, and making a small deployment understandable enough to maintain.

## Boundaries

It is a personal study tool. Recall estimates are model outputs, not validated predictions of exam results. It has no multi-tenant administration, billing or public student onboarding.
