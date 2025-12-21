# Quick Start Guide - Events Platform Service

## Goal

Get the Events Platform service running locally and registered with CloudPeers in **under 2 hours**.

## Prerequisites

- Node.js 18+ installed
- Docker Desktop running
- Supabase account (free tier OK)
- Cloudflare account (free tier OK)
- CloudPeers account
- Google Cloud account (with billing enabled)

## Step 1: Clone & Setup (15 minutes)

```bash
# Create project directory
mkdir events-platform && cd events-platform

# Initialize Git repository
git init

# Create directory structure
mkdir -p gallery/src/app/api/webhooks/mcp
mkdir -p gallery/src/lib/mcp
mkdir -p event-generator/templates
mkdir -p cloudflare-worker
mkdir -p supabase/migrations

# Initialize Node projects
cd gallery && npm init -y && npm install
cd ../event-generator && npm init -y && npm install
cd ..
```

## Step 2: Install Dependencies (10 minutes)

### Gallery (Next.js)

```bash
cd gallery

npm install next@14 react@19 react-dom@19
npm install @supabase/supabase-js
npm install tailwindcss postcss autoprefixer
npm install lucide-react
npm install -D typescript @types/node @types/react

# Initialize TypeScript
npx tsc --init
```

### Event Generator

```bash
cd ../event-generator

npm install express
npm install dotenv
npm install -D typescript @types/node @types/express
```

## Step 3: Supabase Setup (20 minutes)

### Create Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: `events-platform`
4. Database Password: (save this!)
5. Region: (closest to you)
6. Click "Create new project"

### Run Migrations

```sql
-- In Supabase SQL Editor: supabase.com/dashboard/project/*/sql

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  branding JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  venue JSONB NOT NULL,
  branding JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create registrations table
CREATE TABLE events_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- Create gallery albums table
CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  organization_id UUID REFERENCES organizations(id),
  album_name TEXT NOT NULL,
  branding JSONB DEFAULT '{}'::jsonb,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gallery assets table
CREATE TABLE gallery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES gallery_albums(id),
  cloudflare_image_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User accounts table (optional - for admin dashboard)
CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Allow public read on published events"
  ON events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Allow public insert on registrations"
  ON events_registrations FOR INSERT
  WITH CHECK (true);
```

### Insert Sample Data

```sql
-- Create sample organization
INSERT INTO organizations (name, slug, branding) VALUES
  (
    'Demo Organization',
    'demo-org',
    '{
      "organizationName": "Demo Organization",
      "logo": {"url": "https://via.placeholder.com/200", "height": 48},
      "colors": {
        "primary": "#2563EB",
        "secondary": "#1E293B",
        "text": "#F1F5F9"
      }
    }'::jsonb
  );

-- Create sample event
INSERT INTO events (organization_id, title, event_date, venue, status) VALUES
  (
    (SELECT id FROM organizations WHERE slug = 'demo-org'),
    'Sample Event 2025',
    '2025-06-15',
    '{
      "name": "Demo Venue",
      "address": "123 Main St",
      "capacity": "50 guests"
    }'::jsonb,
    'published'
  );
```

## Step 4: Environment Variables (10 minutes)

### Get Supabase Credentials

1. In Supabase Dashboard → Settings → API
2. Copy `Project URL` and `anon public` key
3. Copy `service_role` key (keep secret!)

### Create `.env.local` files

**gallery/.env.local**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-random-secret-here
```

**event-generator/.env**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Create Minimal Gallery App (30 minutes)

### `gallery/src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Events Platform Gallery</h1>
        <p className="text-gray-600">Gallery system is running!</p>
      </div>
    </div>
  );
}
```

### `gallery/src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'events-gallery'
  });
}
```

### `gallery/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
```

### `gallery/package.json` (scripts)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Step 6: Test Locally (10 minutes)

```bash
# Start gallery
cd gallery
npm run dev
# Opens at http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/health

# Should return:
# {"status":"healthy","timestamp":"...","service":"events-gallery"}
```

## Step 7: Register with CloudPeers (15 minutes)

```bash
# Register service
curl -X POST https://services.cloudpeers.com/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "events-platform-dev-001",
    "name": "Events Platform (Dev)",
    "version": "0.1.0",
    "description": "Event management platform - development instance",
    "webhook_url": "http://localhost:3000/api/webhooks/mcp",
    "pricing_model": "free",
    "capabilities": [
      {
        "name": "health.check",
        "parameters": {},
        "description": "Service health check"
      }
    ],
    "semantic_tags": {
      "personas": ["event-organizer"],
      "experiences": ["event-management"],
      "capabilities": ["template-generation"],
      "domains": ["event-planning"]
    }
  }'

