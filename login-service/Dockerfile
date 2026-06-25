FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN node node_modules/prisma/build/index.js generate
RUN node node_modules/typescript/bin/tsc


FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]