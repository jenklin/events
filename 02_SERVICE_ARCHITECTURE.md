# Event Management Service - Architecture

## System Overview

The Events Platform consists of two main components:

1. **Event Landing Pages** - Static HTML templates with Alpine.js interactivity
2. **Gallery System** - Next.js 14 app with Supabase authentication

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CloudPeers MCP Layer                         │
│  - Service discovery                                            │
│  - Webhook routing                                              │
│  - Metrics collection                                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│              Events Platform Service                            │
│  https://events.redheli.com                                     │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────────┐         │
│  │ Event Generator  │         │   Gallery System     │         │
│  │   (Node.js)      │         │    (Next.js 14)      │         │
│  │                  │         │                      │         │
│  │ - Template       │         │ - Magic link auth    │         │
│  │   rendering      │         │ - Album viewer       │         │
│  │ - Config parser  │         │ - Photo uploads      │         │
│  │ - QR generation  │         │ - Cloudflare proxy   │         │
│  └──────┬───────────┘         └──────────┬───────────┘         │
│         │                                 │                     │
└─────────┼─────────────────────────────────┼─────────────────────┘
          │                                 │
          │                                 │
┌─────────▼─────────────────────────────────▼─────────────────────┐
│                      Supabase Backend                           │
│  - PostgreSQL database                                          │
│  - Auth (Magic Links)                                           │
│  - Edge Functions (Email)                                       │
│                                                                  │
│  Tables:                                                        │
│  - events_registrations                                         │
│  - gallery_albums                                               │
│  - gallery_assets                                               │
│  - beta_users (legacy integration)                              │
│  - hover_users (legacy integration)                             │
└─────────────────────────────────────────────────────────────────┘
          │                                 │
┌─────────▼───────────┐         ┌──────────▼──────────┐
│  Cloudflare Images  │         │  Email Service      │
│  - Photo storage    │         │  - Confirmations    │
│  - CDN delivery     │         │  - Magic links      │
└─────────────────────┘         └─────────────────────┘
```

## Core Components

### 1. Event Generator Service

**Location**: `/event-generator`
**Runtime**: Node.js 18+
**Purpose**: Generate event landing pages from templates

**Files**:
```
event-generator/
├── generate-event.js        # Main generator script
├── template.html            # HTML template with placeholders
├── configs/                 # Event configurations
│   └── {city}-event-config.json
└── output/                  # Generated event pages
    └── {city}-index.html
```

**Key Features**:
- Template-based HTML generation
- Placeholder replacement system
- QR code generation
- Calendar integration (Google Calendar, .ics)
- Supabase registration integration

**API Endpoints** (to be created):
```typescript
POST /api/events/generate
  Body: { eventConfig: EventConfig }
  Response: { eventId, eventUrl, qrCodeUrl }

GET /api/events/:eventId
  Response: { event: EventData }

PUT /api/events/:eventId
  Body: { updates: Partial<EventConfig> }
  Response: { event: EventData }

DELETE /api/events/:eventId
  Response: { success: boolean }
