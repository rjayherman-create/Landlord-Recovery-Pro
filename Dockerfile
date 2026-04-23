FROM node:20-slim

# Build-time args for Vite — set these as Build Variables in Railway
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_PROXY_URL

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json .npmrc ./

COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/landlord-recovery/ artifacts/landlord-recovery/

RUN pnpm install --no-frozen-lockfile

# Expose build args as env vars so Vite can read them during the frontend build
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PROXY_URL=$VITE_CLERK_PROXY_URL

RUN BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/landlord-recovery run build

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.mjs"]
