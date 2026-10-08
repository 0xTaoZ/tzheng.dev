---
title: "My first pass at reading CloudTrail logs"
slug: "cloudtrail-first-pass"
date: 2026-06-18
excerpt: "I started with fake logs because small data helps me understand the shape before I try bigger tools."
tags: ["cloud", "blue-team", "python"]
category: "Cloud Security"
featured: true
status: "published"
readingTime: "2 min"
updated: 2026-10-06
project: "cloudtrail-quickscan"
---

CloudTrail looked hard at first because every event has many fields. I decided to not start with a big platform. I made a small file and asked simple questions: who did it, where did it happen, and is it strange for this account?

The checks are simple: failed console login, root activity, IAM changes, security group changes, and uncommon regions. It is not perfect detection. It is a first review layer.

I learned that security tooling is not only about smart rules. The output must be readable. If a finding is high risk, I want to see the reason fast, not search inside a huge JSON file.

Next I want every rule to have a small investigation note. What happened? Why it matters? What should I check next?

## Update: following a finding

**6 October 2026.** The current scanner includes tests and [investigation notes](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/docs/investigation-notes.md).

For a logging change, those notes suggest checking whether it was planned and looking at the actor's nearby activity. IAM changes also need the affected user or role and the policies around it.

The [boundary-removal article](/articles/permissions-boundary-removal/) follows one later rule in more detail. The [error-fields note](/articles/cloudtrail-attempt-versus-effect/) explains why a request name alone does not show that the action succeeded.

The tool still reads a local file without cloud credentials. It does not fetch account history or decide whether a change was authorized. The finding is a starting point for those checks.
