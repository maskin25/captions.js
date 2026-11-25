# captions.js + React (Next.js App Router)

A server-rendered page that converts the transcript on the server and hands it to
a client component with `<Captions>`.

```bash
pnpm install
pnpm --filter captions.js --filter @captionsjs/react build
pnpm --filter example-react-next dev
```

`pnpm --filter example-react-next test` runs `next build`, starts the app and
checks the page in headless Chromium (`npx playwright install chromium` once).
