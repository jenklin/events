# Events Platform - CloudPeers Service

## Overview

This directory contains comprehensive implementation guides for the **CloudPeers Events Platform** - a white-label event management service. The service provides event management, registration, and photo gallery capabilities with **full multi-tenant branding support**.

## What This Service Does

**CloudPeers Events Platform** is a multi-tenant event management service that:

1. **Creates Event Landing Pages** - Generate branded event pages from templates
2. **Handles Registration** - Multi-platform user recognition and Supabase registration
3. **Manages Photo Galleries** - Private galleries with magic link authentication
4. **Provides Analytics** - Track registrations, attendance, and engagement
5. **Supports White-Label Branding** - Full customization per organization/event

## Key Features

- ✅ **Template-Based Event Generation** - Create events in 5 minutes
- ✅ **Secure Multi-Tenant Auth** - Email-based authentication with Supabase
- ✅ **Cloudflare Images Integration** - Fast, CDN-delivered photo galleries
- ✅ **Magic Link Authentication** - Passwordless gallery access
- ✅ **QR Code Generation** - Mobile-friendly registration
- ✅ **Calendar Integration** - Google Calendar & .ics export
- ✅ **Email Automation** - Confirmation emails with event details
- ✅ **CloudPeers MCP Integration** - AI-to-AI service orchestration
- ✅ **Complete White-Label Support** - Custom branding per organization

## Document Structure

### Phase 1: Service Setup
1. **[01_SERVICE_REGISTRATION.md](./01_SERVICE_REGISTRATION.md)**
   - Register service with CloudPeers
   - Define capabilities and pricing
   - Set up semantic tags for discovery
   - **Time**: 15 minutes

2. **[02_SERVICE_ARCHITECTURE.md](./02_SERVICE_ARCHITECTURE.md)**
   - Overall system architecture
   - Component breakdown
   - Technology stack
   - Data flow diagrams
   - **Time**: 30 minutes (reading)

### Phase 2: Core Implementation
3. **[03_EVENT_TEMPLATE_ENGINE.md](./03_EVENT_TEMPLATE_ENGINE.md)**
   - Template system with white-label branding
   - Event configuration schema
   - Generator script implementation
   - Branding presets
   - **Time**: 4-6 hours (implementation)

4. **[04_GALLERY_SYSTEM.md](./04_GALLERY_SYSTEM.md)**
   - Next.js gallery application
   - Multi-platform authentication
   - Cloudflare Images integration
   - Branded album viewer
   - **Time**: 8-10 hours (implementation)

### Phase 3: Infrastructure
5. **[05_DATABASE_SCHEMA.md](./05_DATABASE_SCHEMA.md)**
   - Multi-tenant Supabase schema
   - Row-level security policies
   - JSONB branding configuration
   - Database functions and triggers
   - **Time**: 3-4 hours (setup)

6. **[06_DEPLOYMENT_WORKFLOW.md](./06_DEPLOYMENT_WORKFLOW.md)**
   - GitHub Actions CI/CD
   - Cloud Run deployment
   - Cloudflare Worker configuration
   - Secrets management
   - **Time**: 4-6 hours (setup)

### Phase 4: CloudPeers Integration
7. **[07_INTEGRATION_GUIDE.md](./07_INTEGRATION_GUIDE.md)**
   - MCP webhook implementation
   - Agent invocation handlers
   - Metrics reporting
   - Service discovery
   - **Time**: 3-4 hours (implementation)

## Quick Start (Implementation Timeline)

### Week 1: Foundation
**Days 1-2**: Service Registration & Architecture
- [ ] Register service with CloudPeers (01)
- [ ] Review architecture documentation (02)
- [ ] Set up Git repository
- [ ] Configure development environment

**Days 3-5**: Database & Event Templates
- [ ] Set up Supabase project
- [ ] Run database migrations (05)
- [ ] Implement event template engine (03)
- [ ] Create sample event configurations

### Week 2: Gallery System
**Days 1-3**: Gallery Implementation
- [ ] Build Next.js gallery app (04)
- [ ] Implement magic link authentication
- [ ] Integrate Cloudflare Images
- [ ] Create branded album viewer

**Days 4-5**: Deployment
- [ ] Containerize applications
- [ ] Deploy to Cloud Run (06)
- [ ] Configure Cloudflare Worker
- [ ] Test end-to-end flow

### Week 3: CloudPeers Integration
**Days 1-2**: MCP Integration
- [ ] Implement webhook handler (07)
- [ ] Add metrics reporting
- [ ] Test agent invocations

**Days 3-5**: Testing & Launch
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Documentation
- [ ] Publish to CloudPeers marketplace

## Technology Stack

### Frontend
- **Event Pages**: Static HTML + Alpine.js + Tailwind CSS
- **Gallery**: Next.js 14 (App Router) + React 19
- **Icons**: Lucide Icons
- **QR Codes**: QRCode.js

### Backend
- **Database**: Supabase (PostgreSQL 15)
- **Auth**: Supabase Auth (Magic Links)
- **Storage**: Cloudflare Images
- **Email**: Supabase Edge Functions

