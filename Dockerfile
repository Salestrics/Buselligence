FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY cli/package*.json ./cli/

RUN npm install && \
    npm install --prefix client && \
    npm install --prefix server && \
    npm install --prefix cli

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache curl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/dist ./client/dist

RUN mkdir -p /app/server/data && chown -R node:node /app
USER node

VOLUME ["/app/server/data"]

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server/dist/index.js"]
