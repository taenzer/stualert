FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i

COPY ./src ./src

EXPOSE 8081
CMD ["npm", "start"]