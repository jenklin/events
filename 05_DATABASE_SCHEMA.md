# Database Schema - Supabase Implementation

## Overview

Complete database schema supporting multi-tenant event management with white-label branding. Includes Row Level Security (RLS) policies for secure multi-organization data isolation.

## Schema Design Principles

1. **Multi-tenancy**: Support multiple organizations with isolated data
2. **Branding Flexibility**: JSONB columns for custom branding per org/event
3. **Cross-platform Auth**: Recognize users from Beta, Hover, and Events platforms
4. **Analytics Ready**: Comprehensive tracking and metrics
5. **RLS Security**: Row-level policies for data isolation

## Core Tables

### 1. Organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Branding configuration
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* Branding structure:
  {
    "logo": {
      "url": "https://cdn.example.com/logo.png",
      "alt": "Organization Name",
      "height": 64,
      "favicon": "https://cdn.example.com/favicon.ico"
    },
    "colors": {
      "primary": "#2563EB",
      "secondary": "#1E293B",
      "accent": "#7C3AED",
      "background": "linear-gradient(...)",
      "text": "#F1F5F9"
    },
    "fonts": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif"
    },
    "customText": {
      "tagline": "Creating Positive Change",
      "footer": "© 2025 Organization Name"
    },
    "emailTemplates": {
      "from": "events@example.com",
      "replyTo": "support@example.com",
      "brandingHeader": "<html>...</html>",
      "brandingFooter": "<html>...</html>"
    }
  }
  */

  -- Settings
  domain TEXT,                          -- Custom domain (e.g., events.example.com)
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',

  -- Subscription/Plan
  plan TEXT DEFAULT 'free',            -- free, starter, pro, enterprise
  events_limit INTEGER DEFAULT 5,      -- Max events per month
  storage_limit_gb INTEGER DEFAULT 10, -- Photo storage limit

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_plan ON organizations(plan);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by authenticated users"
  ON organizations FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
```

### 2. Organization Members

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer

  -- Permissions
  permissions JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "canCreateEvents": true,
    "canEditEvents": true,
    "canManageGallery": true,
    "canViewAnalytics": true,
    "canManageMembers": false
  }
  */

  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(organization_id, user_id),
  UNIQUE(organization_id, email)
);

-- Indexes
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_email ON organization_members(email);

-- RLS Policies
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.email());
```

### 3. Events

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,              -- "6:30 PM - 8:30 PM PST"
  location TEXT NOT NULL,

  -- Venue
  venue JSONB NOT NULL,
  /* Venue structure:
  {
    "name": "Community Center",
    "description": "A welcoming space...",
    "address": "123 Main St, City, State 12345",
    "nearestStation": "Metro: City Center",
    "capacity": "100 guests",
    "googleMapsLink": "https://maps.google.com/...",
    "features": [
      { "title": "WiFi Available", "description": "High-speed internet" },
      { "title": "Parking", "description": "Free parking lot" }
    ]
  }
  */

  -- Event branding (inherits from organization, can override)
  branding JSONB DEFAULT '{}'::jsonb,

  -- Agenda/Schedule
  agenda JSONB DEFAULT '[]'::jsonb,
  /* Agenda structure:
  [
    {
      "time": "18:30",
      "title": "Registration",
      "description": "Check-in and welcome"
    },
    ...
  ]
  */

  -- What to expect
  what_to_expect JSONB DEFAULT '{}'::jsonb,
  /* Structure:
  {
    "intro": "Join us for an evening of...",
    "items": [
      "Interactive workshops",
      "Networking opportunities",
      ...
    ]
  }
  */

  -- Settings
  registration_enabled BOOLEAN DEFAULT TRUE,
  registration_limit INTEGER,            -- Max attendees
  registration_deadline TIMESTAMP WITH TIME ZONE,
  require_approval BOOLEAN DEFAULT FALSE,

  -- Links
  custom_links JSONB DEFAULT '[]'::jsonb,
  /* Structure:
  [
    {
      "label": "Event Website",
      "url": "https://example.com/event",
      "icon": "globe"
    },
    ...
  ]
  */

  -- Status
  status TEXT DEFAULT 'draft',           -- draft, published, completed, cancelled
  published_at TIMESTAMP WITH TIME ZONE,

  -- Metrics
  registration_count INTEGER DEFAULT 0,
  attendance_count INTEGER DEFAULT 0,

  -- Timestamps
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_events_org_id ON events(organization_id);
CREATE INDEX idx_events_slug ON events(organization_id, slug);
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_published ON events(published_at DESC) WHERE published_at IS NOT NULL;

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable if published or user is member"
  ON events FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND permissions->>'canCreateEvents' = 'true'
    )
  );
```

### 4. Events Registrations

```sql
CREATE TABLE events_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- User information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  role TEXT,

  -- Registration details
  registration_source TEXT DEFAULT 'event-site', -- event-site, api, admin
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'registered',     -- registered, confirmed, attended, cancelled
  confirmed_at TIMESTAMP WITH TIME ZONE,
  attended_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Custom form data
  custom_fields JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "dietaryRestrictions": "Vegetarian",
    "interests": ["Technology", "Design"],
    "howDidYouHear": "Social Media"
  }
  */

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com",
    "utm": {
      "source": "email",
      "medium": "newsletter",
      "campaign": "event-promo"
    }
  }
  */

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(event_id, email)
);

