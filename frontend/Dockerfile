# ==================== Stage 1: Build ====================
FROM node:20-alpine AS builder

WORKDIR /workspace

COPY package*.json ./
RUN npm install --frozen-lockfile=false

COPY . .

# Build the Next.js application for production
RUN npm run build

# ==================== Stage 2: Production Runner ====================
FROM node:20-alpine AS runner

WORKDIR /workspace

ENV NODE_ENV=production

# Copy only the necessary artifacts from the builder stage
COPY --from=builder /workspace/public ./public
COPY --from=builder /workspace/.next/standalone ./
COPY --from=builder /workspace/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
