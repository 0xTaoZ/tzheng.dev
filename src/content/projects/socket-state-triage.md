---
title: "socket-state-triage"
slug: "socket-state-triage"
date: "2026-10-03"
status: "active"
type: "Linux socket review"
featured: false
priority: 9
stack: ["C", "Linux", "No dependencies"]
github: "https://github.com/0xTaoZ/socket-state-triage"
excerpt: "A dependency-free utility for reviewing Linux socket state, wildcard listeners and broad privileged-port bindings."
outcome: "Makes host-level exposure questions concrete and testable."
---

## Focus

The tool reviews Linux socket output and highlights cases worth examining, including wildcard binds such as `*:PORT` and privileged ports exposed on broad listener addresses.

## Why the representation matters

An address format should not disappear from the summary merely because it differs from an ordinary IPv4 string. Wildcard bindings are counted and included in the broad-bind checks.

## Evidence and boundaries

The [repository](https://github.com/0xTaoZ/socket-state-triage) contains source, examples and `make test`. It is a review helper, not a firewall or proof of exposure from every network. Host configuration and routing still determine reachability.
