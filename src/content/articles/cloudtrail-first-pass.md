---
title: "My first pass at reading CloudTrail logs"
slug: "cloudtrail-first-pass"
date: 2026-06-18
updated: 2026-06-18
excerpt: "I started with fake logs because small data helps me understand the shape before I try bigger tools."
tags: ["cloud", "blue-team", "python"]
category: "Cloud Security"
featured: true
status: "published"
readingTime: "3 min"
---

CloudTrail looked hard at first because every event has many fields. I decided to not start with a big platform. I made a small file and asked simple questions: who did it, where did it happen, and is it strange for this account?

The checks are simple: failed console login, root activity, IAM changes, security group changes, and uncommon regions. It is not perfect detection. It is a first review layer.

I learned that security tooling is not only about smart rules. The output must be readable. If a finding is high risk, I want to see the reason fast, not search inside a huge JSON file.

Next I want every rule to have a small investigation note. What happened? Why it matters? What should I check next?
