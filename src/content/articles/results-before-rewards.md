---
title: "Keeping study time and recall scores separate"
slug: "results-before-rewards"
date: 2026-10-03
excerpt: "A StudyPulse note about timer records, grading responses and reward calculations."
tags: ["typescript", "product-design", "evidence", "testing"]
category: "Engineering"
featured: true
status: "published"
readingTime: "2 min"
updated: 2026-10-06
project: "studypulse"
---

[StudyPulse](https://github.com/0xTaoZ/studypulse-app) is the study tool I built for my semester. It records study time and recall results separately.

A timer tells me how long a session lasted. It does not tell me whether I can explain the topic. Keeping the two records separate avoids giving mastery credit only for time spent.

## Grading and score calculation

A language model can grade rubric points. The server checks the returned values and calculates scores and rewards in code. I can test that calculation without depending on a new grading response each time.

This does not remove grading uncertainty. A model can still judge an answer incorrectly. The checks mainly control which values enter the calculation.

Imported quiz reports need another check. The Worker re-evaluates the report, requires credited topics to quote it and checks that the quoted text exists. It reduces credit when the evaluations disagree substantially.

## The limit of a report

Those checks do not prove where an imported report came from. Someone could still invent the report. The feature is useful for personal tracking, but I would not use it as proof of a student's result in a formal assessment.

The [public architecture notes](https://github.com/0xTaoZ/studypulse-app/blob/main/ARCHITECTURE.md) and domain tests explain the current rules. The [project page](/projects/studypulse/) covers the rest of the application.
