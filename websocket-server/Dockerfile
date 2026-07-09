FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Expose ports
# 3001: Internal HTTP API (Next.js → WebSocket)
# 3002: Public WebSocket (Client → WebSocket)
EXPOSE 3001 3002

# Run the server
CMD ["node", "dist/index.js"]
