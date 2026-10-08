---
title: "Checking where VPN traffic is routed"
slug: "vpn-route-before-encryption"
date: 2026-10-06
seriesMonth: "2026-02"
excerpt: "A connected status is only a starting point. Check the destination route and DNS result separately."
tags: ["linux", "networking", "testing"]
category: "Infrastructure"
featured: false
status: "published"
readingTime: "2 min"
---

This is an October follow-up to the February Linux note. It gives a small diagnostic sequence for a Linux lab.

A VPN can show a connected status while an application uses a different route. Before changing settings, I need to name the destination that is supposed to go through the tunnel.

For a full tunnel and a split tunnel, that expectation is different.

## Look up a destination

```sh
ip addr
ip route
ip route get 192.0.2.10
```

The address is an example. In a lab, replace it with the destination being checked. According to the [ip-route manual](https://man7.org/linux/man-pages/man8/ip-route.8.html), `get` resolves a route. It answers a more specific question than listing the table.

That result applies to the lookup conditions. A different source, policy rule or network namespace may use another route. If the application can use IPv6, an IPv4 lookup alone may miss the path it selects.

## Follow the hostname too

DNS resolution and routing are separate steps. I need to know which resolver answered, which addresses it returned and which address the application selected. Then I can check the route to that address.

A hostname with both IPv4 and IPv6 answers is a useful example. Testing only its IPv4 address may not test the connection the application actually makes.

## Keep the observation clear

A working connection shows that a request completed. It does not show that all traffic uses the VPN. A failed connection might involve the remote service or firewall as well as the tunnel.

The original [Linux note](/articles/vpn-linux-notes/) mentions logs and service status. I would collect those observations before changing several settings together. Otherwise, a later success would leave me unsure which change fixed it.

A report that names the destination, selected interface and result is easier to revisit than only writing that the VPN worked.
