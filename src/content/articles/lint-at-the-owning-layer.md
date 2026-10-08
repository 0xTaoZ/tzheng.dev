---
title: "Where I added the lifecycle policy check in cfn-lint"
slug: "lint-at-the-owning-layer"
date: 2026-10-03
seriesMonth: "2026-09"
excerpt: "A Fn::Select case needed a policy-level check while the shared resolver stayed unchanged."
tags: ["aws", "cloudformation", "open-source", "validation"]
category: "Cloud Security"
featured: true
status: "published"
readingTime: "2 min"
updated: 2026-10-06
project: "cfn-lint-contribution"
---

[cfn-lint #4704](https://github.com/aws-cloudformation/cfn-lint/pull/4704) fixes a case where a whole `CreationPolicy` or `UpdatePolicy` uses a bare `Fn::Select`. It passed linting but failed CloudFormation deployment without `AWS::LanguageExtensions`.

`Fn::Select` is still valid in other parts of a template. The restriction belongs to the policy attribute, so that is where I added the check.

## Keep nearby cases working

| Policy input | Expected behavior |
| --- | --- |
| Whole-policy `Fn::Select` without the transform | Report the unsupported value |
| Value supported by the transform | Keep the transform-aware path |
| Ordinary policy object or `Fn::If` | Use the existing validation |

Changing the shared function resolver would affect more of the template. Keeping the fix at the policy layer makes its scope easier to test.

The regression coverage includes policy and intrinsic-function cases. That helps check the new restriction and the nearby behavior that should stay the same.

## The local reproduction

The CLI reproduction emitted the new `E3055` error. It also had an unrelated `E3006` error during a schema-cache refresh because SSL verification failed. I keep that detail in the note so the run is not mistaken for a completely clean end-to-end check.

The fix was merged in September 2026. The [case study](/projects/cfn-lint-contribution/) links this patch and the other CloudFormation contributions.
