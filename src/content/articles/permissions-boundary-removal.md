---
title: "Checking IAM permissions boundary removal in CloudTrail"
slug: "permissions-boundary-removal"
date: 2026-10-06
seriesMonth: "2026-06"
excerpt: "The event, the affected identity and the tests behind one rule in cloudtrail-quickscan."
tags: ["aws", "cloudtrail", "blue-team"]
category: "Cloud Security"
featured: true
status: "published"
readingTime: "2 min"
homepageOrder: 1
project: "cloudtrail-quickscan"
---

This is a follow-up to my June CloudTrail note, written in October. The boundary-removal rule was added later.

cloudtrail-quickscan reads a local JSON export and reports events worth checking. One of its rules handles removal of an IAM permissions boundary. That is useful to show separately from a general IAM change.

## What changes when the boundary is removed

A permissions boundary limits what an identity's policies can grant. It does not give permission by itself. If a role has a broad policy and a more limited boundary, removing the boundary can change what the role is allowed to do.

Other policies can still affect the result. Resource policies, session policies, organization controls and explicit denies make IAM evaluation more complicated than this short example. The [AWS explanation](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html) covers those cases.

The scanner therefore reports the operation for review. It does not claim the role now has administrator access.

## The event I check

The rule recognizes `DeleteUserPermissionsBoundary` and `DeleteRolePermissionsBoundary`. The request parameters identify the user or role affected by the operation. That may be different from the identity making the request.

Here is a small synthetic input, with example identifiers:

```json
{
  "eventSource": "iam.amazonaws.com",
  "eventName": "DeleteRolePermissionsBoundary",
  "requestParameters": {"roleName": "lab-role"},
  "userIdentity": {"arn": "arn:aws:iam::123456789012:user/lab-admin"}
}
```

A real export has more context to keep, such as the event time and account. A small fixture helps check the rule without copying private logs into the repository.

## What to check after the finding

The [tests](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/tests/test_rules.py) check the rule's output. The [implementation](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/src/cloudtrail_quickscan/rules.py) shows which fields it reads.

For an investigation, I would check the previous boundary, the policies still attached and whether the operation was an approved change. Error fields also matter: a denied request and a completed operation tell different stories.

The tool has no AWS connection, so it cannot fetch the previous policy for me. The [investigation notes](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/docs/investigation-notes.md) keep those follow-up questions next to the detection rules.
