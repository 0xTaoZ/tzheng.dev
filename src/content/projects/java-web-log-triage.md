---
title: "java-web-log-triage"
slug: "java-web-log-triage"
date: "2026-10-03"
status: "active"
type: "Web-log investigation"
featured: false
priority: 4
stack: ["Java", "Apache / Nginx", "No dependencies"]
github: "https://github.com/0xTaoZ/java-web-log-triage"
excerpt: "A plain-Java CLI that links suspicious paths and scanner-style user agents to the clients that triggered them."
outcome: "Builds with javac and make; reports reviewable counts and findings."
---

## The problem

A list of suspicious URLs is incomplete if it does not show which clients produced them. This tool connects simple request-path and user-agent checks with source summaries for local access-log review.

## Implementation

The parser reads Apache/Nginx combined logs. The analyzer groups source IPs, status codes, method/status pairs, user agents and request extensions. Repeated 4xx and 5xx sources are summarized separately.

The flagged-source summary counts a request once even when both its path and user agent match. This avoids inflating a client's count simply because one event satisfies two rules.

```sh
make test
make run
```

## Why plain Java

The project makes parsing, collections, grouping and detection logic visible. It needs only `javac` and `make`; adding a framework would make the learning and review surface larger without answering a new investigation question.

## Evidence and limits

The repository includes a synthetic log with normal requests, suspicious paths, scanner-style user agents and a malformed line. [Rule notes](https://github.com/0xTaoZ/java-web-log-triage/blob/main/docs/rules.md) explain the checks.

The checks are simple string heuristics. They do not establish intent or provide production incident correlation.
