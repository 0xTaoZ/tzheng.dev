// Homepage behaviour: navigation state, reveal-on-scroll, the terminal intro,
// the mobile menu, the command palette and copying the email address.

const legacyNotes = {
  "#note-cloudtrail": "cloudtrail-first-pass",
  "#note-open-source": "small-pr-good",
  "#note-ioc": "ioc-tool",
};
const redirectLegacyNote = () => {
  const slug = legacyNotes[location.hash];
  if (slug) location.replace(`/articles/${slug}/`);
  return Boolean(slug);
};
addEventListener("hashchange", redirectLegacyNote);

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Navigation background once the page has scrolled.
const nav = document.querySelector("[data-nav]");
const syncNav = () => nav?.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", syncNav, { passive: true });
syncNav();

// Reveal sections once as they enter the viewport.
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("active");
      revealObserver.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
);
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

// Terminal intro: type the server-rendered text once.
const terminal = document.getElementById("terminal-output");
if (terminal && !reducedMotion) {
  const text = JSON.parse(terminal.dataset.lines || "[]").join("\n");
  terminal.style.minHeight = `${terminal.offsetHeight}px`;
  let index = 0;
  const type = () => {
    terminal.textContent = text.slice(0, index);
    index += text[index] === "\n" ? 1 : 2;
    if (index <= text.length + 1) setTimeout(type, text[index - 1] === "\n" ? 70 : 12);
  };
  type();
}

// Mobile menu.
const menuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");
const setMenu = (open) => {
  mobileMenu?.classList.toggle("open", open);
  mobileMenu?.setAttribute("aria-hidden", String(!open));
  menuButton?.setAttribute("aria-expanded", String(open));
};
menuButton?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

// Command palette.
const palette = document.getElementById("command-palette");
const commandInput = document.getElementById("command-input");
const commandItems = [...(palette?.querySelectorAll(".command-box a") ?? [])];
const articleSearch = palette?.querySelector("[data-article-search]");
let commandIndex = 0;
let previousFocus = null;
const visibleItems = () => commandItems.filter((item) => !item.hidden);
const syncPalette = () => {
  const raw = (commandInput?.value ?? "").trim();
  const query = raw.toLowerCase();
  for (const item of commandItems) {
    if (item !== articleSearch) item.hidden = !item.textContent.toLowerCase().includes(query);
  }
  // Any typed text can also be sent to the article archive search.
  if (articleSearch) {
    articleSearch.hidden = !raw;
    articleSearch.href = `/articles/?q=${encodeURIComponent(raw)}`;
    articleSearch.querySelector("[data-query]").textContent = raw;
  }
  const items = visibleItems();
  commandIndex = Math.min(commandIndex, Math.max(0, items.length - 1));
  commandItems.forEach((item) => item.classList.toggle("selected", item === items[commandIndex]));
};
const openPalette = () => {
  previousFocus = document.activeElement;
  palette?.classList.add("open");
  palette?.setAttribute("aria-hidden", "false");
  commandIndex = 0;
  syncPalette();
  requestAnimationFrame(() => commandInput?.focus());
};
const closePalette = () => {
  if (!palette?.classList.contains("open")) return;
  palette.classList.remove("open");
  palette.setAttribute("aria-hidden", "true");
  previousFocus?.focus();
};
document.getElementById("command-open")?.addEventListener("click", openPalette);
palette?.addEventListener("click", (event) => event.target === palette && closePalette());
commandItems.forEach((item) => item.addEventListener("click", closePalette));
commandInput?.addEventListener("input", () => {
  commandIndex = 0;
  syncPalette();
});
commandInput?.addEventListener("keydown", (event) => {
  const items = visibleItems();
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    commandIndex = (commandIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % Math.max(1, items.length);
    syncPalette();
  } else if (event.key === "Enter" && items[commandIndex]) {
    event.preventDefault();
    items[commandIndex].click();
  }
});
addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    palette?.classList.contains("open") ? closePalette() : openPalette();
  } else if (event.key === "Escape") {
    closePalette();
    if (mobileMenu?.classList.contains("open")) {
      setMenu(false);
      menuButton?.focus();
    }
  } else if (event.key === "Tab" && palette?.classList.contains("open")) {
    const controls = [commandInput, ...visibleItems()].filter(Boolean);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

// Mark the navigation link for the section currently in view.
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = navLinks
  .map((link) => document.getElementById(link.hash.slice(1)))
  .filter(Boolean);
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link) =>
        link.toggleAttribute("aria-current", link.hash === `#${entry.target.id}`),
      );
    }
  },
  { rootMargin: "-40% 0px -55% 0px" },
);
sections.forEach((section) => sectionObserver.observe(section));

// Desktop: copy the email address instead of opening a mail client.
document.querySelector("[data-email-contact]")?.addEventListener("click", async (event) => {
  const link = event.currentTarget;
  if (matchMedia("(pointer: coarse)").matches) return;
  event.preventDefault();
  try {
    await navigator.clipboard.writeText("h@tzheng.dev");
  } catch {
    location.href = "mailto:h@tzheng.dev";
    return;
  }
  let tooltip = link.querySelector(".email-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("span");
    tooltip.className = "email-tooltip";
    tooltip.setAttribute("role", "status");
    tooltip.textContent = "Copied h@tzheng.dev";
    link.append(tooltip);
  }
  tooltip.classList.add("visible");
  setTimeout(() => tooltip.classList.remove("visible"), 1800);
});

redirectLegacyNote();
