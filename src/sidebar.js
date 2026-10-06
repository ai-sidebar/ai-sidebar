const ext = globalThis.browser ?? globalThis.chrome;

const BUILTIN_SITES = [
  { id: "chatgpt",  name: "ChatGPT",           url: "https://chatgpt.com",           icon: "icons/chatgpt.png" },
  { id: "claude",   name: "Anthropic Claude",  url: "https://claude.ai",             icon: "icons/claude.png" },
  { id: "gemini",   name: "Google Gemini",     url: "https://gemini.google.com/app", icon: "icons/googlegemini.png" },
  { id: "aistudio", name: "Google AI Studio",  url: "https://aistudio.google.com",   icon: "icons/googleaistudio.png" },
  { id: "deepseek", name: "DeepSeek",          url: "https://chat.deepseek.com",     icon: "icons/deepseek.png" },
  { id: "zai",      name: "Z.ai (GLM)",        url: "https://chat.z.ai",             icon: "icons/zai.png" },
  { id: "kimi",     name: "Kimi",              url: "https://www.kimi.ai",           icon: "icons/kimi.png" },
  { id: "qwen",     name: "Qwen",              url: "https://chat.qwen.ai",          icon: "icons/qwen.png" },
  { id: "copilot",  name: "Microsoft Copilot", url: "https://copilot.microsoft.com/", icon: "icons/microsoftcopilot.png" },
  { id: "perplexity", name: "Perplexity",      url: "https://perplexity.ai/",        icon: "icons/perplexity.png" },
  { id: "grok",     name: "Grok",              url: "https://grok.com/",             icon: "icons/grok.png" },
  { id: "meta",     name: "Meta",              url: "https://meta.ai/",              icon: "icons/meta.png" },
  { id: "duckai",   name: "Duck.ai",           url: "https://duck.ai/",              icon: "icons/duckai.png" },
  { id: "mistral",  name: "Mistral Vibe",      url: "https://chat.mistral.ai",       icon: "icons/mistral.png" },
];

// ---------- Elements ----------
const recentSection = document.getElementById("recentSection");
const recentCard    = document.getElementById("recentCard");
const recentIcon    = document.getElementById("recentIcon");
const recentLabel   = document.getElementById("recentLabel");
const recentHint    = document.getElementById("recentHint");
const siteGrid      = document.getElementById("siteGrid");
const hiddenSection = document.getElementById("hiddenSection");
const hiddenToggle  = document.getElementById("hiddenToggle");
const hiddenLabel   = document.getElementById("hiddenLabel");
const hiddenGrid    = document.getElementById("hiddenGrid");
const loadingOverlay = document.getElementById("loadingOverlay");
const versionLabel  = document.getElementById("versionLabel");
const addSiteButton = document.getElementById("addSiteButton");
const addDialog     = document.getElementById("addDialog");
const addForm       = document.getElementById("addForm");
const addUrl        = document.getElementById("addUrl");
const addName       = document.getElementById("addName");
const addError      = document.getElementById("addError");
const addCancel     = document.getElementById("addCancel");

let favorites = [];
let hidden = [];
let recentSite = null;
let customSites = [];

function catalog() {
  return [...BUILTIN_SITES, ...customSites];
}

function allSites() {
  const byId = new Map(catalog().map((s) => [s.id, s]));
  const favored = favorites
    .filter((id) => !hidden.includes(id))
    .map((id) => byId.get(id))
    .filter(Boolean);
  const favoredIds = new Set(favored.map((s) => s.id));
  const rest = catalog().filter((s) => !favoredIds.has(s.id) && !hidden.includes(s.id));
  return [...favored, ...rest];
}

function hiddenSites() {
  const byId = new Map(catalog().map((s) => [s.id, s]));
  return hidden.map((id) => byId.get(id)).filter(Boolean);
}

// ---------- SVG icons (built as DOM nodes, no innerHTML) ----------
const SVG_NS = "http://www.w3.org/2000/svg";

function makeSvg(size, children) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("aria-hidden", "true");
  children.forEach(([tag, attrs]) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  });
  return svg;
}

const EYE_EDGE  = ["path", { d: "M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" }];
const EYE_PUPIL = ["circle", { cx: 12, cy: 12, r: 2.7 }];

