FROM node:22-bookworm-slim

WORKDIR /app

# Copy only what's needed to run
COPY package.json ./
COPY dist/ ./dist/

# Install only production runtime deps (no devDeps, no build)
RUN npm install --production --no-optional --ignore-scripts 2>/dev/null || \
    npm install --production --ignore-scripts

ENV NODE_ENV=production
ENV PORT=8080
ENV OPENCLAW_GATEWAY_PORT=8080
ENV OPENCLAW_STATE_DIR=/data/.openclaw
ENV OPENCLAW_WORKSPACE_DIR=/data/workspace

# Create data dirs
RUN mkdir -p /data/.openclaw /data/workspace

CMD ["node", "dist/index.js"]
