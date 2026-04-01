FROM node:20

WORKDIR /app

COPY artifacts/api-server/package.json ./package.json
RUN npm install express

COPY artifacts/api-server/server.js ./server.js

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
