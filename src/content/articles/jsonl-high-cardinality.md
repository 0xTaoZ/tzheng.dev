---
title: "Hiding noisy IDs in a JSONL report"
slug: "jsonl-high-cardinality"
date: "2026-10-06"
project: "jsonl-lens"
excerpt: "How jsonl-lens hides repeated value lists while keeping the field warning and schema counts."
tags: ["python", "jsonl", "testing"]
category: "Engineering"
featured: false
status: "published"
readingTime: "2 min"
---

jsonl-lens prints common values for scalar fields. That is useful for something like `level`, which repeats across records. For a request ID that is different each time, the same section can fill up with values that do not help summarize the file.

I added a flag to hide those value lists. The report still shows the field and why its values were hidden.

## The current rule

The [profiler](https://github.com/0xTaoZ/jsonl-lens/blob/6b2d9a0/src/jsonl_lens/profiler.py) marks a field as high cardinality when it has at least four scalar values and at least 80 percent of them are distinct.

Four different request IDs therefore qualify. Four records with only two different log levels do not. The threshold is a heuristic for a short local report, and it is fixed in the current code.

A field with many unique values is not necessarily bad data. An identifier is often supposed to be unique. The flag is about keeping the summary readable.

## Hide the values, keep the warning

```sh
PYTHONPATH=src python3 -m jsonl_lens samples/events.jsonl \
  --fields-only --hide-high-cardinality-values
```

A field has to meet the threshold in the input before its common-value list is hidden. The command does not label every ID by its name.

The option filters the value lists when formatting the report. The high-cardinality section remains, along with field counts, types and missing-value information. Include and exclude filters still control which fields are shown.

There is a JSON form too:

```sh
PYTHONPATH=src python3 -m jsonl_lens samples/events.jsonl \
  --json --fields-only --hide-high-cardinality-values
```

## Check both output formats

The [CLI tests](https://github.com/0xTaoZ/jsonl-lens/blob/6b2d9a0/tests/test_cli.py) use four unique IDs and repeated levels. They check text and JSON output so that hiding a value list does not also hide the warning.

The current repository passed 26 tests when I checked it. The [change](https://github.com/0xTaoZ/jsonl-lens/commit/6b2d9a0) is small, but its output needs that distinction: less noise should not remove the explanation for the missing values.
