FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i --omit=dev

COPY . .

ENV PORT=8081
EXPOSE 8081
CMD ["npm", "start"]