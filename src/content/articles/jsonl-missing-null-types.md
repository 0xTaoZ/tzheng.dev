---
title: "Missing fields, null values and type changes in JSONL"
slug: "jsonl-missing-null-types"
date: 2026-10-06
seriesMonth: "2026-08"
excerpt: "How jsonl-lens counts these cases separately, with three small example records."
tags: ["python", "jsonl", "testing"]
category: "Engineering"
featured: false
status: "published"
readingTime: "2 min"
project: "jsonl-lens"
---

I wrote this in October for the August reading group. It uses the current jsonl-lens code.

jsonl-lens checks a local JSON Lines file before another script uses it. One thing it reports is the difference between a missing field, a null value and a change of type.

## Three records that need different counts

```json
{"duration_ms": 1430, "service": "api"}
{"duration_ms": null, "service": "worker"}
{"service": "worker"}
```

These are example records. `duration_ms` appears twice, is null once and is missing once. If I only count whether the key exists, I lose the difference between the second and third records.

The [profiler](https://github.com/0xTaoZ/jsonl-lens/blob/main/src/jsonl_lens/profiler.py) keeps field counts and type counts. Missing values are calculated from the number of valid object records. Null values are counted from the type information.

A duration stored as a string is another case. It may look like a number to a person, while a script handles it differently. The report shows mixed types but leaves the decision about the data to its user.

## Parsing each line

The tool reports invalid JSON with a line number. It also rejects a line that is valid JSON but is not an object. A JSON array can decode successfully and still be the wrong record format for this report.

Blank lines are reported too. The valid-record count is therefore important when reading the field summary. A field missing from one valid record should not be counted in the same way as a line that failed to parse.

## How far the report goes

Nested inspection covers one level, such as `http.status`. It does not describe arbitrary nested arrays or build a complete schema.

For a short report I can use:

```sh
PYTHONPATH=src python3 -m jsonl_lens samples/events.jsonl --fields-only
```

The [usage examples](https://github.com/0xTaoZ/jsonl-lens/blob/main/docs/usage-examples.md) include text and JSON output. The report helps find assumptions to check before importing the file. It cannot decide whether two services are supposed to use the same fields.
