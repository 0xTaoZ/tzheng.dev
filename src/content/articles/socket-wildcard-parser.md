---
title: "Handling *:PORT in my socket parser"
slug: "socket-wildcard-parser"
date: "2026-10-06"
project: "socket-state-triage"
excerpt: "The wildcard case, the C helper and a two-row regression fixture in socket-state-triage."
tags: ["C", "linux", "testing"]
category: "Networking"
featured: true
status: "published"
readingTime: "2 min"
homepageOrder: 2
---

I added wildcard-bind handling to socket-state-triage on 3 October. The tool reads socket listings and prints counts and rows worth reviewing. The change handles addresses written as `*:PORT`.

The earlier code recognized `0.0.0.0:` and `[::]:`. A wildcard form needed its own check so it would appear in the report too.

## The helper is short

```c
static int is_wildcard_bind(const char *local) {
    return strncmp(local, "*:", 2) == 0;
}
```

This matches the representation the parser expects. It does not try to accept every possible socket format. The function is used both for the wildcard counter and the broad-bind condition.

The second part matters for privileged ports. A wildcard bind on port 22 should be included in that count, just like a broad IPv4 or IPv6 bind on a port below 1024.

## Two rows make the difference clear

The [test](https://github.com/0xTaoZ/socket-state-triage/blob/1d91d84/tests/run_tests.sh) contains this input:

```text
tcp LISTEN 0 128 *:22   *:*
tcp LISTEN 0 128 *:8080 *:*
```

It checks for two wildcard binds and one privileged broad bind. Only 22 is below 1024. It also checks that the report includes the wildcard review line.

I checked the current repository with `make test`; it passed. The [commit](https://github.com/0xTaoZ/socket-state-triage/commit/1d91d84) includes the source, fixture and README changes.

A wildcard listener still needs context. Firewall rules and routing affect which clients can reach it. This change improves the local report; it does not turn the tool into an exposure scanner. The [networking note](/articles/listener-is-not-reachability/) covers that difference.
