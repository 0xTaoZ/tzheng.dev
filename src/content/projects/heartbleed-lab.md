---
title: "Heartbleed lab"
slug: "heartbleed-lab"
date: "2026-11-03"
status: "active"
type: "Vulnerability reproduction"
featured: false
priority: 6
homepageOrder: 5
homepageFacts:
  - label: "Setup"
    text: "OpenSSL 1.0.1f target and 1.0.1g control, both built from source."
  - label: "Isolation"
    text: "Three containers on an internal Docker network with no route out."
  - label: "Course"
    text: "Group project for an application security course at H-BRS."
stack: ["Docker", "OpenSSL", "Python", "GitHub Actions"]
github: "https://github.com/0xTaoZ/Heartbleed-CSP-project"
excerpt: "A repeatable lab that reproduces CVE-2014-0160 against a vulnerable and a patched OpenSSL side by side, for a course project at H-BRS."
outcome: "Key decision: the patched server runs next to the vulnerable one as a control, so a leak can be attributed to the bug and nothing else."
---

## The problem

Heartbleed is easy to read about and harder to observe. Reproducing it needs an exact OpenSSL build, a server that holds something worth leaking, and a network that cannot reach anything outside the lab. This repository is the group project for the course *CSP: Solving Current Challenges in Application Security* at Hochschule Bonn-Rhein-Sieg.

## How it works

`docker compose` builds three containers on one internal network. `vulnerable` runs OpenSSL 1.0.1f, `patched` runs 1.0.1g, and `attacker` is a Python client that receives none of the secrets. The servers load fake credentials from a file that is not in Git, so anything the client recovers came through the bug.

```sh
docker compose build
docker compose up -d
```

## What I worked on

I set up the three-container lab and its compose file, added the pull request template and the CI job that builds the containers on every change, and fixed the attacker client's ClientHello. The team works on the attacker client through reviewed pull requests.

## Boundaries

The project is in progress. The research question also covers detecting this class of bug with AddressSanitizer and fuzzing, and that part is not in the repository yet. The network is internal on purpose: the client is for this lab's own containers.
