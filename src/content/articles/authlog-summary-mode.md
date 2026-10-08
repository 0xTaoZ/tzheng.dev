---
title: "Adding a short summary mode to authlog-watch"
slug: "authlog-summary-mode"
date: "2026-10-06"
project: "authlog-watch"
excerpt: "Keep event totals visible while leaving user, source and finding details to the full report."
tags: ["python", "ssh", "testing"]
category: "Infrastructure"
featured: false
status: "published"
readingTime: "2 min"
---

authlog-watch reads Linux SSH authentication logs. Its full report includes event totals, source IPs, targeted users and findings. I added `--summary-only` for cases where I want to inspect the totals first.

```sh
PYTHONPATH=src python3 -m authlog_watch samples/auth.log --summary-only
```

## The parser still reads the same input

The flag changes the text report. It does not change how log lines are parsed or how the summary is built.

In [cli.py](https://github.com/0xTaoZ/authlog-watch/blob/196a3f3/src/authlog_watch/cli.py), the report first prints the counters. If summary-only mode is enabled, it returns before the detailed sections.

The sample has ten parsed SSH events. The short output includes failed passwords, invalid users, accepted logins and disconnect-related counts. Source and user lists are left for the full report.

## Give the flags a clear meaning

`--json` is already another output mode. I put it in the same mutually exclusive argument group as `--summary-only`. Passing both gives an argument error rather than choosing one silently.

The JSON report therefore keeps its existing structure. A script requesting JSON does not receive a smaller object because it also passed a text-formatting flag.

## What the tests check

The [CLI tests](https://github.com/0xTaoZ/authlog-watch/blob/196a3f3/tests/test_cli.py) check that the short report keeps the total of ten events and the accepted-public-key count. They also check that source lists, user lists and findings are absent. Another test checks the incompatible flag combination.

I checked the current repository with its unittest command; all 29 tests passed. The [commit](https://github.com/0xTaoZ/authlog-watch/commit/196a3f3) contains this mode.

The shorter output has a cost: I cannot use it alone to inspect the finding details. For that I need the normal report or JSON. It is a first view of the log, with the fuller output still available.
