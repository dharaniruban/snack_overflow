FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health >/dev/null 2>&1 || exit 1

# Migrations and seed are idempotent; safe to run on every container start.
CMD ["sh", "-c", "npm run migrate && npm run seed && node dist/server.js"]
