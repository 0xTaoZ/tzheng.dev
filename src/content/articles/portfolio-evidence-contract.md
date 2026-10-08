---
title: "Linking a project page to its evidence"
slug: "portfolio-evidence-contract"
date: 2026-10-06
seriesMonth: "2026-03"
excerpt: "What I want a reader to be able to check from a case study: inputs, tests, revisions and limits."
tags: ["portfolio", "testing", "open-source"]
category: "Engineering"
featured: false
status: "published"
readingTime: "2 min"
project: "tzheng-dev"
---

This is a new follow-up to my March site note. I wrote it while updating the project pages in October.

A repository link lets someone read my code. A case study should also explain what to look for. I want each page to name the problem, show the change and link to the check behind it.

For example, jsonl-lens reports missing fields, explicit nulls and mixed types. It inspects only one nested level. Those details tell a reader more about the tool than a broad claim that it handles messy data.

## Match the claim to its evidence

| What the page says | What I should link |
| --- | --- |
| A parser handles a case | The input and regression test |
| An upstream fix was accepted | The merged PR |
| A CLI can produce a report | A command and sample output |
| A change is deployed | The deployment and release information |

These are different checks. A passing unit test does not show that the website is live. A merged PR does not tell us which package version a user has installed.

When sharing a reproduction, the revision matters too:

```sh
git rev-parse HEAD
git status --short
```

The [Git documentation](https://git-scm.com/docs/git-rev-parse) explains revision lookup. The first command identifies committed code; the second shows whether there are local changes on top of it.

## Include a useful limit

For [jsonl-lens](/projects/jsonl-lens/), one-level nested inspection is a useful limit to state. For CloudTrail review, a flagged event still needs investigation. These limits help someone decide whether the tool fits their input.

I also keep my own projects separate from [upstream contributions](/contributions/). Building a tool and getting a patch accepted are both useful work, but they show different things. Direct links let a reader inspect either one without relying only on the summary on this site.
