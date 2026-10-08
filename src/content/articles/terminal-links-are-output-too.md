---
title: "Adding clickable PyPI Inspector links to GuardDog output"
slug: "terminal-links-are-output-too"
date: 2026-10-08
seriesMonth: "2026-07"
excerpt: "GuardDog #797 links each finding to the exact file and line on PyPI Inspector. The link is built from package data, so it is treated as untrusted output."
tags: ["python", "open-source", "security", "testing"]
category: "Open Source"
featured: false
status: "published"
---

This note covers [GuardDog #797](https://github.com/DataDog/guarddog/pull/797), merged in July 2026. I wrote it in October. GuardDog is Datadog's command-line scanner for malicious PyPI and npm packages.

## The triage problem

When GuardDog scans a remote PyPI package, it downloads the distribution, extracts it to a temporary directory, runs its rules and deletes the directory again. A finding then names a location such as `aws-dd-forwarder-1.0/lambda_function.py:31`.

That location is precise, but the file is gone. To look at the code, the reviewer has to download the package again, or find the same file by hand on [PyPI Inspector](https://inspector.pypi.io/), which renders the contents of published distributions. [Issue #67](https://github.com/DataDog/guarddog/issues/67) asked for a direct link.

## What the change adds

For remote PyPI scans with at least one finding, the result now records two values: the Inspector URL for the package version, and the path of the distribution file that was actually scanned. The reporter combines them with each finding's location:

```text
https://inspector.pypi.io/project/<name>/<version>/packages/…/<archive>/<file>#line.<n>
```

The package name and version are percent-encoded, and the in-archive path is encoded with `/` kept as a separator. If a location has no numeric line, no deep link is produced. A scan without findings gets no link at all, because there is nothing to open.

The distribution path matters. A release can contain several files, such as a wheel and a source archive. The scanner already chose the first supported archive to download, so the same selection function now provides the path for the link. The link points at the file that produced the finding, not at a different build of the same version.

## The link is untrusted output

In the terminal, the location becomes clickable through an [OSC 8 hyperlink](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feaa): an escape sequence that wraps a label with a URL. Terminals that do not support it ignore the wrapper and print the label.

Part of every URL comes from the scanned package: its name, version and file paths. That is data a malicious package author controls. If a file name contained terminal control bytes, it could end the escape sequence early and write its own sequences into the reviewer's terminal.

GuardDog's reporter already sanitizes file names before printing them. The new `_hyperlink` helper applies the same control-character check to the URL. If the URL contains a control byte, it returns the plain label and drops the link.

```python
if _TERMINAL_CONTROL_RE.search(url):
    return label
return f"\x1b]8;;{url}\x1b\\{label}\x1b]8;;\x1b\\"
```

A scanner for malicious packages is a place where its own output deserves the same suspicion as its input.

## Tests

The scanner tests cover distribution selection, the default to the latest version, unknown versions, archives that are not supported, URL escaping, and the rule that results without findings get no Inspector link. The reporter tests check the summary link, the per-finding deep link, the case without a distribution path, path encoding, the OSC 8 wrapper and the fallback when a URL is unsafe.

## Limits

The link depends on PyPI Inspector being available and on the distribution still being published. A release that is deleted from PyPI breaks it. The local scan result remains the evidence; the link is only a faster way to read the code it points to.
