---
title: "Counting a flagged web request once"
slug: "java-flagged-request-counts"
date: "2026-10-06"
project: "java-web-log-triage"
excerpt: "A request can match two rules. The source summary should still count one request."
tags: ["java", "logs", "testing"]
category: "Engineering"
featured: false
status: "published"
readingTime: "2 min"
---

My Java access-log tool checks request paths and user agents. A single request can match both checks. For example, a request for `/admin/login.php` made with a `curl/` user agent produces two findings in the current rules.

When I added a summary of flagged request sources, I needed to keep the request count separate from the number of findings.

## Where the counter goes

The analyzer keeps both finding results. It then increments the source counter once if either check matched:

```java
if (finding != null || userAgentFinding != null) {
    increment(flaggedRequestSourceCounts, entry.ipAddress());
}
```

If the increment were inside each matching branch, one request could add two to the source total. That would make the section's label misleading.

The [analyzer change](https://github.com/0xTaoZ/java-web-log-triage/blob/de6569f/src/main/java/dev/tzheng/weblogtriage/TriageAnalyzer.java) puts the count after both checks. The report gets a separate `Flagged request sources` section.

## A fixture with two kinds of match

The [test](https://github.com/0xTaoZ/java-web-log-triage/blob/de6569f/src/test/java/dev/tzheng/weblogtriage/TestRunner.java) includes requests from `198.51.100.23` to an admin path and a path-traversal form, both with a curl user agent. It expects two flagged requests for that source.

It also includes normal API requests from another source and checks that the source is absent from the flagged count. A formatter test checks that the new section appears in the text report.

The repository uses plain Java and a small test runner. I checked it with `make test`; the runner reported that all tests passed.

## What the count means

The count tells me how many parsed requests from a source matched the current rules. It does not tell me how many attacks succeeded. A curl user agent can be normal, and a suspicious-looking path can be part of a test.

I still need the original requests and service context. The source summary helps me choose which rows to inspect, while the individual findings explain which rules matched.
