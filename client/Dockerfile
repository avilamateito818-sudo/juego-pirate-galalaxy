# Multi-stage production build for @starcorsair/client (Nginx + WebSocket proxy)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY shared/ shared/
COPY client/ client/
RUN npm run build -w @starcorsair/shared
RUN npm run build -w @starcorsair/client

FROM nginx:1.27-alpine AS runner
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
