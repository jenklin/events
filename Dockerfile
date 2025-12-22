# Custom Events - CloudPeers MCP Service
# Next.js 14 App Router + Supabase + QR Generation
# Cloud Run deployment

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace root package files (required for npm workspaces)
COPY package*.json ./
COPY creator-portal/package*.json ./creator-portal/
RUN npm ci --workspace=creator-portal --include-workspace-root

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Copy workspace node_modules (includes creator-portal dependencies)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/creator-portal/node_modules ./creator-portal/node_modules
COPY creator-portal ./creator-portal
WORKDIR /app/creator-portal

# Build args for environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# For workspace standalone builds, Next.js nests output under workspace name
# Copy root standalone structure
COPY --from=builder --chown=nextjs:nodejs /app/creator-portal/.next/standalone ./
# Copy creator-portal workspace files on top
COPY --from=builder --chown=nextjs:nodejs /app/creator-portal/.next/standalone/creator-portal ./creator-portal
# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/creator-portal/.next/static ./creator-portal/.next/static
# Copy public files (may be empty)
COPY --from=builder --chown=nextjs:nodejs /app/creator-portal/public ./creator-portal/public

# Set working directory to the workspace app
WORKDIR /app/creator-portal

USER nextjs

EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
