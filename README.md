# AI Sidebar (Firefox extension)

Open ChatGPT, Claude, Gemini, DeepSeek, Kimi, Qwen, Z.ai, AI Studio,
Microsoft Copilot, Duck.ai, Mistral, and more — directly in Firefox's sidebar.

## How it works

- The sidebar opens on a landing page with a grid of big AI tiles (icon +
  name) and a "Recently used" card.
- Click a tile and the sidebar navigates straight to that site (no `<iframe>`,
  no header modification). Re-open the sidebar to return to the landing page.

## Permissions this extension requests

- `storage` — remembers your favorites and the site you last used.

That's it. No `webRequest`, no host permissions, no `<all_urls>`. The extension
never reads or modifies any network traffic, cookies, credentials, prompts,
responses, or page content — it just navigates the sidebar to the site you tap.

No analytics, no telemetry, no data leaves your machine other than the
requests your browser makes to whichever AI site you select.