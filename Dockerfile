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

# Remove devDependencies before copying node_modules to runner
RUN pnpm prune --prod

FROM node:20-slim AS runner

WORKDIR /app

# pnpm uses relative symlinks inside node_modules — they survive multi-stage copy
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/landlord-recovery/dist/public ./artifacts/landlord-recovery/dist/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.mjs"]
