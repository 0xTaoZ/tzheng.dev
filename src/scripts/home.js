document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector("[data-email-contact]")
    ?.addEventListener("click", (event) =>
      handleEmailClick(event.currentTarget, event),
    );
  const legacyNotes = {
    "#note-cloudtrail": "cloudtrail-first-pass",
    "#note-open-source": "small-pr-good",
    "#note-ioc": "ioc-tool",
  };
  const redirectLegacyNote = () => {
    const slug = legacyNotes[location.hash];
    if (!slug) return false;
    location.replace(`/articles/${slug}/`);
    return true;
  };
  window.addEventListener("hashchange", redirectLegacyNote);
  if (redirectLegacyNote()) return;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const root = document.documentElement;
  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    sx: window.innerWidth / 2,
    sy: window.innerHeight / 2,
  };

  if (!reducedMotion && finePointer) {
    const cursorField = document.getElementById("cursor-field");
    const cursorDot = document.getElementById("cursor-dot");
    const hero = document.querySelector(".hero-bg");
    const mission = document.querySelector(".mission-layout");
    let cursorFrame = null;
    const renderPointer = () => {
      cursorFrame = null;
      pointer.sx += (pointer.x - pointer.sx) * 0.16;
      pointer.sy += (pointer.y - pointer.sy) * 0.16;
      const x = `${pointer.sx}px`;
      const y = `${pointer.sy}px`;
      cursorField?.style.setProperty(
        "transform",
        `translate3d(${x}, ${y}, 0) translate(-50%, -50%)`,
      );
      cursorDot?.style.setProperty(
        "transform",
        `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`,
      );
      root.style.setProperty("--pointer-x", x);
      root.style.setProperty("--pointer-y", y);
      if (hero && mission) {
        const rect = hero.getBoundingClientRect();
        const hx = ((pointer.x - rect.left) / rect.width) * 100;
        const hy = ((pointer.y - rect.top) / rect.height) * 100;
        hero.style.setProperty(
          "--hero-x",
          `${Math.max(0, Math.min(100, hx))}%`,
        );
        hero.style.setProperty(
          "--hero-y",
          `${Math.max(0, Math.min(100, hy))}%`,
        );
        mission.style.setProperty(
          "--hero-pan-x",
          (pointer.x / window.innerWidth - 0.5) * -8,
        );
        mission.style.setProperty(
          "--hero-pan-y",
          (pointer.y / window.innerHeight - 0.5) * -5,
        );
      }
      if (
        Math.abs(pointer.x - pointer.sx) > 0.1 ||
        Math.abs(pointer.y - pointer.sy) > 0.1
      ) {
        cursorFrame = requestAnimationFrame(renderPointer);
      }
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        document.body.classList.add("pointer-ready");
        if (cursorFrame === null)
          cursorFrame = requestAnimationFrame(renderPointer);
      },
      { passive: true },
    );
    window.addEventListener(
      "pointerleave",
      () => document.body.classList.remove("pointer-ready"),
      { passive: true },
    );
  }

  const progress = document.getElementById("scroll-progress");
  let progressFrame = null;
  const updateProgress = () => {
    if (!progress) return;
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const value = Math.min(1, Math.max(0, window.scrollY / max));
    progress.style.transform = `scaleX(${value})`;
    root.style.setProperty("--scroll-progress", value.toFixed(4));
  };
  const scheduleProgress = () => {
    if (progressFrame !== null) return;
    progressFrame = requestAnimationFrame(() => {
      progressFrame = null;
      updateProgress();
    });
  };
  updateProgress();
  window.addEventListener("scroll", scheduleProgress, { passive: true });

  const canvas = document.getElementById("ambient-grid");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    let width = 0,
      height = 0,
      particles = [],
      raf = null,
      resizeFrame = null;
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.25 : 2);
      width = canvas.width = Math.floor(window.innerWidth * dpr);
      height = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const count = isMobile()
        ? Math.min(34, Math.floor(window.innerWidth / 12))
        : Math.min(80, Math.floor(window.innerWidth / 18));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16 * dpr,
        vy: (Math.random() - 0.5) * 0.16 * dpr,
        r: (Math.random() * 0.8 + 0.55) * dpr,
      }));
    };
    const draw = () => {
      if (document.hidden) {
        raf = null;
        return;
      }
      ctx.clearRect(0, 0, width, height);
      const scale = width / Math.max(1, window.innerWidth);
      const px = pointer.sx * scale;
      const py = pointer.sy * scale;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 260 * scale);
      glow.addColorStop(0, "rgba(125, 211, 252, 0.105)");
      glow.addColorStop(0.42, "rgba(57, 255, 136, 0.045)");
      glow.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(125, 211, 252, 0.38)";
      ctx.strokeStyle = "rgba(125, 211, 252, 0.10)";
      const linkDistance =
        (isMobile() ? 92 : 150) * Math.min(window.devicePixelRatio || 1, 2);
      particles.forEach((p, index) => {
        const mdx = px - p.x;
        const mdy = py - p.y;
        const md = Math.hypot(mdx, mdy);
        if (finePointer && md < 220 * scale) {
          const force = (1 - md / (220 * scale)) * 0.018;
          p.vx += (mdx * force) / Math.max(md, 1);
          p.vy += (mdy * force) / Math.max(md, 1);
        }
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        for (let i = index + 1; i < particles.length; i++) {
          const q = particles[i],
            dx = p.x - q.x,
            dy = p.y - q.y,
            distance = Math.hypot(dx, dy);
          if (distance < linkDistance) {
            ctx.globalAlpha = 1 - distance / linkDistance;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    const restartCanvas = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      resizeCanvas();
      draw();
    };
    restartCanvas();
    window.addEventListener(
      "resize",
      () => {
        if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          resizeFrame = null;
          restartCanvas();
        });
      },
      { passive: true },
    );
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!document.hidden && raf === null) {
        restartCanvas();
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -40px 0px", threshold: 0.1 },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const terminal = document.getElementById("terminal-output");
  if (terminal) {
    const lines = JSON.parse(terminal.dataset.lines || "[]");
    const text = lines.join("\n");
    if (reducedMotion) terminal.textContent = text;
    else {
      let i = 0;
      const type = () => {
        terminal.textContent = text.slice(0, i++);
        const delay = isMobile()
          ? text[i - 2] === "\n"
            ? 42
            : 9
          : text[i - 2] === "\n"
            ? 16
            : 3;
        if (i <= text.length) setTimeout(type, delay);
      };
      type();
    }
  }

  const mobileButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  mobileButton?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileButton.setAttribute("aria-expanded", String(open));
  });
  mobileMenu?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileButton?.setAttribute("aria-expanded", "false");
    }),
  );

  const palette = document.getElementById("command-palette");
  const commandOpen = document.getElementById("command-open");
  const commandInput = document.getElementById("command-input");
  let previousFocus;
  const openPalette = () => {
    previousFocus = document.activeElement;
    palette?.classList.add("open");
    palette?.setAttribute("aria-hidden", "false");
    setTimeout(() => commandInput?.focus(), 20);
  };
  const closePalette = () => {
    const wasOpen = palette?.classList.contains("open");
    palette?.classList.remove("open");
    palette?.setAttribute("aria-hidden", "true");
    if (wasOpen) previousFocus?.focus();
  };
  commandOpen?.addEventListener("click", openPalette);
  palette?.addEventListener("click", (e) => {
    if (e.target === palette) closePalette();
  });
  palette
    ?.querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closePalette));
  const commandItems = Array.from(
    palette?.querySelectorAll(".command-box a") || [],
  );
  let commandIndex = 0;
  const syncCommandSearch = () => {
    const query = (commandInput?.value || "").trim().toLowerCase();
    const visible = [];
    commandItems.forEach((item) => {
      const match = item.textContent.toLowerCase().includes(query);
      item.hidden = !match;
      if (match) visible.push(item);
      item.style.background = "";
    });
    commandIndex = Math.min(commandIndex, Math.max(0, visible.length - 1));
    visible[commandIndex]?.style.setProperty(
      "background",
      "rgba(125,211,252,.10)",
    );
  };
  commandInput?.addEventListener("input", () => {
    commandIndex = 0;
    syncCommandSearch();
  });
  commandInput?.addEventListener("keydown", (e) => {
    const visible = commandItems.filter((item) => !item.hidden);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      commandIndex = Math.min(visible.length - 1, commandIndex + 1);
      syncCommandSearch();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      commandIndex = Math.max(0, commandIndex - 1);
      syncCommandSearch();
    }
    if (e.key === "Enter" && visible[commandIndex]) {
      e.preventDefault();
      visible[commandIndex].click();
    }
  });
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
      syncCommandSearch();
    }
    if (e.key === "Escape") {
      closePalette();
      if (mobileMenu?.classList.contains("open")) {
        mobileMenu.classList.remove("open");
        mobileMenu.setAttribute("aria-hidden", "true");
        mobileButton?.setAttribute("aria-expanded", "false");
        mobileButton?.focus();
      }
    }
    if (e.key === "Tab" && palette?.classList.contains("open")) {
      const controls = [
        commandInput,
        ...commandItems.filter((item) => !item.hidden),
      ].filter(Boolean);
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });

  const navLinks = Array.from(
    document.querySelectorAll('.glass-nav a[href^="#"]'),
  );
  const sectionMap = new Map(
    navLinks
      .map((link) => [link.getAttribute("href")?.slice(1), link])
      .filter(([id]) => id),
  );
  const navObserver = new IntersectionObserver(
    (entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      sectionMap.get(active.target.id)?.setAttribute("aria-current", "true");
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: [0.05, 0.25, 0.55] },
  );
  sectionMap.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) navObserver.observe(section);
  });

  document
    .querySelectorAll('a[href^="#"]:not([data-note])')
    .forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const hash = anchor.getAttribute("href");
        if (!hash || hash === "#") return;
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        const jump = () =>
          target.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        if (document.startViewTransition && !reducedMotion)
          document.startViewTransition(jump);
        else jump();
        history.pushState(null, "", hash);
      });
    });

  if (!reducedMotion && !isMobile()) {
    document
      .querySelectorAll("[data-tilt], .pro-card, .note-link-card")
      .forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          const x = e.clientX - r.left,
            y = e.clientY - r.top;
          const rx = (y / r.height - 0.5) * -5;
          const ry = (x / r.width - 0.5) * 5;
          card.style.setProperty("--mx", `${(x / r.width) * 100}%`);
          card.style.setProperty("--my", `${(y / r.height) * 100}%`);
          card.style.setProperty("--tilt-x", `${rx}deg`);
          card.style.setProperty("--tilt-y", `${ry}deg`);
        });
        card.addEventListener("mouseleave", () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        });
      });
  }

  const projectDeck = document.querySelector(".project-deck");
  const projectCards = Array.from(document.querySelectorAll(".project-case"));
  const projectDots = Array.from(
    document.querySelectorAll("#project-dots button"),
  );
  let projectFrame = null;
  const setActiveProject = () => {
    if (!projectDeck || projectCards.length === 0) return;
    const deckRect = projectDeck.getBoundingClientRect();
    const center = deckRect.left + deckRect.width / 2;
    let activeIndex = 0;
    let best = Infinity;
    projectCards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < best) {
        best = distance;
        activeIndex = index;
      }
    });
    projectCards.forEach((card, index) =>
      card.classList.toggle("is-active", index === activeIndex),
    );
    projectDots.forEach((dot, index) =>
      dot.classList.toggle("active", index === activeIndex),
    );
  };
  const scheduleActiveProject = () => {
    if (projectFrame !== null) return;
    projectFrame = requestAnimationFrame(() => {
      projectFrame = null;
      setActiveProject();
    });
  };
  setActiveProject();
  projectDeck?.addEventListener("scroll", scheduleActiveProject, {
    passive: true,
  });
  window.addEventListener("resize", scheduleActiveProject, { passive: true });
  projectDots.forEach((dot, index) => {
    dot.addEventListener("click", () =>
      projectCards[index]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      }),
    );
  });

  if (
    !reducedMotion &&
    !isMobile() &&
    window.matchMedia("(pointer: fine)").matches
  ) {
    const magneticItems = document.querySelectorAll(
      ".primary-action, .secondary-action, .hero-mini-card, .case-link, .note-link-card",
    );
    magneticItems.forEach((item) => {
      item.addEventListener("mousemove", (e) => {
        const r = item.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        item.style.setProperty("--mag-x", `${x * 8}px`);
        item.style.setProperty("--mag-y", `${y * 8}px`);
      });
      item.addEventListener("mouseleave", () => {
        item.style.setProperty("--mag-x", "0px");
        item.style.setProperty("--mag-y", "0px");
      });
    });
  }
});
async function handleEmailClick(el, e) {
  e.preventDefault();
  if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    window.location.href = "mailto:h@tzheng.dev";
    return;
  }
  try {
    await navigator.clipboard.writeText("h@tzheng.dev");
  } catch {
    window.location.href = "mailto:h@tzheng.dev";
    return;
  }
  let tooltip = el.querySelector(".email-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("span");
    tooltip.className = "email-tooltip";
    tooltip.setAttribute("role", "status");
    tooltip.textContent = "Copied to clipboard!";
    el.style.position = "relative";
    el.appendChild(tooltip);
  }
  tooltip.classList.add("visible");
  setTimeout(() => tooltip.classList.remove("visible"), 2000);
}
