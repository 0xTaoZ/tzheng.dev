---
title: "Sentinel-IOC-Toolkit"
slug: "sentinel-ioc-toolkit"
date: "2026-10-03"
status: "learning"
type: "Indicator extraction"
featured: false
priority: 5
stack: ["Python", "IOC", "JSON"]
github: "https://github.com/0xTaoZ/Sentinel-IOC-Toolkit"
excerpt: "Extracts and normalizes indicators from investigation text, including defanged URLs, domains, hashes and CVE identifiers."
outcome: "Local extraction works without an enrichment API key."
---

## The workflow

Investigation text often contains indicators in inconsistent forms. The extractor normalizes common defanging such as `hxxp://` and `[.]`, then emits a JSON report with indicators and per-type counts.

## Current behavior

The Python engine extracts IP addresses, URLs, email addresses, bare domains, CVE identifiers and MD5/SHA1/SHA256 hashes. It avoids duplicating a host already captured as a URL and avoids treating an email's domain as an unrelated bare-domain indicator.

```sh
cd python-backend
python3 extractor.py ../test.txt --output ioc-report.json
```

## Optional enrichment

AbuseIPDB enrichment is optional. Local parsing does not require an API key. Reputation data is additional context; extracting a string does not establish that it is malicious.

## Boundaries

This is an early blue-team utility. The Python extraction path is the focus of this case study; the Java interface remains work in progress. Regex extraction cannot replace contextual validation of an indicator.
