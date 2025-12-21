# Gallery System - Implementation Guide

## Overview

Private photo gallery system with magic link authentication, supporting **white-label branding** per event or organization. Built with Next.js 14, Supabase Auth, and Cloudflare Images.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│           Gallery Application (Next.js 14)          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │   Login      │    │   Album Viewer           │  │
│  │   /login     │───▶│   /a/[albumId]           │  │
│  │              │    │                          │  │
│  │ - Email form │    │ - Branded header         │  │
│  │ - Branding   │    │ - Photo grid             │  │
│  │              │    │ - Lightbox               │  │
│  └──────────────┘    │ - Download buttons       │  │
│         │            └──────────────────────────┘  │
│         ▼                      │                    │
│  ┌──────────────────┐         │                    │
│  │  Magic Link Auth │         │                    │
│  │  /api/auth/      │         │                    │
│  │                  │         │                    │
│  │ - send-magic-link│◀────────┘                    │
│  │ - callback       │                              │
│  └──────────────────┘                              │
└─────────────────────────────────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────────┐    ┌────────────────────────┐
│   Supabase Auth      │    │  Cloudflare Images     │
│   - Magic links      │    │  - Photo storage       │
│   - Session mgmt     │    │  - CDN delivery        │
│   - RLS policies     │    │  - Variant generation  │
└──────────────────────┘    └────────────────────────┘
```

## Database Schema

### 1. Gallery Albums

```sql
CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  organization_id TEXT,              -- For multi-tenant support
  album_name TEXT NOT NULL,
  album_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Branding configuration (JSONB for flexibility)
  branding JSONB DEFAULT '{}'::jsonb,
  /* Example branding structure:
  {
    "organizationName": "Community Hub",
    "logo": {
      "url": "https://cdn.example.com/logo.png",
      "alt": "Community Hub",
      "height": 48
    },
    "colors": {
      "primary": "#2563EB",
      "secondary": "#1E293B",
      "text": "#F1F5F9"
    },
    "customText": {
      "welcomeMessage": "Welcome to our event gallery!",
      "downloadPrompt": "Download your favorites"
    }
  }
  */

  -- Settings
  is_public BOOLEAN DEFAULT FALSE,
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  download_enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  photo_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,

  CONSTRAINT fk_event FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_gallery_albums_event_id ON gallery_albums(event_id);
CREATE INDEX idx_gallery_albums_org_id ON gallery_albums(organization_id);
CREATE INDEX idx_gallery_albums_created ON gallery_albums(created_at DESC);
```

### 2. Gallery Assets

```sql
CREATE TABLE gallery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL,
  cloudflare_image_id TEXT NOT NULL UNIQUE,

  -- Image metadata
  filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,

  -- Upload info
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,

  -- Custom metadata (EXIF, location, tags, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_album FOREIGN KEY (album_id)
    REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_gallery_assets_album_id ON gallery_assets(album_id);
CREATE INDEX idx_gallery_assets_cf_id ON gallery_assets(cloudflare_image_id);
CREATE INDEX idx_gallery_assets_uploaded ON gallery_assets(uploaded_at DESC);
CREATE INDEX idx_gallery_assets_not_deleted ON gallery_assets(album_id)
  WHERE deleted_at IS NULL;
```

### 3. Gallery Access Logs

```sql
CREATE TABLE gallery_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'view', 'download', 'share'
  asset_id UUID,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_album_log FOREIGN KEY (album_id)
    REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_access_logs_album ON gallery_access_logs(album_id);
CREATE INDEX idx_access_logs_email ON gallery_access_logs(user_email);
CREATE INDEX idx_access_logs_time ON gallery_access_logs(accessed_at DESC);
```

## Authentication Flow (Multi-Platform)

### Magic Link Implementation

```typescript
// /api/auth/send-magic-link/route.ts
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { email, albumId } = await req.json();

  // Create Supabase clients AT RUNTIME (not module level)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // Check if user is registered for the event
    const { data: eventReg } = await supabaseAdmin
      .from('events_registrations')
      .select('email, full_name, event_name, event_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!eventReg) {
      return Response.json(
        { error: 'Email not found. Please register for the event first.' },
        { status: 404 }
      );
    }

    // Verify the album belongs to this event
    const { data: album } = await supabaseAdmin
      .from('gallery_albums')
      .select('event_id, album_name, branding')
      .eq('id', albumId)
      .single();

    if (!album || album.event_id !== eventReg.event_id) {
      return Response.json(
        { error: 'You do not have access to this gallery.' },
        { status: 403 }
      );
    }

    const userName = eventReg.full_name || 'User';

    // Get album branding for email template
    const { data: album } = await supabaseAdmin
      .from('gallery_albums')
      .select('branding, album_name, organization_id')
      .eq('id', albumId)
      .single();

    const branding = album?.branding || {};
    const organizationName = branding.organizationName || 'Event Gallery';

    // Send magic link via Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/a/${albumId}`,
        data: {
          userName,
          albumId,
          organizationName,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return Response.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      );
    }

    // Log access attempt
    await supabaseAdmin.from('gallery_access_logs').insert({
      album_id: albumId,
      user_email: email.toLowerCase(),
      access_type: 'auth_request',
    });

    return Response.json({
      success: true,
      message: `Magic link sent to ${email}`,
    });

  } catch (error) {
    console.error('Magic link error:', error);
    return Response.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
```

### Auth Callback

```typescript
// /api/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error) {
      // Set session cookie (30 days) and redirect
      return NextResponse.redirect(new URL(next, req.url));
    }
  }

  // Authentication failed
  return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
}
```

## Album Viewer (Branded)

```typescript
// /app/a/[albumId]/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AlbumViewer from '@/components/AlbumViewer';

