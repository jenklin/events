# CloudPeers Gallery — Next.js 14 App Router + Supabase (efps) + Cloudflare Images / GCS
# Dual-deploy app (gallery.cloudpeers.com + events.cloudpeers.com/gallery).
# Mirrors the root creator-portal Dockerfile but builds the `gallery` workspace.
# Build context = repo ROOT (npm workspaces):  docker build -f gallery/Dockerfile .
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Workspace root package files (required for npm workspaces)
COPY package*.json ./
COPY gallery/package*.json ./gallery/
RUN npm ci --workspace=gallery --include-workspace-root

# Build the source
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/gallery/node_modules ./gallery/node_modules
COPY gallery ./gallery
WORKDIR /app/gallery

# NEXT_PUBLIC_* are baked at build time. GALLERY_BASE_PATH selects the surface
# ('' = clean root for gallery.cloudpeers.com, '/gallery' = events proxy build).
# The service-role key is NOT baked — injected at runtime as a secret (deploy step).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CF_IMAGES_HASH
ARG GALLERY_BASE_PATH
# NEXT_PUBLIC_APP_URL must be a BUILD arg — Next inlines NEXT_PUBLIC_* at build time
# (server AND client). If unset at build it bakes the seoul.redheli.com fallback and
# /gallery + login/magic-link links point at the wrong host.
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_CF_IMAGES_HASH=$NEXT_PUBLIC_CF_IMAGES_HASH
ENV GALLERY_BASE_PATH=$GALLERY_BASE_PATH
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Workspace standalone output nests under the workspace name because
# next.config sets experimental.outputFileTracingRoot to the repo root.
COPY --from=builder --chown=nextjs:nodejs /app/gallery/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/gallery/.next/standalone/gallery ./gallery
COPY --from=builder --chown=nextjs:nodejs /app/gallery/.next/static ./gallery/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/gallery/public ./gallery/public

WORKDIR /app/gallery
USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
