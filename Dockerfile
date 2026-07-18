# Âme Sœur — image de production
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production PORT=3000 DB_PATH=/app/data/amesoeur.db
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "--experimental-sqlite", "server/server.js"]
