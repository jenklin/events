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
**GCP project:** `heli-ent` (us-central1) — consolidated off the personal gen-lang project on 2026-06-17 (runbook: `cloudpeers-mcp/mcp/docs/GEN_LANG_TO_HELI_ENT_MIGRATION_RUNBOOK_2026-06-17.md`).
```bash
gcloud config configurations activate heli-ent
npm run deploy:staging   # → cloudpeers-events-staging (heli-ent, = events.cloudpeers.com)
```
Runs as `cloudpeers-deployer@heli-ent`. Supabase URL/anon-key come from heli-ent `SUPABASE_URL`/`SUPABASE_ANON_KEY` (build-args, since Next.js bakes `NEXT_PUBLIC_*`), and the service-role key is injected at runtime as a secret — **not** baked into the image, and **not** the `VITE_*` names (those don't exist on heli-ent and caused the 2026-06-17 outage).

## ⚠️ Staging is prod
`events.cloudpeers.com` is mapped to `cloudpeers-events-staging`. `deploy:staging` ships user-visible changes. `deploy:prod` does **not** change the public domain — it deploys an idle sibling.

## Migrations
Apply manually via the Supabase SQL Editor. Do not run `npx supabase db push`.
