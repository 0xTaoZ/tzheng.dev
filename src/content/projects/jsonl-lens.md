---
title: "jsonl-lens"
slug: "jsonl-lens"
date: "2026-10-03"
status: "active"
type: "Data inspection"
featured: true
priority: 3
stack: ["Python", "JSON Lines", "CLI"]
github: "https://github.com/0xTaoZ/jsonl-lens"
excerpt: "A quick inspection tool for messy event exports: missing fields, type changes, nested paths and noisy identifiers."
outcome: "One report before writing the parser or importing the data."
---

## The problem

A JSON Lines export can look consistent while individual records differ: a field is absent, a value changes type, one enrichment step failed, or a request identifier overwhelms a useful grouping field.

jsonl-lens makes those differences visible before a parser or import pipeline commits to assumptions about the data.

## What the report tells you

It counts valid and invalid lines, summarizes field presence and scalar types, distinguishes missing values from nulls, inspects one level of nested object paths, flags high-cardinality scalar fields, and reports record lengths.

Malformed input is reported by line number. It is not silently converted into a plausible-looking record.

```sh
PYTHONPATH=src python3 -m jsonl_lens samples/events.jsonl
PYTHONPATH=src python3 -m jsonl_lens samples/events.jsonl --json
```

## Reducing noise without hiding structure

`--fields-only` focuses the report on schema information. `--include-field` restricts summaries to named fields. `--hide-high-cardinality-values` suppresses unhelpful value lists while retaining the warning that the field is mostly unique.

That separation matters: a smaller report should still explain why something was omitted.

## Evidence

The [usage examples](https://github.com/0xTaoZ/jsonl-lens/blob/main/docs/usage-examples.md) cover report controls. Unit tests exercise parsing and output behavior, including the text and JSON surfaces.

## Boundaries

This is a local inspection tool for small data files, not a distributed profiler or schema registry. Nested inspection is intentionally limited to one level. It cannot tell whether a type difference is a bug without domain context.
