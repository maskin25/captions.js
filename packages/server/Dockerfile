# Multi-arch image (linux/amd64 + linux/arm64). Build from the repo root:
#   docker buildx build --platform linux/amd64,linux/arm64 \
#     -f packages/server/Dockerfile -t maskin25/captions.js-render --push .
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter "@captionsjs/server..."
RUN pnpm --filter captions.js build \
 && pnpm --filter @captionsjs/server build \
 && pnpm deploy --filter @captionsjs/server --prod /app/deploy \
 && cp -R packages/server/assets /app/deploy/assets

FROM base AS runner
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates fontconfig \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=4000 \
    CAPTIONSJS_CACHE_DIR=/tmp/captionsjs
WORKDIR /app
COPY --from=build /app/deploy/ ./
USER node
EXPOSE 4000
LABEL org.opencontainers.image.title="captions.js render" \
      org.opencontainers.image.description="Burn captions.js animated word-level captions into video with FFmpeg" \
      org.opencontainers.image.source="https://github.com/maskin25/captions.js" \
      org.opencontainers.image.licenses="MIT"
# no args → HTTP service on $PORT; `burn …` / `presets` → CLI
ENTRYPOINT ["node", "dist/index.js"]
CMD []
