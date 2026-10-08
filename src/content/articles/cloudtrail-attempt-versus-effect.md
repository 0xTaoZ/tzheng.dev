---
title: "Reading the error fields in a CloudTrail finding"
slug: "cloudtrail-attempt-versus-effect"
date: 2026-10-06
seriesMonth: "2026-08"
excerpt: "An API name does not show the whole result. A note on failed requests, target identities and follow-up checks."
tags: ["aws", "cloudtrail", "investigation"]
category: "Cloud Security"
featured: false
status: "published"
readingTime: "2 min"
project: "cloudtrail-quickscan"
---

This October note follows the CloudTrail reading series. It is about interpreting the output of my scanner, rather than adding another rule.

An event named `StopLogging` is worth checking. The name alone does not tell me whether the request succeeded. The request may have been denied.

## Read more than the event name

CloudTrail records fields such as `eventName`, `userIdentity`, `requestParameters` and error information when it applies. The [event reference](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-record-contents.html) describes these fields.

For a logging operation, I need the trail involved, who made the request and whether it completed. For an IAM change, the identity making the request and the user or role being changed may be different.

A summary is easier to read than a full export, but the original event still matters. It can contain details that the finding does not show.

## What the scanner can tell me

[cloudtrail-quickscan](https://github.com/0xTaoZ/cloudtrail-quickscan) reports rule matches with severity and event context. It reads files locally. It does not fetch a resource's previous state or compare the action with a change ticket.

I use severity to indicate which operations deserve attention. A high label is not enough to conclude that an account was compromised. A failed request can also deserve attention, even though it did not make the requested change.

When reviewing a rule, I need to check how it handles `errorCode`. Two similar synthetic inputs, one with an error and one without it, can make that behavior easier to inspect. The current [tests](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/tests/test_rules.py) show the cases actually covered; this note does not add new coverage.

The [investigation notes](https://github.com/0xTaoZ/cloudtrail-quickscan/blob/main/docs/investigation-notes.md) suggest looking at nearby events and the actor's expected activity. A finding gives me a place to start. The remaining evidence comes from the investigation.
