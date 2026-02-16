# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app

# erst deps für caching
COPY package*.json ./
# falls du workspaces nutzt: zusätzlich die jeweiligen package.json kopieren
RUN npm ci

# dann source
COPY ./src ./src
COPY ./web ./web
COPY ./scripts ./scripts
COPY vite.config.ts ./
COPY tsconfig*.json ./

# build (client + server + copy)
RUN npm run build


# ---- runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# nur prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# built output
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
