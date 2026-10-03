---
title: "A compatibility fix is still a security decision"
slug: "ssh-trust-boundaries"
date: 2026-10-03
excerpt: "What an accepted pyinfra patch taught me about OpenSSH host certificates, strict checking and preserving the trust boundary."
tags: ["ssh", "infrastructure", "open-source", "security"]
category: "Infrastructure"
featured: true
status: "published"
readingTime: "4 min"
---

A tool can fail to recognize a valid trust relationship without being wrong to reject an unfamiliar host. That distinction matters when fixing SSH compatibility.

[pyinfra PR #1945](https://github.com/pyinfra-dev/pyinfra/pull/1945) began with a specific gap: the connector skipped `@cert-authority` lines in `known_hosts` because Paramiko could not parse them as ordinary host keys. The server could present a host certificate signed by a configured CA, yet strict host-key checking still treated it as unknown.

## The tempting fix changes the question

Disabling strict checking would make the connection succeed. It would also change the question from “is this server trusted?” to “can I connect to it?”

The bug was in representing an existing trust rule. The expected behavior was not to accept every unknown host.

## Keep the trust rule explicit

The patch keeps CA entries separately while normal host keys continue through the existing loading path. When the server key is missing from the ordinary host-key set, certificate acceptance depends on the trusted CA, target hostname pattern, certificate principal and validity window.

The important implementation choice is the boundary. Certificate-aware handling belongs where the connector evaluates host identity. It should not weaken ordinary key checks to compensate for a parsing limitation.

## Test rejection as deliberately as acceptance

A positive fixture can show that the reported case works. It cannot establish that the broader trust contract still holds.

For a change like this, the test questions include the accepted CA case and the reasons a certificate must not establish trust. Connector regressions, linting and type checks are part of the linked PR's validation record.

That evidence is narrower than a claim that every SSH certificate deployment is covered. It shows the concrete behavior reviewed and accepted upstream.

## What I took from the review

A compatibility patch near authentication is a security decision even when it adds support for something legitimate. Preserve the invariant first, then make the unsupported representation fit it.

The patch was merged in September 2026. Follow-up work on hostname matching for custom ports is a separate proposal; it should not be presented as already accepted work.
