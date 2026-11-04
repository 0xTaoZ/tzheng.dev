import { finePointer, touchLayout, gsap, reducedMotion, scene, ScrollTrigger, SplitText } from "./core";

const all = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(selector)] as T[];

// Triggers inside the pinned projects section must know about the pin.
const pinnedIn = (element: Element) => element.closest<HTMLElement>("#projects.is-horizontal") ?? undefined;

// ---------- Projects: a pinned horizontal gallery on wide screens. Registered
// first so later triggers are measured with the pin spacer in place.
scene(() => {
  if (reducedMotion) return;
  const media = gsap.matchMedia();
  media.add("(min-width: 1100px)", () => {
    const section = document.querySelector<HTMLElement>("#projects");
    const rail = section?.querySelector<HTMLElement>(".project-rail");
    const track = rail?.querySelector<HTMLElement>(".project-track");
    if (!section || !rail || !track) return;
    section.classList.add("is-horizontal");
    const distance = () => Math.max(0, track.scrollWidth - rail.clientWidth);
    const items = all(".project-feature, .project-card", track);
    const count = section.querySelector<HTMLElement>(".rail-count");
    let shown = -1;
    const showCount = (progress: number) => {
      const edge = progress * distance() + rail.clientWidth / 2;
      const index = Math.max(0, items.findLastIndex((item) => item.offsetLeft - track.offsetLeft <= edge));
      if (index === shown || !count) return;
      shown = index;
      count.textContent = `${index + 1} ${document.documentElement.lang === "de" ? "von" : "of"} ${items.length}`;
    };
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        // Lenis already smooths the scroll, so the track stays locked to it.
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => showCount(self.progress),
      },
    });
    showCount(0);
    // Keyboard users reach every card: focus scrolls the track to it.
    const onFocus = (event: FocusEvent) => {
      const item = (event.target as Element).closest<HTMLElement>(".project-feature, .project-card");
      const trigger = tween.scrollTrigger;
      if (!item || !trigger) return;
      const x = gsap.utils.clamp(0, distance(), item.offsetLeft - track.offsetLeft);
      window.scrollTo({ top: trigger.start + x, behavior: "instant" });
    };
    track.addEventListener("focusin", onFocus);
    return () => {
      track.removeEventListener("focusin", onFocus);
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: "transform" });
      section.classList.remove("is-horizontal");
    };
  });
});

// ---------- Headings and intros: lines rise out of a mask.
scene(() => {
  if (reducedMotion) return;
  for (const heading of all(".section h2, .system-band h2, .contact-panel h2")) {
    const split = SplitText.create(heading, { type: "lines,words", mask: "lines", linesClass: "split-line" });
    gsap.from(split.words, {
      yPercent: 110,
      duration: 1,
      ease: "expo.out",
      stagger: 0.04,
      scrollTrigger: { trigger: heading, start: "top 88%", once: true, pinnedContainer: pinnedIn(heading) },
    });
  }
  for (const lede of all(".section-lede")) {
    const split = SplitText.create(lede, { type: "lines", mask: "lines" });
    gsap.from(split.lines, {
      yPercent: 100,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.09,
      delay: 0.12,
      scrollTrigger: { trigger: lede, start: "top 90%", once: true, pinnedContainer: pinnedIn(lede) },
    });
  }
});

// ---------- Figures roll up to their value once; the real number stays in the
// text for screen readers and search.
scene(() => {
  if (reducedMotion) return;
  for (const element of all("[data-roll]")) {
    const value = element.textContent?.trim() ?? "";
    const said = Object.assign(document.createElement("span"), { className: "roll-said", textContent: value });
    const shown = Object.assign(document.createElement("span"), { className: "roll-digits" });
    shown.setAttribute("aria-hidden", "true");
    let column = 0;
    for (const character of value) {
      if (!/\d/.test(character)) {
        shown.append(character);
        continue;
      }
      const col = Object.assign(document.createElement("span"), { className: "roll-col" });
      const strip = Object.assign(document.createElement("span"), { className: "roll-strip" });
      strip.style.setProperty("--d", character);
      strip.style.setProperty("--i", String(column++));
      for (let n = 0; n < 10; n++) strip.append(Object.assign(document.createElement("span"), { textContent: String(n) }));
      col.append(strip);
      shown.append(col);
    }
    element.classList.add("roll");
    element.replaceChildren(said, shown);
    // Each column takes the width of its own digit, so the figure keeps its natural spacing.
    const em = parseFloat(getComputedStyle(element).fontSize);
    for (const col of all(".roll-col", shown)) {
      const strip = col.firstElementChild as HTMLElement;
      const digit = strip.children[Number(strip.style.getPropertyValue("--d"))] as HTMLElement;
      col.style.width = `${digit.getBoundingClientRect().width / em}em`;
    }
    ScrollTrigger.create({ trigger: element, start: "top 92%", once: true, onEnter: () => element.classList.add("is-in") });
  }
});

// ---------- The one statement that fills in as it is read: the CVE credit.
scene(() => {
  if (reducedMotion) return;
  for (const statement of all(".disclosure-text")) {
    const split = SplitText.create(statement, { type: "words" });
    gsap.fromTo(
      split.words,
      { opacity: 0.45 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: statement, start: "top 82%", end: "top 50%", scrub: true },
      },
    );
  }
});

