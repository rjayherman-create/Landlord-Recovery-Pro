FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY .npmrc .npmrc

COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/landlord-recovery/ artifacts/landlord-recovery/

RUN pnpm install --no-frozen-lockfile

# Build the landlord-recovery frontend at root base path for production
RUN BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/landlord-recovery run build

# Build the API server
RUN pnpm --filter @workspace/api-server run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

# Copy workspace manifests so pnpm can resolve the workspace graph
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY lib/package.json lib/package.json
COPY artifacts/api-server/package.json artifacts/api-server/package.json

# Install only production deps — fresh store in runner, no broken symlinks
RUN pnpm install --prod --no-frozen-lockfile

# Copy built output from builder
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/landlord-recovery/dist/public ./artifacts/landlord-recovery/dist/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.mjs"]
