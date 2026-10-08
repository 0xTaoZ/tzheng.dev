// Site-wide command palette: ⌘K, Ctrl+K or "/" opens a search over every
// page, project case and article. The index is fetched once, on first use.

const palette = document.getElementById("command-palette");
const input = document.getElementById("command-input");
const list = document.getElementById("command-results");
let index = null;
let results = [];
let selected = 0;
let previousFocus = null;

const weights = [["title", 8], ["tags", 5], ["meta", 3], ["text", 1]];
const escapeHtml = (text) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const highlight = (title, terms) => {
  let html = escapeHtml(title);
  for (const term of terms) {
    if (term.length < 2) continue;
    const safe = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`(${safe})(?![^<]*>)`, "gi"), "<mark>$1</mark>");
  }
  return html;
};

// Every term must match somewhere; title matches weigh most.
const search = (query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return index.filter((item) => item.kind === "Page").slice(0, 8);
  return index
    .map((item) => {
      let score = 0;
      for (const term of terms) {
        const hit = weights.reduce(
          (sum, [field, weight]) => sum + ((field === "title" ? item.title.toLowerCase() : item[field]).includes(term) ? weight : 0),
          0,
        );
        if (!hit) return null;
        score += hit;
      }
      return { item, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => item);
};

const render = () => {
  const query = input.value.trim();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  results = index ? search(query) : [];
  const archive = query ? [{ title: `Search all articles for “${query}”`, url: `/articles/?q=${encodeURIComponent(query)}`, kind: "Archive", meta: "full-text search" }] : [];
  const items = [...results, ...archive];
  selected = Math.min(selected, Math.max(0, items.length - 1));
  list.innerHTML = items.length
    ? items
        .map(
          (item, i) => `<li role="none"><a role="option" id="command-option-${i}" href="${escapeHtml(item.url)}" aria-selected="${i === selected}">
            <span class="command-kind">${escapeHtml(item.kind)}</span>
            <span class="command-title">${item.kind === "Archive" ? escapeHtml(item.title) : highlight(item.title, terms)}</span>
            <span class="command-meta">${escapeHtml(item.meta || item.url)}</span></a></li>`,
        )
        .join("")
    : `<li class="command-empty">${index ? "No results." : "Loading…"}</li>`;
  input.setAttribute("aria-activedescendant", items.length ? `command-option-${selected}` : "");
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
};

const open = async () => {
  if (!palette || !palette.hidden) return;
  previousFocus = document.activeElement;
  palette.hidden = false;
  document.documentElement.style.overflow = "hidden";
  selected = 0;
  input.value = "";
  render();
  input.focus();
  if (!index) {
    try {
      index = await (await fetch("/search.json")).json();
    } catch {
      index = [];
    }
    render();
  }
};
const close = () => {
  if (!palette || palette.hidden) return;
  palette.hidden = true;
  document.documentElement.style.overflow = "";
  previousFocus?.focus?.();
};

input?.addEventListener("input", () => {
  selected = 0;
  render();
});
input?.addEventListener("keydown", (event) => {
  const count = list.querySelectorAll("a").length;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    selected = (selected + (event.key === "ArrowDown" ? 1 : -1) + count) % Math.max(1, count);
    render();
  } else if (event.key === "Enter") {
    const link = list.querySelectorAll("a")[selected];
    if (link) {
      event.preventDefault();
      location.href = link.href;
    }
  } else if (event.key === "Tab") {
    event.preventDefault();
  }
});
list?.addEventListener("mousemove", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  const i = [...list.querySelectorAll("a")].indexOf(link);
  if (i !== selected) {
    selected = i;
    list.querySelectorAll("a").forEach((a, j) => a.setAttribute("aria-selected", String(j === i)));
  }
});
palette?.addEventListener("click", (event) => {
  if (event.target === palette) close();
});
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-palette-open]")) {
    event.preventDefault();
    open();
  }
});
addEventListener("keydown", (event) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || document.activeElement?.isContentEditable;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    palette?.hidden ? open() : close();
  } else if (event.key === "/" && !typing && palette?.hidden) {
    event.preventDefault();
    open();
  } else if (event.key === "Escape") {
    close();
  }
});
