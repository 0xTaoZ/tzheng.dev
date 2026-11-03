// Phone motion, loaded only on narrow screens: Embla for swipeable rows, Motion
// springs for anything under the finger, web-haptics for a tick on commit, and
// GSAP for the scroll scenes.
import EmblaCarousel from "embla-carousel";
import { animate, press } from "motion";
import { WebHaptics } from "web-haptics";
import { gsap, reducedMotion, ScrollTrigger, SplitText, touchLayout } from "./core";

const all = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(selector)] as T[];

const haptics = new WebHaptics();
const tick = () => void haptics.trigger("selection").catch(() => undefined);

const springIn = { type: "spring", stiffness: 620, damping: 32 } as const;
const springOut = { type: "spring", stiffness: 420, damping: 17 } as const;

// ---------- Controls give under the finger and spring back.
function pressable() {
  press(".btn, .icon-link, .dock a, .dock button, .nav-sheet, .sheet-group a, .start-here a, .contact-actions a, .case-tabs button, .footer-button, .selected-list a, .latest-list a", (element) => {
    tick();
    if (reducedMotion) return;
    animate(element, { scale: 0.955 }, springIn);
    return () => void animate(element, { scale: 1 }, springOut);
  });
}

// ---------- A row of cards that follows the finger. Cards away from the centre
// settle back, so the row reads as depth while it moves.
function swipe(row: HTMLElement) {
  const root = document.createElement("div");
  root.className = "swipe-root";
  row.before(root);
  root.append(row);
  row.classList.add("swipe-row");
  const count = document.createElement("p");
  count.className = "swipe-count";
  count.setAttribute("aria-hidden", "true");
  root.after(count);

  const slides = [...row.children].filter((child) => !child.matches(".skill-header")) as HTMLElement[];
  const embla = EmblaCarousel(root, { align: "start", containScroll: "trimSnaps", dragFree: false, slides, duration: 24 });
  const showCount = () => (count.textContent = `${embla.selectedScrollSnap() + 1} of ${embla.scrollSnapList().length}`);
  const tween = () => {
    if (reducedMotion) return;
    const progress = embla.scrollProgress();
    const snaps = embla.scrollSnapList();
    slides.forEach((slide, index) => {
      const distance = Math.min(1, Math.abs((snaps[index] ?? 1) - progress) * (snaps.length - 1));
      slide.style.transform = `scale(${1 - distance * 0.06})`;
      slide.style.opacity = String(1 - distance * 0.45);
    });
  };
  embla.on("scroll", tween).on("reInit", tween).on("select", showCount).on("select", tick).on("reInit", showCount);
  tween();
  showCount();
}

// ---------- The three fixes: tabs follow the story and jump when tapped.
function caseTabs() {
  const story = document.querySelector<HTMLElement>("[data-case-story]");
  const steps = story ? all(".case-step", story) : [];
  if (!story || !steps.length) return;
  const tabs = document.createElement("div");
  tabs.className = "case-tabs";
  tabs.setAttribute("aria-label", "Jump to a fix");
  const thumb = document.createElement("span");
  thumb.className = "case-tabs-thumb";
  thumb.setAttribute("aria-hidden", "true");
  tabs.append(thumb);
  const buttons = steps.map((step) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = step.querySelector("h3")?.textContent ?? "";
    button.addEventListener("click", () => {
      const top = step.getBoundingClientRect().top + scrollY - innerHeight * 0.5;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    });
    tabs.append(button);
    return button;
  });
  const show = (index: number) => {
    if (reducedMotion) thumb.style.transform = `translateX(${index * 100}%)`;
    else animate(thumb, { x: `${index * 100}%` }, { type: "spring", stiffness: 420, damping: 30 });
    buttons.forEach((button, i) => button.setAttribute("aria-selected", String(i === index)));
  };
  let first = true;
  story.addEventListener("casechange", (event) => {
    show((event as CustomEvent<number>).detail);
    if (!first) tick();
    first = false;
  });
  show(0);
  story.prepend(tabs);
  tabs.style.order = "-2";
}

// ---------- Scroll scenes. Everything here is transform or opacity on the
// element that moves, and nothing holds content back if a trigger never fires.
function scenes() {
  // First screen: the two words of the name drift apart and the page takes over.
  const hero = document.querySelector(".hero");
  const words = all(".hero-title .word");
  if (hero && words.length === 2) {
    const leave = { trigger: hero, start: "top top", end: () => `+=${innerHeight * 0.75}`, scrub: true };
    gsap.to(words[0], { xPercent: -14, ease: "none", scrollTrigger: leave });
    gsap.to(words[1], { xPercent: 14, ease: "none", scrollTrigger: leave });
    gsap.to(".hero-alias, .hero-role, .hero-actions", { opacity: 0, y: -24, ease: "none", scrollTrigger: { ...leave, end: () => `+=${innerHeight * 0.5}` } });
  }

  // Statements and figures rise once as they arrive.
  gsap.from(".hero-lede", { opacity: 0, y: 28, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ".hero-lede", start: "top 88%", once: true } });
  gsap.from(".hero-stats > div", { opacity: 0, y: 36, duration: 0.9, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".hero-stats", start: "top 85%", once: true } });

  // Grouped lists arrive row by row.
  for (const group of all(".start-here, .contact-actions, .latest-list, .upstream-list ol")) {
    const rows = [...group.children].filter((row) => !row.matches(".list-label"));
    gsap.fromTo(rows, { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, clearProps: "transform,opacity", scrollTrigger: { trigger: group, start: "top 86%", once: true } });
  }

  // Each covered project card dims as the next one lands on it.
  const cards = all(".project-feature, .project-card");
  cards.slice(0, -1).forEach((card, index) => {
    const range = { trigger: cards[index + 1], start: "top bottom", end: "top 12%", scrub: true };
    gsap.to(card, { scale: 0.92, ease: "none", scrollTrigger: range });
    gsap.to([...card.children], { opacity: 0.25, ease: "none", scrollTrigger: range });
  });
  for (const title of all(".project-feature h3, .project-card h3")) {
    gsap.from(title, { opacity: 0, y: 24, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: title, start: "top 90%", once: true } });
  }

  // Code windows open like a shutter the first time the story arrives.
  const stage = document.querySelector(".case-stage");
  if (stage && getComputedStyle(stage).display !== "none")
    gsap.fromTo(stage, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.inOut", clearProps: "clipPath", scrollTrigger: { trigger: stage, start: "top 85%", once: true } });

  // Education: dots light up as the drawn rule reaches them (see scenes.ts).
  for (const logo of all(".edu-logo")) {
    gsap.from(logo, { scale: 0.7, opacity: 0, duration: 0.7, ease: "back.out(1.6)", scrollTrigger: { trigger: logo, start: "top 90%", once: true } });
  }

  // The footer name rises letter by letter with the last of the scroll.
  const name = document.querySelector<HTMLElement>(".footer-name");
  if (name) {
    const split = SplitText.create(name, { type: "lines,chars", mask: "lines" });
    gsap.from(split.chars, { yPercent: 105, ease: "power2.out", stagger: 0.04, scrollTrigger: { trigger: name, start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }
}

export function setup() {
  pressable();
  // Touch screens wide enough for the desktop layout keep its scenes.
  if (!touchLayout) return;
  caseTabs();
  for (const row of all(".skill-table, .selected-list")) swipe(row);
  if (!reducedMotion) scenes();
  ScrollTrigger.refresh();
}
