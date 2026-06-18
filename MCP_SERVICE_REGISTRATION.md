# cloudpeers Events - MCP Service Registration

## Service Overview

**Service Name**: cloudpeers Events
**Service ID**: `cloudpeers-events`
**Version**: 1.0.0
**Provider**: cloudpeers
**Category**: Event Management
**Marketplace URL**: https://services.cloudpeers.com/cloudpeers-events

---

## 📋 Service Description

Create, manage, and host beautiful event pages with RSVP management, potluck coordination, AI music generation, and more. Perfect for birthdays, community gatherings, fundraisers, and corporate events.

**Key Features:**
- 🎨 Beautiful customizable event pages
- 📝 Multi-response RSVP (Going/Maybe/Can't Go)
- 👥 Guest management with approval workflow
- 🍕 Potluck food tracking (OPTIONAL)
- 🎵 AI-generated custom songs (OPTIONAL)
- 🔗 Custom subdomains (*.redheli.com or *.cloudpeers.com)
- 📱 QR codes for easy sharing
- 📸 Private photo galleries
- 🎨 White-label branding

---

## 🔧 MCP Service Capabilities

### Tools (Agent-Callable Functions)

```json
{
  "tools": [
    {
      "name": "create_event",
      "description": "Create a new event with custom settings",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Event title"
          },
          "date": {
            "type": "string",
            "description": "Event date (ISO 8601 format)"
          },
          "location": {
            "type": "object",
            "properties": {
              "venueName": { "type": "string" },
              "address": { "type": "string" }
            }
          },
          "host": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "email": { "type": "string" }
            }
          },
          "options": {
            "type": "object",
            "properties": {
              "enablePotluck": { "type": "boolean" },
              "enableMusic": { "type": "boolean" },
              "customSubdomain": { "type": "string" }
            }
          }
        },
        "required": ["title", "date", "location", "host"]
      }
    },
    {
      "name": "get_event_stats",
      "description": "Get RSVP statistics for an event",
      "inputSchema": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "description": "Event ID or URL slug"
          }
        },
        "required": ["eventId"]
      }
    },
    {
      "name": "get_guest_list",
      "description": "Retrieve guest list with RSVP status",
      "inputSchema": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "description": "Event ID or URL slug"
          },
          "status": {
            "type": "string",
            "enum": ["going", "maybe", "cant_go", "all"],
            "description": "Filter by RSVP status"
          }
        },
        "required": ["eventId"]
      }
    },
    {
      "name": "get_potluck_summary",
      "description": "Get potluck food items by category",
      "inputSchema": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "description": "Event ID or URL slug"
          }
        },
        "required": ["eventId"]
      }
    },
    {
      "name": "get_music_playlist",
      "description": "Get song requests and AI-generated songs",
      "inputSchema": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "description": "Event ID or URL slug"
          }
        },
        "required": ["eventId"]
      }
    },
    {
      "name": "send_event_reminder",
      "description": "Send reminder email to guests",
      "inputSchema": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "description": "Event ID or URL slug"
          },
          "message": {
            "type": "string",
            "description": "Custom reminder message"
          },
          "recipientFilter": {
            "type": "string",
            "enum": ["all", "going", "maybe"],
            "description": "Who to send reminder to"
          }
        },
        "required": ["eventId"]
      }
    },
    {
      "name": "generate_qr_code",
      "description": "Generate QR code for event",
      "inputSchema": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "description": "Event ID or URL slug"
          },
          "size": {
            "type": "number",
            "description": "QR code size in pixels",
            "default": 512
          }
        },
        "required": ["eventId"]
      }
    }
  ]
}
```

### Resources (Data Endpoints)

```json
{
  "resources": [
    {
      "uri": "event://{eventId}",
      "name": "Event Details",
      "description": "Complete event configuration and settings",
      "mimeType": "application/json"
    },
    {
      "uri": "event://{eventId}/rsvps",
      "name": "RSVP List",
      "description": "All RSVPs with guest details",
      "mimeType": "application/json"
    },
    {
      "uri": "event://{eventId}/potluck",
      "name": "Potluck Summary",
      "description": "Food items organized by category",
      "mimeType": "application/json"
    },
    {
      "uri": "event://{eventId}/music",
      "name": "Music Playlist",
      "description": "Song requests and custom songs",
      "mimeType": "application/json"
    },
    {
      "uri": "event://{eventId}/qr",
      "name": "QR Code",
      "description": "Event QR code image",
      "mimeType": "image/png"
    },
    {
      "uri": "event://{eventId}/gallery",
      "name": "Photo Gallery",
      "description": "Event photo gallery album",
      "mimeType": "application/json"
    }
  ]
}
```

### Prompts (AI Templates)

```json
{
  "prompts": [
    {
      "name": "create_birthday_party",
      "description": "Create a birthday party event",
      "arguments": [
        {
          "name": "name",
          "description": "Birthday person's name",
          "required": true
        },
        {
          "name": "age",
          "description": "Age they're turning",
          "required": false
        },
        {
          "name": "date",
          "description": "Party date",
          "required": true
        }
      ]
    },
    {
      "name": "create_potluck",
      "description": "Create a community potluck event",
      "arguments": [
        {
          "name": "theme",
          "description": "Potluck theme",
          "required": false
        },
        {
          "name": "date",
          "description": "Event date",
          "required": true
        }
      ]
    },
    {
      "name": "summarize_rsvps",
      "description": "Generate RSVP summary for event",
      "arguments": [
        {
          "name": "eventId",
          "description": "Event ID",
          "required": true
        }
      ]
    }
  ]
}
```

---

## 🚀 API Endpoints

### Base URL
```
Production:  https://events-api.cloudpeers.com
Staging:     https://events-api-staging.cloudpeers.com
```

### Authentication
```
Authorization: Bearer <CLOUDPEERS_API_KEY>
```

### Endpoints

#### 1. Create Event
```http
POST /api/events/create
Content-Type: application/json

{
  "title": "Sarah's 30th Birthday",
  "date": "2025-03-15",
  "startTime": "19:00",
  "location": {
    "venueName": "The Rooftop Garden",
    "address": "123 Park Ave, NY"
  },
  "host": {
    "name": "Mike",
    "email": "mike@example.com"
  },
  "options": {
    "enablePotluck": false,
    "enableMusic": true,
    "customSubdomain": "sarahs30th"
  }
}

Response:
{
  "eventId": "abc123",
  "eventUrl": "https://sarahs30th.redheli.com",
  "qrCodeUrl": "https://sarahs30th.redheli.com/qr.png",
  "galleryUrl": "https://sarahs30th.redheli.com/gallery",
  "dashboardUrl": "https://events.cloudpeers.com/dashboard/abc123"
}
```

#### 2. Get Event Stats
```http
GET /api/events/{eventId}/stats

Response:
{
  "eventId": "abc123",
  "title": "Sarah's 30th Birthday",
  "totalRsvps": 65,
  "going": 45,
  "maybe": 12,
  "cantGo": 8,
  "capacity": 75,
  "spotsLeft": 30,
  "waitlist": 0
}
```

#### 3. Get Guest List
```http
GET /api/events/{eventId}/guests?status=going

Response:
{
  "eventId": "abc123",
  "guests": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "status": "going",
      "plusOnes": 1,
      "rsvpDate": "2025-01-15T10:30:00Z",
      "bringingFood": true,
      "musicContribution": "Dancing Queen - ABBA"
    }
  ]
}
```

#### 4. Get Potluck Summary
```http
GET /api/events/{eventId}/potluck

Response:
{
  "eventId": "abc123",
  "categories": {
    "Main Dish": {
      "itemCount": 5,
      "totalServings": 60,
      "items": [
        {
          "guest": "John Doe",
          "item": "Pasta Salad",
          "servings": 10,
          "dietary": ["Vegetarian"]
        }
      ]
    }
  }
}
```

#### 5. Get Music Playlist
```http
GET /api/events/{eventId}/music

Response:
{
  "eventId": "abc123",
  "playlist": [
    {
      "type": "song_request",
      "guest": "John Doe",
      "song": "Dancing Queen",
      "artist": "ABBA"
    },
    {
      "type": "custom_song",
      "guest": "Jane Smith",
      "prompt": "A funky celebration of Sarah's love for coffee",
      "generatedUrl": "https://suno.ai/song/xyz789",
      "played": false
    }
  ]
}
```

#### 6. Generate QR Code
```http
POST /api/events/{eventId}/qr
Content-Type: application/json

{
  "size": 512
}

Response:
{
  "qrCodeUrl": "https://sarahs30th.redheli.com/qr.png",
  "downloadUrl": "https://events-api.cloudpeers.com/download/qr/abc123.png"
}
```

---

## 🔐 Webhook Support

### Event Notifications

The service can send webhooks to cloudpeers for event tracking:

```json
{
  "webhooks": [
    {
      "event": "event.created",
      "description": "New event created"
    },
    {
      "event": "rsvp.received",
      "description": "New RSVP received"
    },
    {
      "event": "rsvp.updated",
      "description": "Guest changed RSVP status"
    },
    {
      "event": "waitlist.spot_available",
      "description": "Spot opened for waitlisted guest"
    },
    {
      "event": "potluck.item_added",
      "description": "Guest added food item"
    },
    {
      "event": "music.contribution_added",
      "description": "Guest added song/prompt"
    },
    {
      "event": "event.reminder_sent",
      "description": "Reminder email sent"
    }
  ]
}
```

---

## 💰 Pricing Tiers

### Free Tier
- 5 events per month
- Up to 50 guests per event
- Basic features (RSVP, QR codes)
- Path-based URLs only (`events.cloudpeers.com/e/...`)

### Pro Tier - $29/month
- Unlimited events
- Unlimited guests
- All features (Potluck, Music, Photo Gallery)
- Custom subdomains (*.redheli.com or *.cloudpeers.com)
- White-label branding
- Email support

### Enterprise - Custom Pricing
- Multiple organizations
- API access
- Custom integrations
- Dedicated support
- SLA guarantees

---

## 📊 Metrics & Analytics

### Service Metrics
```json
{
  "metrics": [
    {
      "name": "events_created",
      "type": "counter",
      "description": "Total events created"
    },
    {
      "name": "rsvps_received",
      "type": "counter",
      "description": "Total RSVPs received"
    },
    {
      "name": "potluck_items",
      "type": "counter",
      "description": "Total potluck items added"
    },
    {
      "name": "ai_songs_generated",
      "type": "counter",
      "description": "Total AI songs generated"
    },
    {
      "name": "qr_codes_generated",
      "type": "counter",
      "description": "Total QR codes generated"
    }
  ]
}
```

---

## 🧪 Example Use Cases

### 1. AI Agent Creates Birthday Party

```
Agent: "Create a birthday party for Sarah turning 30 on March 15, 2025"

MCP Call:
{
  "tool": "create_event",
  "arguments": {
    "title": "Sarah's 30th Birthday Bash",
    "date": "2025-03-15",
    "startTime": "19:00",
    "location": {
      "venueName": "To be announced",
      "address": "New York, NY"
    },
    "host": {
      "name": "Event Organizer",
      "email": "organizer@example.com"
    },
    "options": {
      "enableMusic": true,
      "customSubdomain": "sarahs30th"
    }
  }
}

Response:
{
  "eventUrl": "https://sarahs30th.redheli.com",
  "message": "Event created! Share this link with guests to RSVP."
}
```

### 2. Check Event Status

```
Agent: "How many people are coming to Sarah's party?"

MCP Call:
{
  "tool": "get_event_stats",
  "arguments": {
    "eventId": "sarahs30th"
  }
}

Response:
{
  "going": 45,
  "maybe": 12,
  "cantGo": 8,
  "spotsLeft": 30
}

Agent: "45 people are going, 12 maybe, 8 can't make it. There are 30 spots left!"
```

### 3. Generate Potluck Summary

```
Agent: "What food do we have for the potluck?"

MCP Call:
{
  "tool": "get_potluck_summary",
  "arguments": {
    "eventId": "community-potluck-2025"
  }
}

Response: Complete breakdown by category
```

---

## 🔗 Service Registration

### cloudpeers Marketplace Entry

```json
{
  "serviceId": "cloudpeers-events",
  "name": "cloudpeers Events",
  "tagline": "Beautiful event pages with RSVP, potluck, and AI music",
  "description": "Create and manage stunning event pages in minutes...",
  "category": "Event Management",
  "provider": "cloudpeers",
  "version": "1.0.0",
  "pricing": {
    "free": true,
    "paidTiers": ["pro", "enterprise"]
  },
  "features": [
    "Multi-response RSVP",
    "Potluck coordination",
    "AI music generation",
    "Custom subdomains",
    "QR codes",
    "Photo galleries",
    "White-label branding"
  ],
  "capabilities": {
    "tools": 7,
    "resources": 6,
    "prompts": 3
  },
  "urls": {
    "homepage": "https://events.cloudpeers.com",
    "docs": "https://docs.cloudpeers.com/services/custom-events",
    "api": "https://events-api.cloudpeers.com",
    "marketplace": "https://services.cloudpeers.com/cloudpeers-events"
  },
  "support": {
    "email": "support@cloudpeers.com",
    "docs": "https://docs.cloudpeers.com",
    "github": "https://github.com/jenklin/events"
  }
}
```

---

## 📝 Registration Checklist

- [x] Service manifest created
- [x] API endpoints defined
- [x] MCP tools specified
- [ ] API endpoints implemented
- [ ] Webhook handlers set up
- [ ] Marketplace listing submitted
- [ ] Pricing tiers configured
- [ ] Documentation published
- [ ] Example integrations created

---

**Next Steps:**
1. Implement API endpoints
2. Set up MCP server
3. Submit to cloudpeers marketplace
4. Launch! 🚀
