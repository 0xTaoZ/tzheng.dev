// Homepage motion: the case story, the starfield, the portrait light, card
// spotlights, counters and chart bars. Each effect is optional; with reduced
// motion only the case story's active state is kept.

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;

// ---------- Case story: the step in the middle of the screen drives the code panel.
const story = document.querySelector("[data-case-story]");
if (story) {
  const steps = [...story.querySelectorAll(".case-step")];
  const panels = [...story.querySelectorAll("[data-panel]")];
  const dots = [...story.querySelectorAll("[data-dot]")];
  const activate = (index) => {
    steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
    panels.forEach((panel, i) => panel.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };
  activate(0);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) activate(steps.indexOf(entry.target));
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  steps.forEach((step) => observer.observe(step));
}

// ---------- Counters count up once when they come into view.
const counters = [...document.querySelectorAll("[data-count]")];
const formatLike = (template, value) => {
  const match = template.match(/^([\d.]+)(\D*)$/);
  if (!match) return template;
  const decimals = (match[1].split(".")[1] ?? "").length;
  return `${value.toFixed(decimals)}${match[2]}`;
};
if (!reduced && counters.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const element = entry.target;
        const final = element.textContent.trim();
        const target = parseFloat(final);
        if (!Number.isFinite(target)) continue;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 1400);
          const eased = 1 - Math.pow(2, -10 * t);
          element.textContent = t < 1 ? formatLike(final, target * eased) : final;
          if (t < 1) requestAnimationFrame(step);
        };
        element.textContent = formatLike(final, 0);
        requestAnimationFrame(step);
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((counter) => observer.observe(counter));
}

// ---------- Chart and repository bars grow into place.
const board = document.querySelector(".upstream-board");
if (board && !reduced) {
  board.classList.add("is-armed");
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      board.classList.add("is-visible");
      observer.disconnect();
    },
    { threshold: 0.3 },
  );
  observer.observe(board);
}

// ---------- Spotlight: card borders light up under the pointer.
if (finePointer && !reduced) {
  for (const group of document.querySelectorAll("[data-spotlight]")) {
    group.addEventListener(
      "pointermove",
      (event) => {
        for (const card of group.children) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--sx", `${event.clientX - rect.left}px`);
          card.style.setProperty("--sy", `${event.clientY - rect.top}px`);
        }
      },
      { passive: true },
    );
  }
}

// ---------- Portrait: a slight tilt and a moving highlight.
const portrait = document.querySelector(".hero-portrait");
if (portrait && finePointer && !reduced) {
  const picture = portrait.querySelector("picture");
  picture.addEventListener("pointermove", (event) => {
    const rect = picture.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    portrait.classList.add("is-tracking");
    picture.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    picture.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    picture.style.setProperty("--gx", `${x * 100}%`);
    picture.style.setProperty("--gy", `${y * 100}%`);
  });
  picture.addEventListener("pointerleave", () => {
    portrait.classList.remove("is-tracking");
    picture.style.setProperty("--rx", "0deg");
    picture.style.setProperty("--ry", "0deg");
  });
}

// ---------- Starfield: sparse stars with depth over the Earth photograph.
const canvas = document.querySelector(".starfield");
if (canvas && !reduced) {
  const context = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  let stars = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = null;
  let visible = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const resize = () => {
    ratio = Math.min(devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const count = Math.min(220, Math.round((width * height) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.75,
      depth: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
    }));
  };

  const draw = (time) => {
    frame = null;
    if (!visible || document.hidden) return;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const drift = scrollY * 0.12;
    for (const star of stars) {
      const twinkle = 0.55 + 0.45 * Math.sin(star.phase + (time / 1000) * star.speed);
      const x = star.x + pointer.x * star.depth * 14;
      const y = star.y + pointer.y * star.depth * 10 - drift * star.depth;
      const size = 0.35 + star.depth * 0.9;
      context.globalAlpha = (0.25 + star.depth * 0.6) * twinkle;
      context.fillStyle = star.depth > 0.85 ? "#d8fbe6" : "#e9f2ff";
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    frame = requestAnimationFrame(draw);
  };
  const start = () => {
    if (frame === null && visible && !document.hidden) frame = requestAnimationFrame(draw);
  };

  resize();
  start();
  addEventListener("resize", () => {
    resize();
    start();
  }, { passive: true });
  if (finePointer) {
    addEventListener("pointermove", (event) => {
      pointer.tx = event.clientX / innerWidth - 0.5;
      pointer.ty = event.clientY / innerHeight - 0.5;
    }, { passive: true });
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(hero);
  document.addEventListener("visibilitychange", start);
}
