FROM node:20-slim AS base
ENV NODE_ENV=production
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --include=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runner
ENV PORT=4000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dist ./dist
COPY package.json ./
EXPOSE 4000
ENTRYPOINT ["node", "dist/index.js"]
CMD []
