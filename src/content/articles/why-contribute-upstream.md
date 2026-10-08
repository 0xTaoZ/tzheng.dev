---
title: "Why I contribute to open source"
slug: "why-contribute-upstream"
date: 2026-10-06
seriesMonth: "2026-10"
excerpt: "A few fixes I sent to cfn-lint, pyinfra and Prowler, and why I return them to the projects."
tags: ["open-source", "testing", "security"]
category: "Open Source"
featured: true
status: "published"
readingTime: "2 min"
homepageOrder: 3
---

I work on my own small security tools and also send changes to open-source projects. They give me different kinds of practice. In my own project I can choose the design. In an existing project I need to understand the code and keep other users' behavior working.

Returning a fix to the project also means other people can use it. They do not have to keep the same workaround in their own copy.

## What I contribute

My accepted work includes cloud template validation, SSH host certificates and Kubernetes checks. These changes have specific problems behind them.

For [cfn-lint #4704](https://github.com/aws-cloudformation/cfn-lint/pull/4704), a whole lifecycle policy could use a `Fn::Select` value that passed linting but failed at deployment without the required transform. I added validation where the policy is checked. The shared function resolver keeps its existing behavior.

cfn-lint checks templates for Amazon Web Services (AWS) CloudFormation. My contribution is to that open-source validator. The [article about the fix](/articles/lint-at-the-owning-layer/) explains the affected policy forms.

In [pyinfra #1945](https://github.com/pyinfra-dev/pyinfra/pull/1945), the SSH connector needed to handle certificate-authority entries in `known_hosts`. A trusted server certificate could otherwise be treated as an unknown host. The fix keeps CA entries separately and checks the hostname, principal and validity period. Strict checking stays enabled.

[Prowler #11837](https://github.com/prowler-cloud/prowler/pull/11837) adds a check for Pods using hostPath volumes. It needed both the volume data in the Kubernetes model and tests for the check. An operator can then see which Pod needs review.

## Why small fixes matter

A small change is easier to explain when its scope matches the problem. It can still touch an important part of the tool. For example, an SSH fix needs to accept the trusted certificate and still reject a certificate that fails the checks.

Tests help describe that behavior. The review also gives maintainers a chance to check assumptions about the rest of the project. I include the patch and review links so someone reading this site can look at the actual work.

The [contribution page](/contributions/) lists merged PRs separately from work still under review. A merge means the project accepted a change. Whether a user has received it depends on the release they run.
