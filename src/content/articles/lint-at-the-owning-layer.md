---
title: "Fix the validator at the layer that owns the rule"
slug: "lint-at-the-owning-layer"
date: 2026-10-03
excerpt: "A cfn-lint fix for lifecycle policies shows why changing a shared intrinsic-function resolver can be the wrong scope."
tags: ["aws", "cloudformation", "open-source", "validation"]
category: "Cloud engineering"
featured: true
status: "published"
readingTime: "4 min"
---

A validation error often appears to be a problem with a function. Sometimes the function is fine and the surrounding attribute has a more specific contract.

In [cfn-lint PR #4704](https://github.com/aws-cloudformation/cfn-lint/pull/4704), a bare `Fn::Select` used as the entire value of `CreationPolicy` or `UpdatePolicy` passed linting. CloudFormation rejected that shape unless `AWS::LanguageExtensions` resolved it before deployment.

## Describe the failing shape precisely

The problem was not that every use of `Fn::Select` should be rejected. It was the combination of a particular intrinsic function, a lifecycle-policy attribute and the absence of a transform that made the shape deployable.

A reproduction that preserves those conditions tells the implementation where to look. A vague statement such as “Select returns the wrong type” would point toward a much broader change.

## Keep the shared resolver's contract

The accepted patch validates the lifecycle-policy attributes. It keeps the global handling of `Fn::Select` unchanged and lets ordinary policy objects and `Fn::If` continue through the existing validators.

That scope makes the change easier to reason about. The resource attribute owns the restriction; the intrinsic function should retain its behavior in contexts where it remains valid.

## Check both sides of the exception

The relevant cases include the invalid bare function, the transform-supported form, and neighboring valid policy shapes. Regression coverage must show the reported error without turning an exception into a universal restriction.

The linked PR records policy and intrinsic-function tests. Its local CLI check also reported an unrelated schema-cache issue, which was documented separately rather than described as a clean end-to-end validation run.

## The transferable lesson

When working in a mature validator, locate the owner of the contract before adding a guard. A small diff at the right layer is often safer than an apparently elegant global change.

This fix was merged in September 2026. The useful portfolio evidence is the accepted patch and its constraints, not a claim that I built or own the validator.
