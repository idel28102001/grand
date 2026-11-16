FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run typeorm migration:run -- -d src/database/data-source.ts && node dist/main"]
