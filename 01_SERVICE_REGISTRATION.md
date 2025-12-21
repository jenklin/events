# Event Management Service - CloudPeers Registration

## Service Overview

**Service Name**: CloudPeers Events
**Agent ID**: `cloudpeers-events-platform-001`
**Version**: 1.0.0
**Pricing Model**: Token-based (per event created)

## Service Description

White-label event management and photo gallery platform. Creates customized event landing pages, handles registrations, and provides private photo galleries with magic link authentication. Perfect for conferences, meetups, community events, and workshops.

## Registration Payload

```bash
curl -X POST https://services.cloudpeers.com/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "cloudpeers-events-platform-001",
    "name": "CloudPeers Events",
    "version": "1.0.0",
    "description": "White-label event management platform with landing pages, registration system, and private photo galleries for community events, conferences, and workshops",
    "webhook_url": "https://events-api.cloudpeers.com/api/webhooks/mcp",
    "pricing_model": "token-based",
    "metadata": {
      "tagline": "Create, Manage, and Share Community Events",
      "url": "https://events.cloudpeers.com",
      "launchStatus": "live",
      "features": [
        "Automated white-label event page generation",
        "Supabase-powered registration system",
        "Private photo galleries with magic link authentication",
        "Multi-organization support with data isolation",
        "QR code generation for mobile registration",
        "Calendar integration (Google Calendar, .ics)",
        "Cloudflare Images integration for photo storage",
        "Automated email confirmations"
      ],
      "documentation": "https://docs.cloudpeers.com/events",
      "support": "events-support@cloudpeers.com",
      "techStack": [
        "Next.js 14",
        "Supabase (PostgreSQL + Auth)",
        "Cloudflare Images",
        "Google Cloud Run",
        "Alpine.js",
        "Tailwind CSS"
      ]
    },
    "capabilities": [
      {
        "name": "event.create",
        "parameters": {
          "eventConfig": "object",
          "templateOptions": "object"
        },
        "response_schema": {
          "eventId": "string",
          "eventUrl": "string",
          "registrationUrl": "string",
          "qrCodeUrl": "string"
        },
        "description": "Create a new event from template configuration"
      },
      {
        "name": "event.register",
        "parameters": {
          "eventId": "string",
          "userData": "object"
        },
        "response_schema": {
          "registrationId": "string",
          "confirmationSent": "boolean",
          "galleryAccess": "boolean"
        },
        "description": "Register a user for an event"
      },
      {
        "name": "gallery.create",
        "parameters": {
          "eventId": "string",
          "albumName": "string",
          "albumDescription": "string"
        },
        "response_schema": {
          "albumId": "string",
          "uploadUrl": "string",
          "galleryUrl": "string"
        },
        "description": "Create a private photo gallery for an event"
      },
      {
        "name": "gallery.authorize",
        "parameters": {
          "email": "string",
          "albumId": "string"
        },
        "response_schema": {
          "authorized": "boolean",
          "magicLinkSent": "boolean",
          "accessToken": "string"
        },
        "description": "Authorize user access to photo gallery via magic link"
      },
      {
        "name": "gallery.upload",
        "parameters": {
          "albumId": "string",
          "photos": "array",
          "metadata": "object"
        },
        "response_schema": {
          "uploadedCount": "number",
          "failedCount": "number",
          "assetIds": "array"
        },
        "description": "Bulk upload photos to event gallery"
      },
      {
        "name": "event.analytics",
        "parameters": {
          "eventId": "string",
          "metrics": "array"
        },
        "response_schema": {
          "registrationCount": "number",
          "attendanceRate": "number",
          "galleryViews": "number",
          "photoDownloads": "number"
        },
        "description": "Get event analytics and engagement metrics"
      }
    ],
    "semantic_tags": {
      "personas": [
        "event-organizer",
        "community-builder",
        "educator",
        "caregiver"
      ],
      "experiences": [
        "event-management",
        "community-building",
        "photo-sharing",
        "registration-management"
      ],
      "capabilities": [
        "template-generation",
        "user-authentication",
        "photo-storage",
        "email-automation",
        "analytics-tracking"
      ],
      "domains": [
        "event-planning",
        "community-engagement",
        "personal-development",
        "cultural-innovation"
      ]
    }
  }'
```

## Metering Configuration

```json
{
  "metering_config": {
    "unit": "events",
    "cost_per_unit": 10,
    "included_units": 5,
    "overage_rate": 8,
    "billing_period": "monthly",
    "tracked_metrics": [
      {
        "name": "events_created",
        "type": "counter",
        "description": "Number of events created"
      },
      {
        "name": "registrations_processed",
        "type": "counter",
        "description": "Number of user registrations"
      },
      {
        "name": "gallery_photos_stored",
        "type": "gauge",
        "description": "Total photos in galleries"
      },
      {
        "name": "magic_links_sent",
        "type": "counter",
        "description": "Gallery access magic links sent"
      }
    ]
  }
}
```

## Expected Response

```json
{
  "message": "Service registered successfully",
  "service": {
    "id": "uuid-here",
    "agent_id": "cloudpeers-events-platform-001",
    "name": "CloudPeers Events",
    "version": "1.0.0",
    "status": "active",
    "created_at": "2025-12-19T00:00:00.000Z"
  },
  "webhook_secret": "save-this-secret-immediately",
  "onboarding": {
    "admin_dashboard": "/admin/services/uuid-here",
    "observability": "/api/observability/services/uuid-here/metrics",
    "documentation": "/api/registry/services/uuid-here/docs"
  }
}
```

## Post-Registration Steps

1. **Save webhook secret** - Store securely in environment variables
2. **Configure webhook endpoint** - Implement MCP webhook handler at `/api/webhooks/mcp`
3. **Set pricing details** - Configure token pricing in admin dashboard
4. **Publish service** - Make discoverable in CloudPeers marketplace
5. **Test capabilities** - Verify each capability works end-to-end

## Next Steps

After registration, proceed to:
- **02_SERVICE_ARCHITECTURE.md** - Implement core service architecture
- **03_EVENT_TEMPLATE_ENGINE.md** - Build event template system
- **04_GALLERY_SYSTEM.md** - Implement photo gallery
- **05_DATABASE_SCHEMA.md** - Set up Supabase schema
- **06_DEPLOYMENT_WORKFLOW.md** - Configure Cloud Run deployment