-- Indexes
CREATE INDEX idx_registrations_event_id ON events_registrations(event_id);
CREATE INDEX idx_registrations_email ON events_registrations(email);
CREATE INDEX idx_registrations_status ON events_registrations(status);
CREATE INDEX idx_registrations_date ON events_registrations(registration_date DESC);

-- RLS Policies
ALTER TABLE events_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registrations viewable by organization members"
  ON events_registrations FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organization_members om ON e.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can register for events"
  ON events_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE status = 'published'
      AND registration_enabled = TRUE
      AND (registration_deadline IS NULL OR registration_deadline > NOW())
    )
  );
```

### 5. Gallery Albums (Updated from previous)

```sql
CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  album_name TEXT NOT NULL,
  album_description TEXT,

  -- Branding (inherits from event/org, can override)
  branding JSONB DEFAULT '{}'::jsonb,

  -- Settings
  is_public BOOLEAN DEFAULT FALSE,
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  download_enabled BOOLEAN DEFAULT TRUE,

  -- Access control
  allowed_emails JSONB DEFAULT '[]'::jsonb, -- Array of allowed emails

  -- Metrics
  photo_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_gallery_albums_event_id ON gallery_albums(event_id);
CREATE INDEX idx_gallery_albums_org_id ON gallery_albums(organization_id);

-- RLS Policies
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums viewable by organization members or registered users"
  ON gallery_albums FOR SELECT
  TO authenticated
  USING (
    is_public = TRUE
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR event_id IN (
      SELECT event_id FROM events_registrations
      WHERE email = auth.email()
    )
  );
```

### 6. User Accounts (Optional - for dashboard access)

```sql
-- User accounts for organization admins (optional)
-- This is separate from event registrations
-- Used for dashboard access and organization management
CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_accounts_email ON user_accounts(email);

-- This table can be used for future admin dashboard functionality
```

## Database Functions

### Increment Photo Count

```sql
CREATE OR REPLACE FUNCTION increment_photo_count(album_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE gallery_albums
  SET photo_count = photo_count + 1,
      updated_at = NOW()
  WHERE id = album_id;
END;
$$ LANGUAGE plpgsql;
```

### Update Event Registration Count

```sql
CREATE OR REPLACE FUNCTION update_registration_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET registration_count = registration_count + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET registration_count = registration_count - 1
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_registration_count
AFTER INSERT OR DELETE ON events_registrations
FOR EACH ROW EXECUTE FUNCTION update_registration_count();
```

### Get Organization Branding (with inheritance)

```sql
CREATE OR REPLACE FUNCTION get_effective_branding(
  p_organization_id UUID,
  p_event_id UUID DEFAULT NULL,
  p_album_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_org_branding JSONB;
  v_event_branding JSONB;
  v_album_branding JSONB;
  v_result JSONB;
BEGIN
  -- Get organization branding
  SELECT branding INTO v_org_branding
  FROM organizations
  WHERE id = p_organization_id;

  -- Merge with event branding if provided
  IF p_event_id IS NOT NULL THEN
    SELECT branding INTO v_event_branding
    FROM events
    WHERE id = p_event_id;

    v_result := v_org_branding || v_event_branding;
  ELSE
    v_result := v_org_branding;
  END IF;

  -- Merge with album branding if provided
  IF p_album_id IS NOT NULL THEN
    SELECT branding INTO v_album_branding
    FROM gallery_albums
    WHERE id = p_album_id;

    v_result := v_result || v_album_branding;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT get_effective_branding('org-uuid', 'event-uuid', 'album-uuid');
```

## Migrations

### Initial Setup

```sql
-- migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in order
-- (Organizations → Events → Registrations → Albums → Assets)

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_assets ENABLE ROW LEVEL SECURITY;

-- Create policies (as defined above)
```

### Sample Data

```sql
-- migrations/002_sample_data.sql

-- Insert sample organization
INSERT INTO organizations (id, name, slug, branding) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Demo Tech Conference',
    'demo-tech-conf',
    '{
      "organizationName": "Demo Tech Conference",
      "logo": {
        "url": "https://via.placeholder.com/200x64/2563EB/FFFFFF?text=Tech+Conf",
        "alt": "Demo Tech Conference",
        "height": 64
      },
      "colors": {
        "primary": "#2563EB",
        "secondary": "#1E293B",
        "accent": "#7C3AED",
        "background": "linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)",
        "text": "#F1F5F9"
      },
      "fonts": {
        "heading": "Inter, system-ui, sans-serif",
        "body": "Inter, system-ui, sans-serif"
      }
    }'::jsonb
  );
```

## Supabase Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### RLS Testing

```sql
-- Test as organization member
SET request.jwt.claims = '{"sub": "user-uuid", "email": "user@example.com"}';

-- Should see only their organization's events
SELECT * FROM events;

-- Should be able to create event
INSERT INTO events (organization_id, title, event_date, ...)
VALUES ('org-uuid', 'Test Event', '2025-06-01', ...);
```

## Next Steps

1. Run migrations on Supabase project
2. Set up RLS policies
3. Create database functions and triggers
4. Add sample organization data
5. Test multi-tenant isolation

Continue to:
- **06_DEPLOYMENT_WORKFLOW.md** - CI/CD pipeline setup
- **07_INTEGRATION_GUIDE.md** - cloudpeers integration