const eyeOnIcon  = () => makeSvg(22, [EYE_EDGE, EYE_PUPIL]);
const eyeOffIcon = () => makeSvg(22, [EYE_EDGE, EYE_PUPIL, ["line", { x1: 4, y1: 20, x2: 20, y2: 4 }]]);
const trashIcon  = () => makeSvg(21, [
  ["path", { d: "M4 7h16" }],
  ["path", { d: "M10 4h4" }],
  ["path", { d: "M6 7l1 13h10l1-13" }],
  ["path", { d: "M10.5 11v6" }],
  ["path", { d: "M13.5 11v6" }],
]);
const starIcon = () => makeSvg(26, [
  ["path", { d: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" }],
]);

function makeActionButton(label, makeIcon, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tile-action";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.appendChild(makeIcon());
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return button;
}

function setIcon(img, site) {
  const candidates = [site.icon].concat(site.iconFallbacks || []).filter(Boolean);
  let next = 0;

  if (candidates.length === 0) {
    img.style.opacity = "0";
    return img;
  }

  img.onload = () => { img.style.opacity = ""; };
  img.onerror = () => {
    next += 1;
    if (next < candidates.length) {
      img.src = candidates[next];
    } else {
      img.style.opacity = "0";
    }
  };
  img.style.opacity = "";
  img.src = candidates[0];
  return img;
}

function makeTile(site, isHidden) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "tile";
  tile.addEventListener("click", () => openSite(site));

  const icon = document.createElement("img");
  icon.className = "tile-icon";
  icon.alt = "";
  setIcon(icon, site);
  tile.appendChild(icon);

  const name = document.createElement("span");
  name.className = "tile-name";
  name.textContent = site.name;
  tile.appendChild(name);

  if (isHidden) {
    tile.appendChild(makeActionButton("Unhide " + site.name, eyeOnIcon, () => toggleHidden(site)));
    return tile;
  }

  const fav = document.createElement("button");
  fav.type = "button";
  fav.className = "tile-fav" + (favorites.includes(site.id) ? " active" : "");
  fav.title = favorites.includes(site.id) ? "Remove from favorites" : "Add to favorites";
  fav.setAttribute("aria-pressed", favorites.includes(site.id) ? "true" : "false");
  fav.appendChild(starIcon());
  fav.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(site);
  });
  tile.appendChild(fav);

  tile.appendChild(makeActionButton("Hide " + site.name, eyeOffIcon, () => toggleHidden(site)));

  if (site.custom) {
    tile.appendChild(makeActionButton("Remove " + site.name, trashIcon, () => removeSite(site)));
  }

  return tile;
}

function renderGrid() {
  siteGrid.replaceChildren();
  allSites().forEach((site) => siteGrid.appendChild(makeTile(site)));

  const hiddenList = hiddenSites();
  hiddenGrid.replaceChildren();
  hiddenList.forEach((site) => hiddenGrid.appendChild(makeTile(site, true)));
  hiddenLabel.textContent = "Hidden (" + hiddenList.length + ")";
  hiddenSection.classList.toggle("hidden", hiddenList.length === 0);
}

// ---------- Loading spinner ----------
function showSpinner() {
  loadingOverlay.classList.remove("hidden");
  requestAnimationFrame(() => loadingOverlay.classList.add("show"));
}

function hideSpinner() {
  loadingOverlay.classList.remove("show");
  setTimeout(() => loadingOverlay.classList.add("hidden"), 150);
}

function navigate(url, startedAt) {
  const wait = Math.max(0, 300 - (Date.now() - startedAt));
  setTimeout(() => {
    goTo(url);
  }, wait);
}

function goTo(url) {
  if (ext.sidePanel) {
    ext.sidePanel.setOptions({ path: url }).catch(() => {
      window.location.href = url;
    });
  } else {
    window.location.href = url;
  }
}

window.addEventListener("pageshow", hideSpinner);

// ---------- Opening a site (direct navigation) ----------
function openSite(site) {
  showSpinner();
  const started = Date.now();

  ext.storage.local.set({
    lastUsed: {
      id: site.id,
      name: site.name,
      url: site.url,
      icon: site.icon,
      iconFallbacks: site.iconFallbacks || []
    }
  }).then(() => {
    navigate(site.url, started);
  }).catch(() => {
    hideSpinner();
  });
}

