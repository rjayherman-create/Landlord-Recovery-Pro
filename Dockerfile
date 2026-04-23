FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json .npmrc ./

COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/landlord-recovery/ artifacts/landlord-recovery/

RUN pnpm install --no-frozen-lockfile

RUN BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/landlord-recovery run build

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.mjs"]
