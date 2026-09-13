FROM oven/bun:latest

WORKDIR /app

# Copy root and package manifests
COPY package.json tsconfig.json bun.lock ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies
RUN bun install --frozen-lockfile

EXPOSE 3001

ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["bun", "run", "apps/remote-mcp/src/index.ts"]