```

### 2. Gallery System

**Location**: `/gallery`
**Runtime**: Next.js 14 (App Router)
**Purpose**: Private photo galleries with authentication

**Directory Structure**:
```
gallery/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── send-magic-link/route.ts
│   │   │   │   └── callback/route.ts
│   │   │   └── webhooks/
│   │   │       └── mcp/route.ts          # CloudPeers webhook handler
│   │   ├── login/page.tsx
│   │   ├── a/[albumId]/page.tsx         # Album viewer
│   │   └── admin/
│   │       └── login/page.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── cloudflare.ts
│   └── components/
│       ├── GalleryGrid.tsx
│       └── PhotoViewer.tsx
├── scripts/
│   ├── deploy-ga.sh                     # Cloud Run deployment
│   └── bulk-upload.js                   # Photo uploader
└── cloudflare-worker.js                 # Proxy for /gallery route
```

**Key Features**:
- Magic link authentication (Supabase Auth)
- Multi-platform user recognition (3 tables checked in parallel)
- Cloudflare Images integration
- Album-based photo organization
- Responsive photo grid with lightbox

**Authentication Flow**:
1. User enters email → `/api/auth/send-magic-link`
2. Check 3 tables in parallel:
   - `events_registrations` (event registrants)
   - `beta_users` (beta.redheli.com users)
   - `hover_users` (hover.redheli.com users)
3. If found in ANY table → Supabase sends magic link
4. User clicks link → `/api/auth/callback`
5. Session created (30-day JWT cookie)
6. Redirect to `/a/{albumId}`

### 3. Cloudflare Worker (Routing Proxy)

**Location**: `cloudflare-worker.js`
**Purpose**: Route `/gallery` requests to Cloud Run service

**Deployed At**: Cloudflare Workers (jolly-forest-28a3)

**Key Features**:
- Proxies `{domain}/gallery/*` to Cloud Run URL
- Rewrites redirect Location headers
- Preserves cookies and sessions

**Configuration**:
```javascript
const CLOUD_RUN_URL = 'https://bruno-gallery-7ja3qf5tvq-uc.a.run.app';
const ROUTE_PREFIX = '/gallery';
```

## Data Flow

### Event Creation Flow

```
1. User/Agent → POST /api/events/generate
   Body: { eventConfig }

2. Service → Validate config schema
   ├─ Check required fields
   ├─ Validate venue data
   └─ Verify registration settings

3. Service → Generate HTML from template
   ├─ Replace placeholders
   ├─ Inject config JSON
   └─ Generate QR code

4. Service → Deploy to hosting
   ├─ Save HTML to storage
   ├─ Configure subdomain
   └─ Return event URL

5. Service → Record metrics
   └─ POST to CloudPeers observability API
```

### Registration Flow

```
1. User → Fill registration form
   (Name, Email, Phone, Organization)

2. Form → POST to Supabase
   Table: events_registrations
   Data: { full_name, email, event_name, event_date, ... }

3. Supabase → Insert record (RLS policies apply)

4. Edge Function → Send confirmation email
   ├─ Event details
   ├─ Calendar invite link
   └─ Gallery access info

5. Frontend → Show success state
   ├─ Calendar buttons
   └─ What to expect
```

### Gallery Access Flow

```
1. User → Enter email at /gallery/login

2. API → Check user in 3 tables (parallel)
   Promise.all([
     events_registrations.select(),
     beta_users.select(),
     hover_users.select()
   ])

3. API → If found in ANY table
   ├─ Supabase Auth → Send magic link
   └─ Return { magicLinkSent: true }

4. User → Click magic link in email

5. Supabase → Verify token, create session

6. Callback → Redirect to /a/{albumId}

7. Album Page → Fetch photos from Cloudflare Images
   └─ Display in responsive grid
```

## Technology Stack

### Frontend
- **Event Pages**: Alpine.js 3.x + Tailwind CSS 3.x
- **Gallery**: Next.js 14 (App Router) + React 19
- **Icons**: Lucide Icons
- **QR Codes**: QRCode.js

### Backend
- **Database**: Supabase (PostgreSQL 15)
- **Auth**: Supabase Auth (Magic Links)
- **Email**: Supabase Edge Functions
- **Storage**: Cloudflare Images

### Deployment
- **Event Pages**: Static hosting (Cloudflare Pages or Cloud Storage)
- **Gallery**: Google Cloud Run (containerized Next.js)
- **Routing**: Cloudflare Workers
- **CDN**: Cloudflare

### Infrastructure
- **Orchestration**: CloudPeers MCP
- **Monitoring**: CloudPeers Observability API
- **Secrets**: Google Cloud Secret Manager

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tzpdcueumsjxquyumtbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-only

# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CF_IMAGES_ACCOUNT_HASH=...
NEXT_PUBLIC_CF_IMAGES_HASH=...

# App Configuration
NEXT_PUBLIC_APP_URL=https://events.redheli.com/gallery
JWT_SECRET=...

# CloudPeers Integration
CLOUDPEERS_WEBHOOK_SECRET=...
CLOUDPEERS_SERVICE_ID=...
CLOUDPEERS_API_KEY=...
```

## CloudPeers Integration Points

### 1. Webhook Handler

```typescript
// /api/webhooks/mcp/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('x-cloudpeers-signature');
  const body = await req.text();

  // Verify webhook signature
  if (!verifySignature(body, signature, process.env.CLOUDPEERS_WEBHOOK_SECRET!)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event_type) {
    case 'agent.invoked':
      return handleAgentInvocation(event.payload);
    case 'metric.threshold':
      return handleMetricThreshold(event.payload);
    default:
      return new Response('OK', { status: 200 });
  }
}
```

### 2. Metrics Reporting

```typescript
async function recordMetric(metricType: string, value: number, metadata?: object) {
  await fetch(`https://services.cloudpeers.com/api/observability/services/${process.env.CLOUDPEERS_SERVICE_ID}/metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CLOUDPEERS_API_KEY}`
    },
    body: JSON.stringify({
      metric_type: metricType,
      value,
      metadata,
      timestamp: new Date().toISOString()
    })
  });
}

// Usage
await recordMetric('events_created', 1, { eventId, eventName });
await recordMetric('registrations_processed', 1, { eventId, email });
await recordMetric('gallery_photos_stored', photoCount, { albumId });
```

## Next Steps

1. **Implement Event Generator API** - Create RESTful endpoints
2. **Set up Gallery authentication** - Implement magic link flow
3. **Configure Cloudflare Images** - Set up photo storage
4. **Deploy to Cloud Run** - Containerize and deploy
5. **Configure CloudPeers webhooks** - Test MCP integration

Continue to:
- **03_EVENT_TEMPLATE_ENGINE.md** - Template system details
- **04_GALLERY_SYSTEM.md** - Gallery implementation guide
- **05_DATABASE_SCHEMA.md** - Database schema and migrations
