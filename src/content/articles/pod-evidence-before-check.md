---
title: "Adding a hostPath check to Prowler"
slug: "pod-evidence-before-check"
date: 2026-10-06
seriesMonth: "2026-07"
excerpt: "The Kubernetes volume data, Pod-level result and tests needed for Prowler #11837."
tags: ["kubernetes", "open-source", "testing"]
category: "Kubernetes"
featured: true
status: "published"
readingTime: "2 min"
---

This note looks at [Prowler #11837](https://github.com/prowler-cloud/prowler/pull/11837), which was merged in July. I wrote the explanation in October.

The change adds a Kubernetes check for Pods using hostPath volumes. A hostPath volume lets a Pod mount a path from its node. The [Kubernetes documentation](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) explains why that needs care.

## The check first needs the data

Prowler collects Kubernetes resources into service models. The check runs against those models. Before checking hostPath, the model needs to keep the Pod's volume information.

If the collector leaves that information out, a check may look correct but have nothing useful to inspect. The patch therefore adds the collection part as well as the check.

## One result for each Pod

A Pod can contain several volumes. The check needs to look through them and fail if it finds a hostPath volume. A different volume earlier in the list should not hide it.

The result is one finding for the Pod. Several hostPath volumes in the same Pod do not need several identical resource rows. Keeping the Pod identity in the finding lets an operator locate the workload.

## Tests and limits

The contribution includes tests for the service data and the check. They answer different questions: did the volume information reach the model, and did the model produce the expected result? The recorded local validation passed ten focused tests.

A hostPath finding does not tell us that a node was compromised. Some workloads have a reason to use these mounts. The useful next step is to inspect the path, the workload's permissions and the cluster policy.

The [patch](/contributions/#prowler) links the collected fields to the final finding. That makes it easier to follow the change than looking only at the check function.
