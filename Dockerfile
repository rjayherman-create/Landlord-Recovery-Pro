FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY .npmrc .npmrc

COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/property-tax-grievance/ artifacts/property-tax-grievance/

RUN pnpm install --no-frozen-lockfile

RUN BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/property-tax-grievance run build

RUN pnpm --filter @workspace/api-server run build

RUN rm -rf artifacts/api-server/public && \
    mkdir -p artifacts/api-server/public && \
    cp -r artifacts/property-tax-grievance/dist/public/* artifacts/api-server/public/

# Bundle production deps (pdfkit etc.) into a standalone folder — no devDeps, no symlinks
RUN pnpm --filter @workspace/api-server deploy --prod /tmp/api-deploy

FROM node:20-slim AS runner

WORKDIR /app

# Runtime node_modules: pdfkit and any other packages that cannot be bundled
COPY --from=builder /tmp/api-deploy/node_modules ./node_modules

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/public ./artifacts/api-server/public

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.mjs"]
