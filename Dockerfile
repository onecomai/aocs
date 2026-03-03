# AOCS - Lightweight AI Agent Swarm
# One-command deployment Dockerfile

FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

# Default: serve all agents
CMD ["node", "-e", "import('./src/index.js').then(m => m.serve(process.env.PORT || 3000))"]
