// Article reading aids: progress indicator, heading links and code copying.
const content = document.querySelector(".article-content");
const bar = document.querySelector(".reading-progress span");

if (content && bar) {
  let frame = null;
  const update = () => {
    frame = null;
    const rect = content.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight * 0.6);
    const value = Math.min(1, Math.max(0, -rect.top / total));
    bar.style.transform = `scaleX(${value})`;
  };
  addEventListener("scroll", () => (frame ??= requestAnimationFrame(update)), { passive: true });
  addEventListener("resize", () => (frame ??= requestAnimationFrame(update)), { passive: true });
  update();
}

content?.querySelectorAll("h2[id], h3[id]").forEach((heading) => {
  const link = document.createElement("a");
  link.className = "heading-anchor";
  link.href = `#${heading.id}`;
  link.setAttribute("aria-label", `Link to section: ${heading.textContent}`);
  link.textContent = "#";
  heading.append(link);
});

content?.querySelectorAll("pre").forEach((pre) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-code";
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? pre.innerText);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Select and copy";
    }
    setTimeout(() => (button.textContent = "Copy"), 1800);
  });
  const wrapper = document.createElement("div");
  wrapper.className = "code-block";
  pre.replaceWith(wrapper);
  wrapper.append(pre, button);
});

// Highlight the section currently being read in the table of contents.
const tocLinks = [...document.querySelectorAll(".toc a[href^='#']")];
if (tocLinks.length && "IntersectionObserver" in window) {
  const byId = new Map(tocLinks.map((link) => [decodeURIComponent(link.hash.slice(1)), link]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        tocLinks.forEach((link) => link.removeAttribute("aria-current"));
        byId.get(entry.target.id)?.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "0px 0px -70% 0px" },
  );
  byId.forEach((_, id) => {
    const heading = document.getElementById(id);
    if (heading) observer.observe(heading);
  });
}
