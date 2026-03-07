FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY . .
RUN corepack pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app /app
RUN corepack pnpm --filter @zervia/api build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000

# Keep the full workspace layout so pnpm-linked runtime dependencies
# resolve correctly inside the container.
COPY --from=builder /app /app

EXPOSE 4000
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
