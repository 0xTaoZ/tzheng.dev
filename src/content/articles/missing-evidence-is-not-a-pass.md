---
title: "When a failed API call turned into a PASS in Prowler"
slug: "missing-evidence-is-not-a-pass"
date: 2026-10-08
seriesMonth: "2026-08"
excerpt: "Prowler #12217: an ECS task definition that could not be described looked the same as one with nothing wrong in it."
tags: ["aws", "open-source", "testing", "evidence"]
category: "Cloud Security"
featured: false
status: "published"
---

This note explains [Prowler #12217](https://github.com/prowler-cloud/prowler/pull/12217), which was merged in August 2026. I wrote it in October. The fix is small, but the failure it removes is a common one in security tooling: missing evidence that is reported as good evidence.

## The symptom

Prowler collects AWS resources into service models first. Checks then read those models. For Amazon ECS, the service lists task definitions and calls `DescribeTaskDefinition` for each one to read its container definitions, PID mode and network mode.

The task-definition model started with an empty list:

```python
container_definitions: list[ContainerDefinition] = []
```

If the describe call failed, for example because of a permissions problem or a throttled request, the model kept that empty list. A check such as "no privileged containers" then looped over zero containers, found nothing privileged and reported PASS. Other checks could fail later on fields that had never been filled in.

The [issue discussion](https://github.com/prowler-cloud/prowler/issues/12132) agreed on the expected behavior: a task definition that could not be described should be skipped, not reported as verified.

## Two kinds of empty

The fix separates "not collected" from "collected and empty". The model now uses `None` until a successful response arrives:

```python
container_definitions: Optional[list[ContainerDefinition]] = None
```

The service builds the container list and the other describe-derived fields in local variables and only assigns them to the model after the response has been read completely. A failure halfway through therefore cannot leave a half-filled task definition that looks like real data.

Each of the seven task-definition checks that reads those fields now skips the undescribed case:

```python
if task_definition.container_definitions is None:
    continue
```

A task definition that really has no containers keeps an empty list and is still evaluated normally.

## Why the sentinel lives in the model

I could have caught the exception inside each check. That would have repeated the same decision seven times, and the next check added to the service would need to remember it. The service is the only place that knows whether the API call succeeded, so the model carries that fact and the checks only read it.

This is the same idea as my [hostPath note](/articles/pod-evidence-before-check/): a check can only be as good as the data the collector keeps.

## Tests

The regression test mocks the AWS API so that `DescribeTaskDefinition` raises an error, then runs every task-definition check against the collected model. None of them may report a finding for that resource. Two further cases pin the boundary: a successful response with an empty container list keeps `[]`, and a response that fails halfway through parsing leaves every describe-derived field unset. The PR also adds a changelog fragment.

## Limits

Skipping is not the same as reporting a problem. An operator who expects seven results per task definition and receives none still has to notice that the collection step failed; the service logs the describe error, and that log is the place to look. The fix only guarantees that a missing response is no longer presented as a passing control.
