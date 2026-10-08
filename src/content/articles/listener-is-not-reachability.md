---
title: "What a listening address tells me about exposure"
slug: "listener-is-not-reachability"
date: 2026-10-06
seriesMonth: "2026-04"
excerpt: "Local bind scope is one part of the check. Firewall rules, routes and proxies still matter."
tags: ["linux", "networking", "C"]
category: "Networking"
featured: false
status: "published"
readingTime: "2 min"
project: "socket-state-triage"
---

This is an October follow-up to the April networking note. socket-state-triage is a current code example.

A service listening on `127.0.0.1:8080` has a different bind address from one listening on `0.0.0.0:8080`. The second deserves a wider exposure check. A socket listing still only shows part of the network path.

## Reading the local state

On Linux I can start with:

```sh
ss -lnt
```

The [ss manual](https://man7.org/linux/man-pages/man8/ss.8.html) explains these options: listening sockets, numeric addresses and TCP. The output is a snapshot. Process information can require more permissions.

I need to keep the local address and port, protocol and network namespace in mind. A listing from the host does not automatically describe every container namespace.

## The address format matters to the parser

My [C tool](/projects/socket-state-triage/) accepts saved socket listings. It recognizes broad IPv4, broad IPv6 and wildcard forms. An entry such as `*:22` should not disappear from the broad-bind summary because it is written differently from `0.0.0.0:22`.

The [wildcard parser note](/articles/socket-wildcard-parser/) shows the code and the two-row fixture used for that change. This is a small parsing problem, but a missed format can make the final report misleading.

## Check the rest of the path

A host firewall can block a broad listener. A reverse proxy can expose a service that only listens on loopback. Routing, forwarding and container networking can also change what clients reach.

So I treat a broad bind as a reason to inspect the service. I still need to find the intended clients and the controls between them and the listener. A connection test from one client only checks that client's path at that time.

The tool prints review lines for these cases. It does not call each one a vulnerability. That leaves room for an operator to decide whether the bind is expected in that system.
