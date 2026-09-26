/*
 * AI Sidebar — sidebar.js
 * ------------------------------------------------------------------
 * Landing page shown when the sidebar opens. Lists the AI sites with a
 * "Recently used" card. Clicking a site navigates the sidebar directly to
 * that site (no iframe, no webRequest, no header modification).
 *
 * No analytics, no telemetry.
 */

// ---------- Built-in sites ----------
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
const loadingOverlay = document.getElementById("loadingOverlay");

let favorites = [];

// ---------- Grid ----------
function allSites() {
  const byId = new Map(BUILTIN_SITES.map((s) => [s.id, s]));
  const favored = favorites.map((id) => byId.get(id)).filter(Boolean);
  const favoredIds = new Set(favored.map((s) => s.id));
  const rest = BUILTIN_SITES.filter((s) => !favoredIds.has(s.id));
  return [...favored, ...rest];
}

function makeTile(site) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "tile";
  tile.addEventListener("click", () => openSite(site));

  const icon = document.createElement("img");
  icon.className = "tile-icon";
  icon.src = site.icon;
  icon.alt = "";
  icon.onerror = () => { icon.style.opacity = "0"; };
  tile.appendChild(icon);

  const name = document.createElement("span");
  name.className = "tile-name";
  name.textContent = site.name;
  tile.appendChild(name);

  const fav = document.createElement("button");
  fav.type = "button";
  fav.className = "tile-fav" + (favorites.includes(site.id) ? " active" : "");
  fav.title = favorites.includes(site.id) ? "Remove from favorites" : "Add to favorites";
  fav.setAttribute("aria-pressed", favorites.includes(site.id) ? "true" : "false");
  fav.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
  fav.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(site);
  });
  tile.appendChild(fav);

  return tile;
}

function renderGrid() {
  siteGrid.innerHTML = "";
  allSites().forEach((site) => siteGrid.appendChild(makeTile(site)));
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
    window.location.href = url;
  }, wait);
}

window.addEventListener("pageshow", hideSpinner);

// ---------- Opening a site (direct navigation) ----------
function openSite(site) {
  showSpinner();
  const started = Date.now();

  browser.storage.local.set({
    lastUsed: { name: site.name, url: site.url, icon: site.icon }
  }).then(() => {
    navigate(site.url, started);
  }).catch(() => {
    hideSpinner();
  });
}

// ---------- Recently used ----------
function renderRecent(lastUsed) {
  if (!lastUsed || !lastUsed.url) {
    recentSection.classList.add("hidden");
    return;
  }
  recentIcon.src = lastUsed.icon;
  recentIcon.onerror = () => { recentIcon.style.opacity = "0"; };
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
  browser.storage.local.set({ favorites }).then(() => {
    renderGrid();
  });
}

// ---------- Init ----------
browser.storage.local.get(["lastUsed", "favorites"]).then((data) => {
  favorites = data.favorites || [];
  renderGrid();
  renderRecent(data.lastUsed);
});

