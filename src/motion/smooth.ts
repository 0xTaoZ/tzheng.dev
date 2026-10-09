// Content pages: Lenis smooth scrolling on its own (about 10 KB), so articles
// scroll with the same feel as the homepage without loading GSAP.
import Lenis from "lenis";

document.documentElement.classList.add("motion-ready");
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !saveData) {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    anchors: { offset: -72 },
    prevent: (node) => node.closest?.("[data-lenis-prevent]") !== null,
  });
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  // Overlays such as the command palette pause smooth scrolling.
  new MutationObserver(() => {
    document.documentElement.style.overflow === "hidden" ? lenis.stop() : lenis.start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
}
