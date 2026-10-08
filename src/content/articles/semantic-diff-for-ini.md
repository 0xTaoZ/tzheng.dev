---
title: "Adding INI files to Graphtage's semantic diff"
slug: "semantic-diff-for-ini"
date: 2026-10-08
seriesMonth: "2026-09"
excerpt: "Graphtage #120 parses INI with the standard library, reuses the existing tree model, and tests the formatter with randomized round trips."
tags: ["python", "open-source", "testing"]
category: "Engineering"
featured: false
status: "published"
---

This note looks at [Graphtage #120](https://github.com/trailofbits/graphtage/pull/120), merged in September 2026. I wrote it in October. Graphtage is Trail of Bits' semantic diff tool for tree-shaped files such as JSON, YAML, XML, TOML and CSV.

## Why a semantic diff helps

A line diff of two configuration files reports moved lines as deletions and insertions. If two sections swap places, the diff can look large even though no setting changed. A semantic diff compares structure: sections, keys and values. That is useful when reviewing a configuration change, where the question is "which setting changed?" rather than "which line moved?".

INI files are still common for configuration, but Graphtage had no filetype for them. [Issue #49](https://github.com/trailofbits/graphtage/issues/49) asked for one.

## Parsing without a new dependency

Python's standard `configparser` already reads INI files. Two settings matter for a diff tool:

```python
parser = configparser.ConfigParser(interpolation=None)
parser.optionxform = str
```

`interpolation=None` keeps values such as `%(home)s/logs` as they are written. A diff should show the text in the file, not the result of expanding it. Setting `optionxform` to `str` keeps the original key case; by default `configparser` lowercases option names, which would make a renamed key invisible.

## Reusing the tree

Graphtage already knows how to diff nested mappings of strings, because JSON is exactly that. The INI parser converts the file into a dictionary of sections, each holding its options, and passes it to the JSON tree builder. Default-section values are kept as their own section. The diff algorithm itself is unchanged.

Only output needed new code. An INI formatter prints each section as `[name]` and each option as `key = value` without JSON quotes, and escapes newlines inside values so that a multi-line value cannot break the layout.

The filetype is registered with the INI MIME types, and the CLI adds `.ini` to Python's MIME table when the platform does not already know it.

## Testing the formatter with random input

Graphtage's formatting tests generate random data, write it in the target format, parse it again and compare. The INI test builds one to five sections with one to five options each, writes them with `configparser`, and checks that Graphtage's parse and format round trip preserves the structure.

The test excludes characters that INI cannot represent unambiguously in keys and section names, such as `=`, `:`, brackets and newlines, and runs 200 iterations. Values may be empty strings. Defining that alphabet was most of the work in the test: it documents what the filetype supports.

I also checked the CLI by hand on two INI files, and ran Ruff on the new module.

## Limits

INI has no single specification. This filetype follows `configparser`'s dialect. Comments are not kept, since `configparser` discards them, so a change that only edits a comment does not appear in the diff. Files that `configparser` rejects produce a parse error rather than a guess.
