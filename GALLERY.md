# Gallery — As-Built Architecture & Operations

> **Status:** Source-of-truth for how the photo gallery *actually* works today (2026-06-18).
> The numbered design docs (`04_GALLERY_SYSTEM.md`, `05_DATABASE_SCHEMA.md`) describe an
> earlier, aspirational multi-tenant design (`gallery_albums`/`gallery_assets`, a Cloudflare
> Worker). **That is not what is deployed.** Read this file for reality; treat the numbered
> docs as background.

---

## 1. Big picture

The gallery is a standalone **Next.js 14 app** living in [`gallery/`](./gallery). It reads album
and photo metadata from Supabase and renders branded, private photo albums. It is served at
**two entry points from one codebase**:

| Surface | URL shape | Use case | Build |
|---|---|---|---|
| **Event-context gallery** *(default)* | `events.cloudpeers.com/gallery/a/<albumId>` | Albums shown **inside an event's** experience | basePath `'/gallery'` |
| **Standalone gallery** *(opt-in)* | `gallery.cloudpeers.com/a/<albumId>` | Albums **not tied to a single event**, or spanning multiple events | basePath `''` |

### Why two deploys (not one)

Next.js bakes `basePath` at **build time**, so a single build cannot serve clean URLs at both a
bare domain root *and* a `/gallery` subpath. We therefore build the **same source** twice with a
different `GALLERY_BASE_PATH` env var. You can run **either or both** — deploy only the surface(s)
you need.

```
                       ┌─────────────────────────────┐
  gallery.cloudpeers.com ─────────────────────────────▶│ gallery (build: GALLERY_BASE_PATH='')   │  Cloud Run
                                                        └─────────────────────────────┘
                       ┌──────────────────────┐   rewrite /gallery/* ┌─────────────────────────────┐
  events.cloudpeers.com │ creator-portal app   │ ───────────────────▶ │ gallery (build: '/gallery') │  Cloud Run
  /gallery/*           │ (cloudpeers-events)  │   GALLERY_ORIGIN      └─────────────────────────────┘
                       └──────────────────────┘
```

`creator-portal/` **is** `events.cloudpeers.com`. It proxies `/gallery/*` to the event-context
gallery build via a Next.js `rewrites()` rule (`creator-portal/next.config.js`), so no Cloudflare
worker or load balancer is needed (events.cloudpeers.com is fronted directly by Google Cloud Run).

---

## 2. Where the data and photos live

- **Metadata** (albums + photo records): Supabase project **`efpspxzgvbsqfyelbkdw`** (efps — the
  shared cloudpeers DB), tables **`albums`** and **`assets`**:
  - `albums`: `id`, `title`, `description`, `is_private`, `settings` (JSONB, incl. theme), `created_at`
  - `assets`: `id`, `album_id`, `type` (`image`|`video`), `provider_id`, `provider` *(optional, new)*,
    `original_filename`, `width`, `height`, …
- **Photo binaries**: stored by a **storage provider**, NOT in Supabase or this repo.
  - Today: **Cloudflare Images** (delivery hash `FhizCHnEg5H49vwsYLeUJw`). `assets.provider_id` is the
    Cloudflare image ID; delivery URL = `https://imagedelivery.net/<hash>/<provider_id>/<variant>`.
  - Future: other providers (e.g. **Google Cloud Storage**) — see §3.

### Example album (seoul / "Bruno's")

The reference album is **`ffd8e9fc-cea4-4c8c-9918-9af167a7304d`** — "Seoul Event - September 27,
2025", 60 Cloudflare-Images photos. It already exists in efps and renders through this app
unchanged. (It also still exists in a *separate* DB `tzpdcueumsjxquyumtbg` behind
`seoul.redheli.com/gallery`, served by the older `bruno-gallery` Cloud Run service in heli-ent —
both point at the **same** Cloudflare Images binaries.)

---

## 3. Provider-agnostic photo URLs (important)

Photo URLs are **not** hardcoded to Cloudflare. All URL building goes through
[`gallery/src/lib/photoUrl.ts`](./gallery/src/lib/photoUrl.ts):

```ts
getAssetUrl(asset, variant='public')   // full image / video manifest
getThumbUrl(asset)                      // grid thumbnail
```