// ---------- Tables arrive like a ledger being written: row by row, left to right.
scene(() => {
  if (reducedMotion) return;
  for (const table of all(".skill-table, .upstream-list ol")) {
    const rows = [...table.children].filter((row) => !row.matches(".skill-header"));
    gsap.fromTo(
      rows,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        clearProps: "clipPath",
        scrollTrigger: { trigger: table, start: "top 85%", once: true },
      },
    );
  }
});

// ---------- Blocks fade up in batches as they arrive.
scene(() => {
  const blocks = all(".reveal").filter((element) => !element.closest(".hero"));
  if (reducedMotion) {
    blocks.forEach((element) => element.classList.add("active"));
    return;
  }
  gsap.set(blocks, { opacity: 0, y: 16 });
  const enter = (batch: Element[]) =>
    gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.06, overwrite: true });
  const pinned = blocks.filter((element) => pinnedIn(element));
  ScrollTrigger.batch(blocks.filter((element) => !pinnedIn(element)), { start: "top 90%", once: true, onEnter: enter });
  // Batch triggers cannot account for a pin, so blocks inside it get their own.
  for (const element of pinned)
    ScrollTrigger.create({ trigger: element, start: "top 90%", once: true, pinnedContainer: pinnedIn(element), onEnter: () => enter([element]) });
});

// ---------- Hero: the backdrop sinks and the copy lifts away on scroll.
scene(() => {
  if (reducedMotion) return;
  const hero = document.querySelector(".hero");
  if (!hero) return;
  gsap.fromTo(
    ".hero-backdrop",
    { scale: 1, yPercent: 0, opacity: 1 },
    {
      scale: 1.14,
      yPercent: 8,
      opacity: 0.3,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    },
  );
  if (touchLayout) {
    gsap.fromTo(".hero-portrait picture", { yPercent: 0, scale: 1 }, { yPercent: 14, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: () => `+=${innerHeight}`, scrub: true } });
    return;
  }
  gsap.to(".hero-grid", {
    yPercent: -6,
    opacity: 0.2,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "35% top", end: "bottom top", scrub: true },
  });
});

// ---------- Monthly bars grow into place.
scene(() => {
  if (reducedMotion) return;
  for (const board of all(".upstream-board")) {
    const timeline = gsap.timeline({ scrollTrigger: { trigger: board, start: "top 80%", once: true } });
    timeline
      .from(all(".merge-fill", board), { scaleY: 0, transformOrigin: "bottom", duration: 0.9, ease: "expo.out", stagger: 0.07 })
      .from(all(".merge-value", board), { opacity: 0, y: 8, duration: 0.5, stagger: 0.07 }, 0.4);
  }
});

// ---------- Case story: steps drive the code window; lines arrive in order.
scene(() => {
  const story = document.querySelector<HTMLElement>("[data-case-story]");
  if (!story) return;
  const steps = all(".case-step", story);
  const panels = all("[data-panel]", story);
  const dots = all("[data-dot]", story);
  let current = -1;
  const activate = (index: number) => {
    if (index === current) return;
    current = index;
    story.dispatchEvent(new CustomEvent("casechange", { detail: index }));
    steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    panels.forEach((panel, i) => {
      panel.classList.toggle("is-active", i === index);
      if (i === index && !reducedMotion) {
        gsap.fromTo(
          all(".line", panel),
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", stagger: 0.025, overwrite: true },
        );
      }
    });
  };
  activate(0);
  steps.forEach((step, index) =>
    ScrollTrigger.create({
      trigger: step,
      start: () => (touchLayout ? "top 62%" : "top center"),
      end: () => (touchLayout ? "bottom 62%" : "bottom center"),
      onToggle: (self) => self.isActive && activate(index),
    }),
  );
});

// ---------- The name in the footer grows into place as the page ends.
scene(() => {
  if (reducedMotion) return;
  const name = document.querySelector(".footer-name");
  if (name)
    gsap.fromTo(name, { scale: 0.94 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true } });
});

// ---------- Portrait: a slight tilt that follows the pointer and settles back.
scene(() => {
  if (!finePointer || reducedMotion) return;
  const picture = document.querySelector<HTMLElement>(".hero-portrait picture");
  if (!picture) return;
  const rotateX = gsap.quickTo(picture, "rotationX", { duration: 0.6, ease: "power3" });
  const rotateY = gsap.quickTo(picture, "rotationY", { duration: 0.6, ease: "power3" });
  gsap.set(picture, { transformPerspective: 1200 });
  picture.addEventListener("pointermove", (event) => {
    const rect = picture.getBoundingClientRect();
    rotateY(((event.clientX - rect.left) / rect.width - 0.5) * 6);
    rotateX((0.5 - (event.clientY - rect.top) / rect.height) * 5);
  });
  picture.addEventListener("pointerleave", () => {
    rotateX(0);
    rotateY(0);
  });
});

// ---------- Education: the timeline rule draws itself as you read.
scene(() => {
  const line = document.querySelector<HTMLElement>(".edu-line");
  if (!line || reducedMotion) return;
  gsap.fromTo(
    line,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      transformOrigin: "top",
      scrollTrigger: { trigger: ".edu-timeline", start: "top 70%", end: "bottom 60%", scrub: true },
    },
  );
  for (const item of all(".edu-item")) {
    ScrollTrigger.create({
      trigger: item,
      start: "top 65%",
      onEnter: () => item.classList.add("is-lit"),
      onLeaveBack: () => item.classList.remove("is-lit"),
    });
  }
});
