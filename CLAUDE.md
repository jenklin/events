# CLAUDE.md — events

**events.cloudpeers.com** — Events platform. Two sub-apps plus a static page generator.

Parent docs (read these first): `~/dev/cloudpeers-mcp/CLAUDE.md` and `~/dev/CLAUDE.md`.

## Layout
- `creator-portal/` — Next.js app for organizers
- `gallery/` — Next.js app for browsing/discovery
- `event-pages/generator/` — static page generator (`tsx generate.ts`)

Shared Supabase: `efpspxzgvbsqfyelbkdw`.

## Dev
```bash
npm run install:all      # installs root + creator-portal
npm run dev:portal       # creator-portal/
npm run dev:gallery      # gallery/
npm run typecheck        # creator-portal tsc --noEmit
npm run generate:event   # event-pages generator
npm run generate:example # generator with example config
```

## Deploy
**GCP project:** `gen-lang-client-0243928474` (us-west1). Activate the right config first:
```bash
gcloud config configurations activate cloudpeers-gen
npm run deploy:staging   # → cloudpeers-events-staging (= events.cloudpeers.com)
```

## ⚠️ Staging is prod
`events.cloudpeers.com` is mapped to `cloudpeers-events-staging`. `deploy:staging` ships user-visible changes. `deploy:prod` does **not** change the public domain — it deploys an idle sibling.

## Migrations
Apply manually via the Supabase SQL Editor. Do not run `npx supabase db push`.