It switches on `asset.provider` (defaults to `cloudflare-images` when the column/value is absent,
so existing rows keep working):

| `provider` | URL |
|---|---|
| `cloudflare-images` (default) | `https://imagedelivery.net/$NEXT_PUBLIC_CF_IMAGES_HASH/<provider_id>/<variant>` |
| `cloudflare-stream` | `https://videodelivery.net/<provider_id>/manifest/video.m3u8` |
| `gcs` | a **signed** URL via `gallery/src/lib/gcsSignedUrls.ts` (`provider_id` = GCS object path) |

The **assets API** (`gallery/src/app/api/albums/[albumId]/assets/route.ts`) computes `url` and
`thumbUrl` **server-side** per asset (so GCS signing works) and returns them on each item.
`AlbumViewer.tsx` renders `a.thumbUrl || a.url` (with a Cloudflare fallback for older responses).

**Adding a non-Cloudflare album:** set each asset's `provider` (e.g. `gcs`) and `provider_id`
(the object path). Run the migration that adds the column:
[`gallery/migrations/add-provider-column.sql`](./gallery/migrations/add-provider-column.sql)
(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'cloudflare-images';` — safe,
backward-compatible). For `gcs`, set `GCS_BUCKET_NAME` (+ creds / Workload Identity) on the gallery
service.

---

## 4. Access control (per-album)

Gating is per-album, driven by `albums.is_private`:

- `is_private = false` → **public**: anyone with the link renders the album.
- `is_private = true` → **magic-link**: viewer must sign in; the gallery checks event
  registrations by email (Supabase Auth OTP). The seoul album is `is_private = true` today.

---

## 5. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `GALLERY_BASE_PATH` | gallery **build** | `''` for gallery.cloudpeers.com, `'/gallery'` for the events proxy build. **Must be a build arg** (Next bakes basePath at build time). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | gallery | efps Supabase (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | gallery (secret) | efps service role (server) |
| `NEXT_PUBLIC_CF_IMAGES_HASH` | gallery build | `FhizCHnEg5H49vwsYLeUJw` (Cloudflare Images delivery hash) |
| `GCS_BUCKET_NAME` (+ creds) | gallery | only when serving `gcs`-provider assets |
| `NEXT_PUBLIC_APP_URL` | gallery | public origin for auth callbacks — must match the surface (`https://gallery.cloudpeers.com` or `https://events.cloudpeers.com/gallery`) |
| `GALLERY_ORIGIN` | **creator-portal** | URL of the event-context gallery Cloud Run service (target of the `/gallery/*` rewrite) |
| `NEXT_PUBLIC_EVENTS_PUBLIC_BASE` | gallery (optional) | base of the Events published-projection route; default `https://events.cloudpeers.com/api/events/public` (link-back, §9) |
| `NEXT_PUBLIC_LAB_COMPOSE_URL` | gallery (optional) | the lab the link-back points at; default `https://cloudpeers.com/labs/ai-human-spaces` (§9) |

---

## 6. Deploy

The gallery has its own build pipeline that **reuses the events.cloudpeers.com approach** —
`gallery/Dockerfile` + `gallery/cloudbuild.yaml` + `gallery/scripts/deploy.sh`, modeled on the root
creator-portal ones (Cloud Build → GCR → Cloud Run on **heli-ent / us-central1**, runtime SA
`cloudpeers-deployer`, `NEXT_PUBLIC_*` baked as build args, service-role injected at runtime,
traffic forced to latest). `GALLERY_BASE_PATH` and `NEXT_PUBLIC_CF_IMAGES_HASH` are passed as
**build** args.

**Default = the events surface only.** The standalone `gallery.cloudpeers.com` surface is **opt-in**.

```bash
cd gallery

# DEFAULT — events.cloudpeers.com/gallery (service cloudpeers-gallery-events, basePath '/gallery')
./scripts/deploy.sh                 # == ./scripts/deploy.sh events
# then point the events app at it (set GALLERY_ORIGIN to the printed URL, redeploy creator-portal):
cd .. && GALLERY_ORIGIN=https://cloudpeers-gallery-events-XXXX-uc.a.run.app ./deploy.sh staging

# OPT-IN — standalone gallery.cloudpeers.com (service cloudpeers-gallery, basePath '')
cd gallery && ./scripts/deploy.sh root
#   then map the domain:
#   gcloud beta run domain-mappings create --service=cloudpeers-gallery \
#     --domain=gallery.cloudpeers.com --region=us-central1 --project=heli-ent
```

> **First-build validation:** the pipeline mirrors the proven creator-portal build but has not been
> run yet — validate the first `./scripts/deploy.sh` (events) build, which exercises the npm-workspace
> standalone output paths, before relying on it.

The existing `bruno-gallery` service is the separate seoul/tzpd backend for `seoul.redheli.com/gallery`
— it is independent of these services; leave it running.

---

## 7. Known gaps / TODO before production

- [x] Gallery build pipeline authored (`gallery/Dockerfile`, `gallery/cloudbuild.yaml`,
      `gallery/scripts/deploy.sh`) reusing the events approach. **Needs first-build validation.**
- [x] Run `cd gallery && ./scripts/deploy.sh events` — **done 2026-08-21** (`cloudpeers-gallery-events-00006`); creator-portal's `deploy.sh` resolves `GALLERY_ORIGIN` from the live service at deploy time and was redeployed the same day (`cloudpeers-events-staging-00016`), so `events.cloudpeers.com/gallery/*` proxies here. (Opt-in only: `./scripts/deploy.sh root` + map `gallery.cloudpeers.com`.)
- [ ] Run `gallery/migrations/add-provider-column.sql` on efps **when** the first non-Cloudflare
      (GCS) album is added (not required for seoul/Cloudflare).
- [ ] **Auth across the rewrite:** `NEXT_PUBLIC_APP_URL` is set per surface by deploy.sh; validate
      magic-link callbacks under `events.cloudpeers.com/gallery`.
- [ ] **Admin pages** (`gallery/src/app/admin/*`) use root-absolute `fetch('/api/...')` which Next
      does **not** auto-prefix — they break under the `/gallery` basePath build. They work on the
      opt-in clean-root build; fix the fetches if admin must run under `/gallery` too.
- [ ] Decide seoul album visibility: it's `is_private=true` (login required). Flip to public in efps
      if you want it open as a public example.

---

## 8. Code map (what changed for dual-deploy)

Branch `feat/gallery-dual-deploy`:

- `gallery/next.config.mjs` — `basePath`/`assetPrefix` from `GALLERY_BASE_PATH`.
- `gallery/src/lib/photoUrl.ts` *(new)* — provider-aware `getAssetUrl` / `getThumbUrl`.
- `gallery/src/app/api/albums/[albumId]/assets/route.ts` — returns server-computed `url`/`thumbUrl`.
- `gallery/src/components/AlbumViewer.tsx` — renders `a.thumbUrl || a.url` (Cloudflare fallback).
- `gallery/src/app/api/download/[assetId]/route.ts` — provider-aware download.
- `gallery/migrations/add-provider-column.sql` *(new)* — optional `provider` column.
- `creator-portal/next.config.js` — `rewrites()` proxying `/gallery/*` → `GALLERY_ORIGIN`.
- `gallery/next.config.mjs` — `experimental.outputFileTracingRoot` (workspace standalone nesting).
- `gallery/Dockerfile`, `gallery/cloudbuild.yaml`, `gallery/scripts/deploy.sh` *(new)* — build/deploy
  pipeline reusing the events approach (default `events`, opt-in `root`).

---

## 9. Link-back to the lab — "the story continues" (2026-08-21)

An album linked to an event (`albums.event_id` = `events.id`) shows, above the attendee list:

> **The story continues —** compose a scene at *<event title>* — your moment anchors where it happened and joins what others shared.

**Only when the host published the event.** `AlbumViewer` fetches `${NEXT_PUBLIC_EVENTS_PUBLIC_BASE}/${album.event_id}`; the Events service answers with the published projection (title · date · venue · coordinate · links; never address/password/guests) **only** if the host ticked *Publish this event to cloudpeers services* — otherwise 404 (indistinguishable from nonexistent), and the block is not rendered. The link goes to `${NEXT_PUBLIC_LAB_COMPOSE_URL}?event=<slug>`; the lab reads the same projection and offers "Compose at <event>" (Tesseract). Model: StoryCorps → Library of Congress — curated by the people who were there, credited to everyone in it, kept beyond the app. Contract: `08_PUBLISHING_TO_SERVICES.md`.
