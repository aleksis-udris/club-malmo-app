# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- run ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "dist/main.js"]