### Deployment
- **Gallery**: Google Cloud Run (Docker)
- **Routing**: Cloudflare Workers
- **CDN**: Cloudflare
- **CI/CD**: GitHub Actions

### Integration
- **Orchestration**: CloudPeers MCP
- **Metrics**: CloudPeers Observability API
- **Discovery**: CloudPeers Marketplace

## Environment Variables Required

Create a `.env.local` file with these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
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

# Google Cloud
GCP_PROJECT_ID=...
GCP_REGION=us-central1
```

## Key Differences from Seoul Events Site

### CloudPeers Events Platform Features
- ✅ Multi-tenant with RLS policies for secure data isolation
- ✅ Complete white-label branding (logos, colors, fonts)
- ✅ Automated event generation via API
- ✅ CloudPeers MCP integration for AI orchestration
- ✅ Supports unlimited organizations
- ✅ Service marketplace discovery
- ✅ Usage-based pricing model
- ✅ Mobile-responsive event pages
- ✅ QR code generation
- ✅ Email automation

## White-Label Branding Capabilities

### Organization Level
```json
{
  "branding": {
    "organizationName": "Your Org",
    "logo": { "url": "...", "height": 64 },
    "colors": {
      "primary": "#2563EB",
      "secondary": "#1E293B",
      "accent": "#7C3AED"
    },
    "fonts": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif"
    }
  }
}
```

### Event Level (Inherits + Overrides)
- Custom event branding
- Event-specific colors
- Custom welcome messages
- Tailored email templates

### Gallery Level (Inherits + Overrides)
- Album-specific branding
- Custom photo gallery styling
- Organization watermarks
- Branded download prompts

## Success Metrics

### Events Created
- Track via `events_created` metric
- Report to CloudPeers observability API

### User Registrations
- Track via `registrations_processed` metric
- Multi-platform user recognition

### Gallery Engagement
- Track via `gallery_photos_stored`, `magic_links_sent`
- Photo views and downloads

### Service Discovery
- Track via `service_discoveries` metric
- Marketplace impressions

## Common Use Cases

### Use Case 1: Event Organizer
1. Creates organization in platform
2. Configures branding (logo, colors, fonts)
3. Generates event page via API or dashboard
4. Shares registration URL or QR code
5. Uploads photos post-event
6. Attendees receive magic link for gallery

### Use Case 2: Multi-Event Organization
1. Creates organization with default branding
2. Generates multiple events (different branding per event)
3. Tracks analytics across all events
4. Manages galleries for each event
5. Exports attendee data

### Use Case 3: White-Label Reseller
1. Creates parent organization
2. Creates sub-organizations for clients
3. Each client gets custom branding
4. Clients manage their own events
5. Reseller tracks usage and billing

## Testing Checklist

### Event Creation
- [ ] Generate event from template
- [ ] Verify branding applies correctly
- [ ] Test QR code generation
- [ ] Validate calendar integration
- [ ] Check responsive design

### Registration
- [ ] Submit registration form
- [ ] Verify Supabase insert
- [ ] Confirm email delivery
- [ ] Test calendar invite download
- [ ] Check form validation

### Gallery Access
- [ ] Enter email at login
- [ ] Verify multi-platform check
- [ ] Receive magic link email
- [ ] Access album with token
- [ ] View branded gallery
- [ ] Download photos

### CloudPeers Integration
- [ ] Verify webhook signature
- [ ] Test agent invocation
- [ ] Record metrics
- [ ] Check service discovery
- [ ] Validate pricing/metering

## Troubleshooting

### Issue: "Email not found" in gallery
**Solution**: Ensure Supabase client is created at runtime (not module level)
**File**: `src/app/api/auth/send-magic-link/route.ts`

### Issue: Redirects going to wrong URL
**Solution**: Check Cloudflare Worker redirect rewriting
**File**: `cloudflare-worker.js`

### Issue: Webhook signature verification fails
**Solution**: Verify `CLOUDPEERS_WEBHOOK_SECRET` matches registered secret
**File**: `src/app/api/webhooks/mcp/route.ts`

### Issue: Branding not applying
**Solution**: Check JSONB structure and CSS custom properties
**File**: Check `get_effective_branding()` function

## Support & Resources

- **CloudPeers Docs**: https://services.cloudpeers.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Cloudflare Images**: https://developers.cloudflare.com/images
- **Next.js 14 Docs**: https://nextjs.org/docs

## Contributing

When updating these prompts:
1. Maintain white-label flexibility
2. Update all affected documents
3. Test end-to-end flow
4. Update environment variable lists
5. Keep architecture diagrams current

## License

This migration guide is part of the Red Helicopter platform and CloudPeers ecosystem.

---

**Last Updated**: December 19, 2025
**Version**: 1.0.0
**Status**: Ready for Implementation

## Next Steps

1. Read through all 7 documents in order
2. Set up development environment
3. Register service with CloudPeers (01)
4. Begin Week 1 implementation
5. Join CloudPeers developer community for support

**Estimated Total Implementation Time**: 2-3 weeks (1 developer)

Ready to build? Start with **01_SERVICE_REGISTRATION.md**! 🚀
