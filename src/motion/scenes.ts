import { gsap, lenis, reducedMotion, scene, ScrollTrigger, SplitText } from "./core";

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
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: "transform" });
      section.classList.remove("is-horizontal");
    };
  });
});

// ---------- Headings: lines rise out of a mask.
scene(() => {
  if (reducedMotion) return;
  for (const heading of all(".section h2, .system-band h2, .contact-panel h2")) {
    const split = SplitText.create(heading, { type: "lines,words", mask: "lines", linesClass: "split-line" });
    gsap.from(split.words, {
      yPercent: 110,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.045,
      scrollTrigger: { trigger: heading, start: "top 88%", once: true, pinnedContainer: pinnedIn(heading) },
    });
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
  gsap.to(".hero-grid", {
    yPercent: -10,
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
      .from(all(".merge-fill", board), { scaleY: 0, transformOrigin: "bottom", duration: 1.2, ease: "expo.out", stagger: 0.1 })
      .from(all(".merge-value", board), { opacity: 0, y: 8, duration: 0.6, stagger: 0.1 }, 0.5);
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
      start: "top center",
      end: "bottom center",
      onToggle: (self) => self.isActive && activate(index),
    }),
  );
});

// ---------- Marquee of upstream repositories; scroll speed pushes it along.
scene(() => {
  const marquee = document.querySelector<HTMLElement>("[data-marquee]");
  const track = marquee?.querySelector<HTMLElement>(".marquee-track");
  if (!marquee || !track || reducedMotion) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
  lenis?.on("scroll", ({ velocity }: { velocity: number }) => {
    const v = gsap.utils.clamp(-40, 40, velocity);
    loop.timeScale(1 + Math.abs(v) / 6);
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
