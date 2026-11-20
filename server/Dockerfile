# Multi-stage production build for @starcorsair/server (non-root)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY shared/ shared/
COPY server/ server/
RUN npm run build -w @starcorsair/shared
RUN npm run prisma:generate -w @starcorsair/server
RUN npm run build -w @starcorsair/server

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules ./node_modules

USER appuser
EXPOSE 2567

CMD ["node", "server/dist/index.js"]
