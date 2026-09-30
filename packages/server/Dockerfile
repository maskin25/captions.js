# Multi-arch image (linux/amd64 + linux/arm64). Build from the repo root:
#   docker buildx build --platform linux/amd64,linux/arm64 \
#     -f packages/server/Dockerfile -t maskin25/captions.js-render --push .
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

# 1. Compile TypeScript once, natively on the build machine: the JS output is
#    the same for every architecture, and tsup/esbuild are slow and flaky under
#    QEMU/Rosetta emulation.
FROM --platform=$BUILDPLATFORM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter "@captionsjs/server..."
RUN pnpm --filter captions.js build && pnpm --filter @captionsjs/server build

# 2. Install production dependencies for the *target* architecture
#    (skia-canvas ships a native binary per platform). No compilation here.
FROM base AS deploy
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/server/dist ./packages/server/dist
RUN pnpm deploy --filter @captionsjs/server --prod /app/deploy \
 && cp -R packages/server/assets /app/deploy/assets

FROM base AS runner
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates fontconfig \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=4000 \
    CAPTIONSJS_CACHE_DIR=/tmp/captionsjs
WORKDIR /app
COPY --from=deploy /app/deploy/ ./
USER node
EXPOSE 4000
LABEL org.opencontainers.image.title="captions.js render" \
      org.opencontainers.image.description="Burn captions.js animated word-level captions into video with FFmpeg" \
      org.opencontainers.image.source="https://github.com/maskin25/captions.js" \
      org.opencontainers.image.licenses="MIT"
# no args → HTTP service on $PORT; `burn …` / `presets` → CLI
ENTRYPOINT ["node", "dist/index.js"]
CMD []
