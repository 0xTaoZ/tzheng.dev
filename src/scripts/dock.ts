// Phone controls: a bottom bar that steps aside while reading, and a sheet that
// follows the finger and can be flicked away.
const dock = document.querySelector<HTMLElement>("[data-dock]");
const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");

if (dock) {
  const hero = document.querySelector(".hero");
  const syncHero = (y: number) => dock.classList.toggle("is-hero", Boolean(hero) && y < innerHeight * 0.75);
  syncHero(scrollY);
  let last = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    const atEnd = y + innerHeight >= document.documentElement.scrollHeight - innerHeight * 0.6;
    syncHero(y);
    if (Math.abs(y - last) < 8 && !atEnd) return;
    // The footer has its own email button, and the name runs to the screen edge.
    dock.classList.toggle("is-away", (y > last && y > 240) || atEnd);
    syncHero(y);
    last = y;
  };
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}

if (sheet) {
  const grip = sheet.querySelector<HTMLElement>("[data-sheet-grip]")!;
  const open = () => {
    sheet.showModal();
    sheet.getBoundingClientRect();
    sheet.classList.add("is-open");
  };
  const close = () => {
    sheet.style.removeProperty("transform");
    sheet.style.removeProperty("transition");
    sheet.classList.remove("is-open");
    const done = () => sheet.close();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    sheet.addEventListener("transitionend", done, { once: true });
    // A fallback in case the transition is interrupted before it ends.
    setTimeout(() => sheet.open && !sheet.classList.contains("is-open") && done(), 420);
  };

  document.addEventListener("click", (event) => {
    if ((event.target as Element).closest("[data-sheet-open]")) open();
  });
  sheet.querySelector("[data-sheet-close]")?.addEventListener("click", close);
  sheet.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) close();
    if ((event.target as Element).closest("a")) close();
  });

  // Drag the grip: 1:1 going down, rising resistance going up, a flick dismisses.
  let start = 0;
  let startTime = 0;
  let dragging = false;
  grip.addEventListener("pointerdown", (event) => {
    if ((event.target as Element).closest("button") || dragging) return;
    dragging = true;
    start = event.clientY;
    startTime = event.timeStamp;
    grip.setPointerCapture(event.pointerId);
    sheet.style.transition = "none";
  });
  grip.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const distance = event.clientY - start;
    const y = distance >= 0 ? distance : -(Math.abs(distance) * 40) / (40 + Math.abs(distance));
    sheet.style.transform = `translateY(${y}px)`;
  });
  const release = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    const distance = event.clientY - start;
    const velocity = distance / Math.max(1, event.timeStamp - startTime);
    if (velocity > 0.11 && distance > 12) return close();
    if (distance > sheet.offsetHeight * 0.3) return close();
    sheet.style.removeProperty("transition");
    sheet.style.removeProperty("transform");
  };
  grip.addEventListener("pointerup", release);
  grip.addEventListener("pointercancel", release);
}

// Education: on a phone only the current school stays open.
if (matchMedia("(max-width: 720px)").matches) {
  for (const details of document.querySelectorAll<HTMLDetailsElement>("[data-phone-closed]")) details.open = false;
}
