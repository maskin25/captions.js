FROM node:22-slim AS base
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ffmpeg \
      libcairo2-dev \
      libjpeg-dev \
      libpango1.0-dev \
      libgif-dev \
      libgl1-mesa-dev \
      xvfb \
      libxi-dev \
      libx11-dev \
      build-essential \
      g++ \
      python3 \
    && ln -sf python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

FROM base AS deps
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm config set inject-workspace-packages true
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @captionsjs/server build
RUN pnpm deploy --filter @captionsjs/server --prod /app/deploy
RUN cp -R packages/server/assets /app/deploy/assets

FROM base AS runner
ENV PORT=4000
WORKDIR /app
COPY --from=deps /app/deploy/ ./
EXPOSE 4000
ENTRYPOINT ["node", "dist/index.js"]
CMD []
