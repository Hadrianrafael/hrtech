FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @hrtech/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @hrtech/api prisma:generate
RUN pnpm turbo run build --filter=@hrtech/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S hrtech && adduser -S hrtech -G hrtech
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
USER hrtech
EXPOSE 3001
CMD ["node", "dist/main.js"]
