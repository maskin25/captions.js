# captions.js + React (Vite)

`<Captions>` over a video, under StrictMode, with a style picker.

```bash
pnpm install
pnpm --filter captions.js --filter @captionsjs/react build
pnpm --filter example-react-vite dev
```

`pnpm --filter example-react-vite test` builds the app and checks it in headless
Chromium (`npx playwright install chromium` once).
