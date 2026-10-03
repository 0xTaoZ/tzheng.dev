---
title: "CloudFormation validation"
slug: "cfn-lint-contribution"
date: "2026-10-03"
status: "open-source"
type: "Upstream engineering"
featured: false
priority: 6
stack: ["Python", "CloudFormation", "Regression tests"]
github: "https://github.com/aws-cloudformation/cfn-lint/pull/4704"
excerpt: "Accepted cfn-lint work on intrinsic functions, SAM outputs, lifecycle policies and schema-aware validation."
outcome: "Eight merged pull requests in cfn-lint as of 3 October 2026."
---

## From a single fix to a technical area

The original entry on this site highlighted an Elasticsearch enum patch. The more useful current story is a sequence of accepted contributions around CloudFormation validation.

[The contribution record](/contributions/#record) links every merged PR in the site's dated snapshot. Closed proposals are not counted as accepted work.

## A representative case: lifecycle policies

A bare `Fn::Select` used as the entire `CreationPolicy` or `UpdatePolicy` passed linting, but CloudFormation rejected it unless the language-extension transform resolved it first.

[PR #4704](https://github.com/aws-cloudformation/cfn-lint/pull/4704) validates those attributes at the owning layer. It preserves global `Fn::Select` behavior and continues routing ordinary policy objects and `Fn::If` through the existing validators.

The fix includes policy regression cases and checks around intrinsic-function behavior. It was merged in September 2026.

## Other accepted work

- [SAM application GetAtt outputs](https://github.com/aws-cloudformation/cfn-lint/pull/4665)
- [Negative Fn::Select indexes](https://github.com/aws-cloudformation/cfn-lint/pull/4622)
- [FindInMap DefaultValue without a transform](https://github.com/aws-cloudformation/cfn-lint/pull/4628)
- [Single-property schema maxProperties warnings](https://github.com/aws-cloudformation/cfn-lint/pull/4686)

## What I learned

A validator is not just a list of rules. It is a composition of transforms, schema context and intrinsic-function resolution. A symptom can appear in one rule while the correct fix belongs in another layer.

## Scope of the claim

I contribute focused fixes and regression tests. I do not maintain cfn-lint or imply ownership of the project. A PR under review is a proposal until the upstream maintainers accept it.
