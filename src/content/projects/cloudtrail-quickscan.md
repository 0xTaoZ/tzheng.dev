---
title: "cloudtrail-quickscan"
slug: "cloudtrail-quickscan"
date: "2026-10-03"
status: "security"
type: "Cloud investigation"
featured: true
priority: 2
stack: ["Python", "AWS CloudTrail", "CLI", "Unit tests"]
github: "https://github.com/0xTaoZ/cloudtrail-quickscan"
excerpt: "An explainable first pass over AWS audit logs: IAM changes, logging disruption, public exposure and unusual activity."
outcome: "Local input, readable findings and JSON output; no cloud credentials required."
---

## The problem

Before a full investigation, a reviewer needs to know which events deserve attention and why. A small scanner makes that first pass inspectable without introducing a service, a database or a live AWS connection.

## How it works

The CLI reads CloudTrail JSON, applies explicit rule functions, and produces findings with severity and event context. Text output is for a person; JSON output is for a script. Summary controls limit the busiest users or source addresses without removing the underlying findings.

```sh
PYTHONPATH=src python3 -m cloudtrail_quickscan samples/cloudtrail_sample.json
PYTHONPATH=src python3 -m cloudtrail_quickscan samples/cloudtrail_sample.json --json
```

## Security questions covered

The current checks cover failed logins, root activity, MFA removal, administrator policy attachments, IAM permissions-boundary removal, logging changes, S3 exposure changes, denied API calls, and public SSH/RDP ingress.

A boundary-removal event is worth attention because it changes the ceiling on an identity's effective permissions. That is a different question from whether an access key was created or a policy was attached.

## Verification and investigation

Rules have synthetic events and unit tests. The repository includes [investigation notes](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/docs/investigation-notes.md), so a finding leads to a review question rather than just an alarming label.

```sh
PYTHONPATH=src python3 -m unittest discover -s tests
```

## Boundaries

A flagged event is a reason to investigate, not proof of compromise. Rules are heuristic; expected administrative work can trigger them. The tool does not correlate sessions, establish attribution or replace a SIEM.

## Engineering choice

Keep the detection logic small enough that someone can read the rule, examine the sample and disagree with its severity. Explainability matters more here than a long list of opaque detections.
