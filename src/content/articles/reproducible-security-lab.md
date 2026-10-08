---
title: "Making a small security lab repeatable"
slug: "reproducible-security-lab"
date: 2026-10-06
seriesMonth: "2026-01"
excerpt: "A small input and a clear question make it easier to check what a rule actually does."
tags: ["learning", "testing", "blue-team"]
category: "Learning"
featured: false
status: "published"
readingTime: "2 min"
---

This is an October companion to the January study note. The project examples describe the code available now.

A topic such as cloud security is too large for one lab. A smaller question is easier to check: does this rule report a successful console login without MFA?

## Keep the input small

A synthetic event lets me control the fields. I can change the MFA value while keeping the event name and identity the same. If I change several fields together, it becomes harder to explain why the result changed.

The [CloudTrail tests](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/tests/test_rules.py) pass event dictionaries into rule functions and check the returned findings. The inputs are short enough to read next to the assertions.

Neighboring cases are useful too. A failed login and a successful login need different interpretation. A missing field should not make the parser fail unexpectedly. The repository tests show the covered cases; additional combinations would need additional tests.

## Keep the checks separate

A unit test checks the rule with controlled data. A CLI run checks the parser, rules and report together. An investigation needs more information about the activity in the account.

I should record the command, fixture and source revision with the result. That gives me something to run again after a later change. Public fixtures should use example identities instead of copying private account data.

A useful note can include the question, expected output, observed output and one thing still unknown. It does not need to make the exercise sound bigger than it is.

The [scanner case study](/projects/cloudtrail-quickscan/) links the current code and test command. The next task can then be specific, such as adding a missing-field case, rather than trying to cover all cloud security at once.
