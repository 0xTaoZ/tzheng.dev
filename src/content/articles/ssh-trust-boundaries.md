---
title: "Supporting SSH host certificates in pyinfra"
slug: "ssh-trust-boundaries"
date: 2026-10-03
seriesMonth: "2026-09"
excerpt: "How I handled CA entries in known_hosts while keeping strict host checking enabled."
tags: ["ssh", "infrastructure", "open-source", "security"]
category: "Infrastructure"
featured: true
status: "published"
readingTime: "2 min"
updated: 2026-10-06
---

In [pyinfra #1945](https://github.com/pyinfra-dev/pyinfra/pull/1945), I worked on support for OpenSSH host certificates. A server certificate signed by a configured CA could be rejected as an unknown host under strict checking.

The connector used Paramiko to load ordinary host keys. Entries marked `@cert-authority` in `known_hosts` needed different handling.

## Keep the CA entries

The patch keeps those entries separately. Ordinary host keys still use the existing loading path, including its handling of malformed entries.

Accepting a certificate requires several checks. The signing CA must be trusted for the host pattern, the hostname must match a certificate principal and the certificate must be within its validity period.

Reading the CA entry is therefore only part of the change. The connector also has to check the certificate when an ordinary host-key lookup cannot establish trust. Strict checking stays enabled.

## What was checked

The PR records connector regression tests, Ruff and mypy checks. It was merged in September 2026. The review and tests are linked in the PR so the accepted behavior can be inspected.

Custom-port hostname matching is a separate follow-up. I keep that out of the description of the merged fix. The [contribution page](/contributions/#pyinfra) links the accepted work.
