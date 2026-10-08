---
title: "Teaching Trivy where a Jenkins plugin declares its license"
slug: "jar-license-sources"
date: 2026-10-08
seriesMonth: "2026-07"
excerpt: "Trivy #10939 adds the Plugin-License-Name manifest attribute as a JAR license source, between the embedded pom.xml and packed LICENSE files."
tags: ["open-source", "testing", "validation"]
category: "Open Source"
featured: false
status: "published"
---

This note is about [Trivy #10939](https://github.com/aquasecurity/trivy/pull/10939), merged in July 2026. I wrote it in October. Trivy is Aqua Security's scanner for vulnerabilities, misconfigurations, secrets and licenses; the change is in the Java JAR parser.

## Why license detection needs an order

A software bill of materials is only useful for license review if each package carries the right license. A JAR can describe its license in more than one place, and those places are not equally reliable.

Before the change, Trivy used two sources in this order:

1. the `<licenses>` block of the embedded `META-INF/maven/<groupId>/<artifactId>/pom.xml`, matched to the package by its coordinates;
2. a packed `LICENSE`, `LICENCE` or `COPYRIGHT` file, classified by Trivy's license classifier and attached only when the JAR contains a single artifact.

The second source is a heuristic. A text file has no package coordinates, and classification works on its content. In a shaded JAR that bundles several artifacts, the owner of the file is ambiguous, so Trivy skips it.

## The missing source

[Issue #10936](https://github.com/aquasecurity/trivy/issues/10936) pointed out that Jenkins plugins have a better source. Plugins are distributed as HPI or JPI archives, which are JAR containers, and the build plugin writes the license from the plugin's pom into `META-INF/MANIFEST.MF`:

```text
Plugin-License-Name: Apache License, Version 2.0
Plugin-License-Name-2: MIT License
```

A plugin with several licenses gets numbered attributes. The value is generated, machine-readable and belongs to the plugin itself.

## Where the new source goes

The manifest attribute is more specific than a packed license file, but less direct than the pom that produced it. So it goes in the middle:

1. embedded `pom.xml`;
2. `Plugin-License-Name` attributes in `MANIFEST.MF`;
3. packed license files.

The parser already read `MANIFEST.MF` for package names and versions. The patch collects lines starting with `Plugin-License-Name` while reading the manifest, and a small function accepts only the exact attribute or a `Plugin-License-Name-N` variant:

```go
key, value, ok := strings.Cut(line, ":")
if !ok {
    return ""
}
if key != "Plugin-License-Name" {
    if _, ok = strings.CutPrefix(key, "Plugin-License-Name-"); !ok {
        return ""
    }
}
return strings.TrimSpace(value)
```

The manifest reader only collects candidate lines by prefix. Splitting the key afterwards means an attribute that merely starts with the same text is not read as a license.

## One rule for "who owns this license"

Both fallbacks need the same answer: the single package that belongs to this JAR and has no license yet. The license-file code contained that logic inline. I moved it into an `ownJarPackage` helper and used it for both sources. If more than one package belongs to the JAR, or the owner already has a pom license, the helper returns nothing and neither fallback attaches a license.

That keeps the precedence in one place. A manifest license cannot overwrite a pom license, and a license file cannot overwrite a manifest license.

## Tests and documentation

A new test JAR contains a manifest with two license attributes and no pom licenses; the parser must report both names on the plugin's package. A table test covers the attribute parser: the plain and suffixed forms, surrounding whitespace, an empty value, and the neighbouring `Plugin-License-Url` attribute, which must be ignored. The Java coverage page in Trivy's documentation now lists three license sources in their order.

## Limits

The attribute is a declared license name, not a verified one. Trivy reports what the plugin says about itself. A plugin built without this attribute still falls through to the packed license file, with the existing ambiguity rules.
