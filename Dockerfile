FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY lib/ lib/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/property-tax-grievance/package.json artifacts/property-tax-grievance/

RUN pnpm install --frozen-lockfile

COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/property-tax-grievance/ artifacts/property-tax-grievance/

RUN pnpm --filter @workspace/db run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-zod run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-client-react run build 2>/dev/null || true

RUN BASE_PATH=/ PORT=3000 NODE_ENV=production \
    pnpm --filter @workspace/property-tax-grievance run build

RUN pnpm --filter @workspace/api-server run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/property-tax-grievance/dist/public ./public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
