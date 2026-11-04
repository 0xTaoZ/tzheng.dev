// Motion core: one GSAP ticker drives Lenis smooth scrolling and every
// ScrollTrigger, so scroll-linked animation and the scroll position never
// drift apart. Effects register as scenes and are skipped entirely when the
// visitor prefers reduced motion.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
// Mobile address bars resize the viewport while scrolling; recalculating on
// every resize would make pinned sections jump.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };

// Adaptive loading: data saver or a very small device gets the static page,
// the same as reduced motion. WebGL scenes check `lowPower` separately.
const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
// WebKit under-reports the core count on iPhone and iPad, so it says nothing there.
// Apps can replace the user agent, so the platform is checked as well.
const appleTouch = /iP(hone|ad|od)/.test(`${navigator.userAgent} ${navigator.platform}`) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const lowPower = Boolean(connection?.saveData) || memory <= 2 || (!appleTouch && (navigator.hardwareConcurrency ?? 8) <= 2);
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches || Boolean(connection?.saveData);
export const finePointer = matchMedia("(pointer: fine)").matches;
// Phones and touch tablets in portrait share the touch layout (see mobile.css).
export const touchLayout = matchMedia("(max-width: 720px), (max-width: 1099px) and (pointer: coarse)").matches;
export const coarsePointer = matchMedia("(pointer: coarse)").matches;

export let lenis: Lenis | null = null;

export function startMotion() {
  document.documentElement.classList.add("motion-ready");
  if (reducedMotion) return;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    anchors: { offset: -72 },
    prevent: (node) => node.closest?.("[data-lenis-prevent]") !== null,
    // Phones get the same weighted scroll as the desktop.
    syncTouch: true,
    syncTouchLerp: 0.085,
    touchInertiaExponent: 1.7,
    allowNestedScroll: true,
    gestureOrientation: "vertical",
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Overlays such as the command palette pause smooth scrolling.
  new MutationObserver(() => {
    const locked = document.documentElement.style.overflow === "hidden";
    locked ? lenis?.stop() : lenis?.start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
}

type Scene = () => void | Promise<void>;
const scenes: Scene[] = [];

export const scene = (setup: Scene) => scenes.push(setup);

export async function runScenes() {
  // Scenes start together: one waiting on an image or a chunk must not hold back
  // the others, and a failed effect must never take the page down with it.
  await Promise.all(
    scenes.map(async (setup) => {
      try {
        await setup();
      } catch (error) {
        console.warn("motion scene failed", error);
      }
    }),
  );
  ScrollTrigger.refresh();
}

// Load a heavy scene (for example WebGL) only when its element is close to
// the viewport.
export const whenNear = (element: Element, load: () => void, margin = "600px") => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      load();
    },
    { rootMargin: margin },
  );
  observer.observe(element);
};