# Save the webhook_secret returned!
```

## Step 8: Implement MCP Webhook (20 minutes)

### `gallery/src/app/api/webhooks/mcp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log('[MCP] Received event:', event.event_type);

    switch (event.event_type) {
      case 'health_check':
        return NextResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ acknowledged: true });
    }
  } catch (error) {
    console.error('[MCP] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Events Platform',
    webhook: 'active',
    version: '0.1.0'
  });
}
```

### Test Webhook

```bash
# Test local webhook
curl -X POST http://localhost:3000/api/webhooks/mcp \
  -H "Content-Type: application/json" \
  -d '{"event_type":"health_check"}'

# Should return:
# {"status":"healthy","timestamp":"..."}
```

## Step 9: Create First Event Template (10 minutes)

### `event-generator/templates/base.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{EVENT_TITLE}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --color-primary: {{PRIMARY_COLOR}};
    }
  </style>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center"
       style="background: {{BACKGROUND_GRADIENT}}; color: {{TEXT_COLOR}};">
    <div class="text-center">
      <img src="{{LOGO_URL}}" alt="{{ORGANIZATION_NAME}}" class="mx-auto mb-8" style="height: {{LOGO_HEIGHT}}px;">
      <h1 class="text-5xl font-bold mb-4">{{EVENT_TITLE}}</h1>
      <p class="text-xl mb-4">{{EVENT_DATE}} | {{EVENT_TIME}}</p>
      <p class="text-lg">{{VENUE_NAME}}</p>
    </div>
  </div>
</body>
</html>
```

### `event-generator/generate.js`

```javascript
const fs = require('fs');

const config = {
  organizationName: "Demo Org",
  logoUrl: "https://via.placeholder.com/200",
  logoHeight: 64,
  primaryColor: "#2563EB",
  backgroundColor: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
  textColor: "#F1F5F9",
  eventTitle: "Sample Event 2025",
  eventDate: "June 15, 2025",
  eventTime: "6:00 PM - 9:00 PM",
  venueName: "Demo Venue"
};

let template = fs.readFileSync('templates/base.html', 'utf8');

// Replace placeholders
Object.entries({
  '{{ORGANIZATION_NAME}}': config.organizationName,
  '{{LOGO_URL}}': config.logoUrl,
  '{{LOGO_HEIGHT}}': config.logoHeight,
  '{{PRIMARY_COLOR}}': config.primaryColor,
  '{{BACKGROUND_GRADIENT}}': config.backgroundColor,
  '{{TEXT_COLOR}}': config.textColor,
  '{{EVENT_TITLE}}': config.eventTitle,
  '{{EVENT_DATE}}': config.eventDate,
  '{{EVENT_TIME}}': config.eventTime,
  '{{VENUE_NAME}}': config.venueName
}).forEach(([key, value]) => {
  template = template.replace(new RegExp(key, 'g'), value);
});

fs.writeFileSync('output/sample-event.html', template);
console.log('✅ Event generated: output/sample-event.html');
```

### Generate Event

```bash
cd event-generator
mkdir output
node generate.js

# Open in browser
open output/sample-event.html
```

## Verification Checklist

- [ ] Gallery runs at http://localhost:3000
- [ ] Health endpoint returns 200
- [ ] Supabase connection works
- [ ] Registered with CloudPeers
- [ ] MCP webhook responds
- [ ] Event template generates

## Next Steps

Now that you have a working foundation:

1. **Add Authentication**: Implement magic link auth (see `04_GALLERY_SYSTEM.md`)
2. **Add Event API**: Create REST endpoints for event management
3. **Deploy to Cloud Run**: Follow `06_DEPLOYMENT_WORKFLOW.md`
4. **Add Metrics**: Implement CloudPeers observability (see `07_INTEGRATION_GUIDE.md`)

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Supabase connection fails
- Check `NEXT_PUBLIC_SUPABASE_URL` format (must include https://)
- Verify anon key is correct
- Check project is not paused (Supabase free tier)

### Webhook registration fails
- Ensure webhook URL is accessible (use ngrok for local testing)
- Verify JSON syntax
- Check CloudPeers service status

## Resources

- Full docs: See `README.md` in this directory
- CloudPeers: https://services.cloudpeers.com
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

---

**Time to Complete**: ~2 hours
**Status**: Ready to Go! 🚀

Need help? Check the full migration guides in this directory.
