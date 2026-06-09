# Discord User Activity Notifier

A local Manifest V3 Chromium extension that watches messages already rendered in Discord Web and creates desktop notifications for configured users.

## Privacy boundary

This extension is read-only. It does not read Discord cookies, collect auth tokens, connect to the Discord Gateway, call undocumented Discord APIs, send messages, add reactions, or scrape channels the user has not opened.

All tracking settings are stored locally in `chrome.storage.local`. Recently notified message IDs are stored in `chrome.storage.session` so duplicate prevention survives Manifest V3 service worker restarts during the current browser session.

## Permissions

- `storage`: persists local settings and session duplicate-prevention state.
- `notifications`: creates Chromium desktop notifications.
- `offscreen`: hosts a local offscreen document for user-selected Web Audio alert sounds.
- `https://discord.com/channels/*`: runs the isolated content script on Discord Web channel pages only.

The extension intentionally does not request `cookies`, `webRequest`, `debugger`, or `<all_urls>`.

## Development

Install dependencies:

```bash
pnpm install
```

Run checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Build output is written to `dist/`.

## Load unpacked

1. Run `pnpm build`.
2. Open a Chromium-based browser such as Chrome, Edge, or Brave.
3. Visit `chrome://extensions`.
4. Enable Developer mode.
5. Choose **Load unpacked** and select the generated `dist/` folder.
6. Open Discord Web at `https://discord.com/channels/...`.
7. Open the extension Options page to add tracked users.

## Build strategy

The project uses separate Vite builds:

- React pages: `options.html` and `popup.html` may use normal hashed assets.
- Content script: `src/content/observer.ts` builds to single-file `content.js`.
- Background service worker: `src/background/service-worker.ts` builds to single-file `service-worker.js`.

This keeps the MV3 content script and service worker free of split chunks and dynamic imports.

## Parser fixtures

Parser tests use sanitized HTML snippets under unit tests. Do not add real private Discord conversations to fixtures.
