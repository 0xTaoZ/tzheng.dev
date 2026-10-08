---
title: "Building a small IOC extraction tool"
slug: "ioc-tool"
date: 2026-05-08
excerpt: "Parsing IPs, URLs and hashes is a small project, but it feels close to real blue-team work."
tags: ["blue-team", "python"]
category: "Blue Team"
featured: true
status: "published"
readingTime: "2 min"
updated: 2026-10-06
project: "sentinel-ioc-toolkit"
---

IOC extraction is a good student project because the problem is small but realistic. Reports and logs often mix normal text with IPs, domains, URLs and hashes.

The first version should be predictable. I care more about clean output and duplicate removal than trying to detect everything.

I also learned that output format matters. A tool is more useful if the result can become CSV, JSON, or input for another investigation workflow.

Later I want to add tests, sample logs, and maybe reputation API lookup. But the base should stay simple enough that I can explain it.

## Update: the current Python engine

**6 October 2026.** The original note above describes the initial plan. The engine now has tests, JSON reports and optional reputation lookup.

It normalizes forms such as `hxxp://` and `[.]`. It also avoids counting a URL's host twice as a bare domain, or treating an email's domain as an unrelated indicator. The [repository](https://github.com/0xTaoZ/Sentinel-IOC-Toolkit) lists the supported indicator types.

The report includes individual values and counts. A bigger count can mean extra coverage, but it can also mean duplicate matches. Checking both makes an extraction change easier to review.

Reputation lookup is separate. `--no-enrich` keeps the run offline even if a key exists, and the IP stays in the output with reputation status `disabled`.

```sh
cd python-backend
python3 extractor.py ../test.txt --no-enrich --output ioc-report.json
```

The [offline-mode article](/articles/sentinel-offline-enrichment/) shows the CLI-to-engine path and its regression test. The Java interface is still in progress; this note is about the Python implementation.

An extracted string needs investigation context. A hash-shaped value alone does not prove that a file is malicious, and normalization does not prove a destination is reachable.
