FROM node:20

WORKDIR /app

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

WORKDIR /app
COPY . .

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "server.js"]