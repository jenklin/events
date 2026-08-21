# 08 — Publishing an event to cloudpeers services (the contract)
**Version:** 1.0 — 2026-08-21 · **Applies to:** creator-portal (`lib/eventSchema.ts` `dateLocation.plusCode` · `dateLocation.publishToServices`; `lib/publishedEvent.ts`; `app/api/events/public/[slug]/route.ts`; webhook capability `get_event`) and the gallery link-back (`gallery/src/components/AlbumViewer.tsx`)
**Model:** publishing is the host deliberately contributing a curated, consented, credited record of the event to a shared memory — StoryCorps → Library of Congress, not a post. Platform canon: `cloudpeers-github/docs/architecture/PROMOTE_AND_PRESERVE_MOMENTS_2026-08-21.md` §1b–1c · messaging: `cloudpeers-github/docs/brand/CREATE_CURATE_PUBLISH_2026-08-21.md`.

## What "publish" means
**Off by default.** Nothing about an event is readable by any cloudpeers service, lab, or agent until the host ticks **Publish this event to cloudpeers services** in Date & Location. The host can un-tick it at any time; the projection disappears on the next read.

### What it releases — the published projection (read-only)
| Field | Source | Notes |
|---|---|---|
| `slug` | `events.event_id` | the URL slug |
| `title` | `events.title` | |
| `date`, `startTime`, `endTime`, `timezone` | `config.dateLocation` | the date is context for consumers, never a gate — scenes compose before, during, after |
| `venueName` | `config.dateLocation.venueName` | **omitted** when *Hide location until RSVP* is on |
| `plusCode`, `coordinates` | `config.dateLocation.plusCode` → decoded offline (`lib/plusCode.ts`, Open Location Code; never a geocoding API) | **omitted** when *Hide location until RSVP* is on, or when no Plus Code was entered |
| `customDomain`, `eventUrl` | `events.custom_domain` / `config.customDomain`; `getPublicEventUrl` | |
| `galleryUrl` | `event_summary.gallery_url` | where the story continues after the date |
| `published: true` | — | the only state in which a response exists |

### What it never releases
Address · password · guest list · RSVPs · photos · any `config` section other than the fields above. These are not "hidden fields" — they are not part of the projection at all.

### Hide location until RSVP
The host's privacy choices compose. If *Hide location until RSVP* is on, the projection carries **title, date/times, and links only** — no venue name, no Plus Code, no coordinate — even when publishing is on.

### Existence is not confirmed
`GET /api/events/public/<slug|custom_domain|uuid>` and `get_event` return **404 `{ "error": "Event not found" }` for an unpublished event exactly as for a nonexistent one.** Lookup accepts the slug, the custom domain, or the row uuid (what the gallery's `albums.event_id` carries).

## Who reads it, and what that enables (the "promote" half)
- **Experience Labs — Tesseract** (`cloudpeers.com/labs/ai-human-spaces`): lists published events with a coordinate as **"Compose at <event>"**; a guest's scene anchors at the venue; deep link `?event=<slug|domain|uuid>` from anywhere. If no coordinate is published, the event is not offered (no geocoding, no guessing).
- **The gallery** (`cloudpeers-gallery-events`): an album linked to a published event shows **"The story continues — compose a scene at <event>"**; curated by the people who were there, credited to everyone in it, kept beyond the app.
- **Governed agents / Peer Spaces:** an agent may anchor the venue by reading `get_event` (registered on the cloudpeers registry as `cloudpeers-events:get_event`, read-only).
- **Other services:** same projection, same rules — no service receives more than this, and none receives it unless the host published.

## How to publish (host, creator portal)
1. Date & Location → **Venue Plus Code** (Google Maps → the venue → Share → *Plus code*; a full code like `8Q98HXCR+2X`).
2. Tick **Publish this event to cloudpeers services**. (Leave *Hide location until RSVP* on if you want the date and links public but the venue private.)
3. Save. Verify: `curl https://events.cloudpeers.com/api/events/public/<slug>` returns the projection; un-tick to withdraw (returns 404 again).

## What this is not
Not a post, not a feed, not ranking, not "discoverable by default," not "we now hold it." Curation stays with the host and the people who were there; cloudpeers supplies the catalogue (attribution, registry), the archive (gallery, owned artifacts), and the edges (labs, spaces) — and credits every voice.

---
*Deployed 2026-08-21 (`cloudpeers-events-staging`, serving events.cloudpeers.com and custom event domains; registry seed `get_event` on mcp-staging). Changes to the projection's field list require updating this doc, the form copy, and the registry seed together.*
