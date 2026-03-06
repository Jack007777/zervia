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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 4000
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
