---
title: "Keeping IOC extraction offline with --no-enrich"
slug: "sentinel-offline-enrichment"
date: "2026-10-06"
project: "sentinel-ioc-toolkit"
excerpt: "The CLI flag, early return and configured-key regression behind Sentinel’s offline extraction mode."
tags: ["python", "blue-team", "testing"]
category: "Blue Team"
featured: false
status: "published"
readingTime: "2 min"
---

Sentinel can extract indicators from a text file and optionally look up IP reputation with AbuseIPDB. I added `--no-enrich` so extraction can stay offline even when a key is configured.

Without this option, having a key in the environment can make a local scan use the network. The flag lets the caller choose the behavior for that run.

## Pass the choice to the engine

The CLI passes `enrich_ips=not args.no_enrich` into `SentinelEngine`. The reputation method checks that value before looking at the API key or calling the HTTP client:

```python
if not self.enrich_ips:
    return {"status": "disabled"}
```

The extracted IP remains in the JSON report. Only its reputation data changes. `disabled` is different from a score of zero: it means the lookup did not run, so the tool has no reputation score to report.

The [source](https://github.com/0xTaoZ/Sentinel-IOC-Toolkit/blob/12cfb16/python-backend/extractor.py) shows the order of those checks.

## Test the case where a key exists

A test with no key would be weaker, because that already prevents the real lookup. The [regression](https://github.com/0xTaoZ/Sentinel-IOC-Toolkit/blob/12cfb16/tests/test_extractor.py) configures a test key and a fake client that would return a high reputation score. It runs the CLI with `--no-enrich` and checks for `{"status": "disabled"}` in the output.

The test uses a temporary input and output file. It therefore covers the flag, engine call and saved report together. The current repository passed 11 tests when I checked it.

## Use it with a local file

```sh
cd python-backend
python3 extractor.py ../test.txt --no-enrich --output ioc-report.json
```

The [change](https://github.com/0xTaoZ/Sentinel-IOC-Toolkit/commit/12cfb16) keeps parsing independent of the optional lookup. It does not decide whether an extracted IP is malicious. That still needs context from the investigation.
