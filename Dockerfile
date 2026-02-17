# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++ linux-headers

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

RUN apk add --no-cache python3 make g++ linux-headers

# nur prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# built output
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["dist/main.js"]
