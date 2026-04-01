FROM node:20

WORKDIR /app

RUN npm install express

COPY artifacts/api-server/server.js ./server.js

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