export default async function AlbumPage({
  params,
}: {
  params: { albumId: string };
}) {
  const supabase = createServerClient();

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect(`/login?albumId=${params.albumId}`);
  }

  // Fetch album with branding
  const { data: album, error: albumError } = await supabase
    .from('gallery_albums')
    .select('*')
    .eq('id', params.albumId)
    .single();

  if (albumError || !album) {
    return <div>Album not found</div>;
  }

  // Fetch photos
  const { data: assets } = await supabase
    .from('gallery_assets')
    .select('*')
    .eq('album_id', params.albumId)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false });

  // Log album view
  await supabase.from('gallery_access_logs').insert({
    album_id: params.albumId,
    user_email: session.user.email,
    access_type: 'view',
  });

  return (
    <AlbumViewer
      album={album}
      assets={assets || []}
      branding={album.branding}
    />
  );
}
```

## Branded Gallery Components

### Album Viewer Component

```typescript
// /components/AlbumViewer.tsx
'use client';

import { useState } from 'react';
import PhotoGrid from './PhotoGrid';
import PhotoLightbox from './PhotoLightbox';

interface AlbumBranding {
  organizationName?: string;
  logo?: {
    url: string;
    alt: string;
    height?: number;
  };
  colors?: {
    primary: string;
    secondary: string;
    text: string;
  };
  customText?: {
    welcomeMessage?: string;
    downloadPrompt?: string;
  };
}

export default function AlbumViewer({
  album,
  assets,
  branding,
}: {
  album: any;
  assets: any[];
  branding: AlbumBranding;
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  // Apply branding CSS custom properties
  const brandingStyle = branding.colors ? {
    '--color-primary': branding.colors.primary,
    '--color-secondary': branding.colors.secondary,
    '--color-text': branding.colors.text,
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen" style={brandingStyle}>
      {/* Branded Header */}
      <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {branding.logo && (
              <img
                src={branding.logo.url}
                alt={branding.logo.alt}
                style={{ height: branding.logo.height || 48 }}
                className="h-12"
              />
            )}
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {album.album_name}
            </h1>
            <button
              onClick={() => downloadAll()}
              className="px-4 py-2 rounded-lg transition"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
            >
              {branding.customText?.downloadPrompt || 'Download All'}
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Message */}
      {branding.customText?.welcomeMessage && (
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-lg" style={{ color: 'var(--color-text)' }}>
            {branding.customText.welcomeMessage}
          </p>
        </div>
      )}

      {/* Photo Grid */}
      <PhotoGrid
        assets={assets}
        onPhotoClick={setSelectedPhoto}
        primaryColor={branding.colors?.primary}
      />

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => {/* Next photo */}}
          onPrevious={() => {/* Previous photo */}}
        />
      )}
    </div>
  );
}
```

## Cloudflare Images Integration

### Upload Photos

```typescript
// /api/gallery/upload/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const albumId = formData.get('albumId') as string;
  const file = formData.get('file') as File;

  // Upload to Cloudflare Images
  const cfFormData = new FormData();
  cfFormData.append('file', file);

  const uploadResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: cfFormData,
    }
  );

  const { result: cfImage } = await uploadResponse.json();

  // Save to database
  const { data: asset } = await supabase
    .from('gallery_assets')
    .insert({
      album_id: albumId,
      cloudflare_image_id: cfImage.id,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      width: cfImage.meta?.width,
      height: cfImage.meta?.height,
    })
    .select()
    .single();

  // Update album photo count
  await supabase.rpc('increment_photo_count', { album_id: albumId });

  return Response.json({ asset });
}
```

### Photo URL Generation

```typescript
// /lib/cloudflare.ts
export function getPhotoUrl(
  imageId: string,
  variant: 'public' | 'thumbnail' | 'large' = 'public'
): string {
  const hash = process.env.NEXT_PUBLIC_CF_IMAGES_HASH;
  return `https://imagedelivery.net/${hash}/${imageId}/${variant}`;
}

// Usage
const thumbnailUrl = getPhotoUrl(asset.cloudflare_image_id, 'thumbnail');
const fullSizeUrl = getPhotoUrl(asset.cloudflare_image_id, 'large');
```

## Deployment

### Cloud Run Configuration

```dockerfile
# gallery/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# gallery/scripts/deploy-ga.sh
#!/bin/bash

echo "🚀 Deploying Gallery to Cloud Run..."

# Build and deploy
gcloud run deploy bruno-gallery \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://events.redheli.com/gallery" \
  --set-secrets \
    "SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,\
     CLOUDFLARE_API_TOKEN=CLOUDFLARE_API_TOKEN:latest"

echo "✅ Deployment complete!"
```

## Next Steps

1. Implement branding presets in database
2. Create admin dashboard for album management
3. Add bulk photo upload script
4. Set up email templates with branding
5. Implement analytics tracking

Continue to:
- **05_DATABASE_SCHEMA.md** - Complete schema with multi-tenancy
- **06_DEPLOYMENT_WORKFLOW.md** - Full CI/CD pipeline