// ---------- Recently used ----------
function renderRecent(lastUsed) {
  recentSite = lastUsed || null;
  if (!lastUsed || !lastUsed.url || hidden.includes(lastUsed.id)) {
    recentSection.classList.add("hidden");
    return;
  }
  setIcon(recentIcon, lastUsed);
  recentLabel.textContent = lastUsed.name;
  try {
    recentHint.textContent = new URL(lastUsed.url).hostname.replace(/^www\./, "");
  } catch (e) {
    recentHint.textContent = "";
  }
  recentCard.onclick = () => {
    showSpinner();
    navigate(lastUsed.url, Date.now());
  };
  recentSection.classList.remove("hidden");
}

// ---------- Favorites ----------
function toggleFavorite(site) {
  const i = favorites.indexOf(site.id);
  if (i === -1) {
    favorites.push(site.id);
  } else {
    favorites.splice(i, 1);
  }
  ext.storage.local.set({ favorites }).then(() => {
    renderGrid();
  });
}

// ---------- Hidden ----------
function toggleHidden(site) {
  const i = hidden.indexOf(site.id);
  if (i === -1) {
    hidden.push(site.id);
  } else {
    hidden.splice(i, 1);
  }
  ext.storage.local.set({ hidden }).then(() => {
    renderGrid();
    renderRecent(recentSite);
  });
}

hiddenToggle.addEventListener("click", () => {
  const open = hiddenSection.classList.toggle("open");
  hiddenToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

function normalizeUrl(value) {
  let text = String(value || "").trim();
  if (!text) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = "https://" + text;

  let parsed;
  try {
    parsed = new URL(text);
  } catch (e) {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname.includes(".")) return null;
  return parsed.href;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

// The site's own /favicon.ico first, favicon services only as a fallback.
function faviconFor(url) {
  const host = new URL(url).hostname;
  return {
    icon: new URL(url).origin + "/favicon.ico",
    iconFallbacks: [
      "https://icons.duckduckgo.com/ip3/" + host + ".ico",
      "https://www.google.com/s2/favicons?sz=128&domain=" + host
    ]
  };
}

function findSite(url) {
  const clean = url.replace(/\/+$/, "");
  return catalog().find((site) => site.url.replace(/\/+$/, "") === clean);
}

function addSiteFromForm() {
  const url = normalizeUrl(addUrl.value);
  if (!url) return "Enter a valid website address, for example https://example.com";
  if (findSite(url)) return "That website is already in the list";

  const site = {
    id: "custom:" + Date.now().toString(36),
    name: addName.value.trim() || hostOf(url),
    url,
    custom: true
  };
  Object.assign(site, faviconFor(url));

  customSites.push(site);
  ext.storage.local.set({ customSites }).then(() => {
    closeAddDialog();
    renderGrid();
  });
  return "";
}

function removeSite(site) {
  customSites = customSites.filter((s) => s.id !== site.id);
  favorites = favorites.filter((id) => id !== site.id);
  hidden = hidden.filter((id) => id !== site.id);

  const patch = { customSites, favorites, hidden };
  if (recentSite && recentSite.id === site.id) {
    recentSite = null;
    patch.lastUsed = null;
  }

  ext.storage.local.set(patch).then(() => {
    renderGrid();
    renderRecent(recentSite);
  });
}

function openAddDialog() {
  addForm.reset();
  addError.textContent = "";
  addError.classList.add("hidden");
  addDialog.classList.remove("hidden");
  addUrl.focus();
}

function closeAddDialog() {
  addDialog.classList.add("hidden");
}

addSiteButton.addEventListener("click", openAddDialog);
addCancel.addEventListener("click", closeAddDialog);

addDialog.addEventListener("click", (e) => {
  if (e.target === addDialog) closeAddDialog();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !addDialog.classList.contains("hidden")) closeAddDialog();
});

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const problem = addSiteFromForm();
  if (problem) {
    addError.textContent = problem;
    addError.classList.remove("hidden");
  }
});

// ---------- Version ----------
versionLabel.textContent = "v" + ext.runtime.getManifest().version;

// ---------- Init ----------
ext.storage.local.get(["lastUsed", "favorites", "hidden", "customSites"]).then((data) => {
  favorites = data.favorites || [];
  hidden = data.hidden || [];
  customSites = data.customSites || [];
  renderGrid();
  renderRecent(data.lastUsed);
});