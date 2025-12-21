# Partiful-Enhanced Event Template - Complete Guide

## Overview

This template system provides **feature parity with Partiful** (https://partiful.com/create) while retaining all existing CloudPeers Events features including QR codes, photo galleries, and white-label branding.

## 🎯 Key Features

### ✅ Core Partiful Features
- **Multi-response RSVP**: Going ✅ / Maybe 🤔 / Can't Go ❌
- **Guest Management**: Approval workflow, waitlist, mutual invites
- **Cover Themes**: 7 preset themes (Classic, Eclectic, Fancy, Literary, Digital, Elegant, Simple)
- **Hidden Location**: Hide venue details until RSVP
- **Guest Photos**: Allow guests to upload profile photos
- **Activity Timeline**: Track when guests RSVP, share, comment
- **Public/Private Events**: Control visibility and guest list display
- **Plus Ones**: Configurable guest limits per RSVP

### 🎉 Enhanced Features (Beyond Partiful)
- **Potluck Management** (OPTIONAL): Track what each guest is bringing
- **Music Contributions** (OPTIONAL): Song requests OR AI-generated custom songs
- **QR Codes**: Auto-generated for easy event sharing (retained from existing system)
- **Photo Galleries**: Private albums with magic link auth (retained from existing system)
- **White-Label Branding**: Full customization per organization
- **Calendar Integration**: Google Calendar + .ics downloads

---

## 📋 Complete Feature Comparison

| Feature | Partiful | CloudPeers Enhanced | Notes |
|---------|----------|---------------------|-------|
| **Event Details** |
| Event title | ✅ | ✅ | Required |
| Cover image/theme | ✅ | ✅ | 7 preset themes + custom |
| Host nickname | ✅ | ✅ | Optional |
| Date/time with timezone | ✅ | ✅ | Full timezone support |
| Location | ✅ | ✅ | With hide-until-RSVP option |
| Description | ✅ | ✅ | Multi-line support |
| Capacity limits | ✅ | ✅ | With waitlist |
| Cost per person | ✅ | ✅ | Optional pricing |
| **RSVP & Guests** |
| Going/Maybe/Can't Go | ✅ | ✅ | Emoji-based responses |
| Guest approval | ✅ | ✅ | Host must approve |
| Plus ones | ✅ | ✅ | Configurable limit |
| Guest photos | ✅ | ✅ | Optional uploads |
| Mutual invites | ✅ | ✅ | Guests invite contacts |
| **Visibility** |
| Public/private | ✅ | ✅ | Flexible settings |
| Show guest list | ✅ | ✅ | Configurable display |
| Show guest count | ✅ | ✅ | On/off toggle |
| Activity timestamps | ✅ | ✅ | When people RSVP'd |
| **Host Tools** |
| Quick reminders | ✅ | ✅ | Automated emails |
| Guest approval | ✅ | ✅ | Bulk approval |
| Export guest list | ✅ | ✅ | CSV/JSON export |
| **Enhanced Features** |
| QR code generation | ❌ | ✅ | Auto-generated |
| Photo gallery | ❌ | ✅ | Private with magic links |
| Potluck tracking | ❌ | ✅ | OPTIONAL: Food assignments |
| Music contributions | ❌ | ✅ | OPTIONAL: Songs or AI-generated |
| White-label branding | ❌ | ✅ | Full customization |
| CloudPeers MCP | ❌ | ✅ | A2A integration |

---

## 🗂️ Template Structure

### 1. Event Configuration (TypeScript)

See `partiful-enhanced-schema.ts` for complete interface.

**Key sections:**
```typescript
{
  branding: { /* Organization colors, logos, fonts */ },
  event: {
    title, description, coverImage, host, dateTime, location, capacity, cost
  },
  rsvp: {
    responseTypes: ['going', 'maybe', 'cant_go'],
    guestManagement: { requireApproval, allowPlusOnes, allowMutualInvites },
    potluck?: { /* OPTIONAL potluck settings */ },
    musicContributions?: { /* OPTIONAL music settings */ }
  },
  visibility: { isPublic, guestList, sharing },
  links: { gallery, qrCode, calendar }
}
```

### 2. Database Schema (PostgreSQL)

See `partiful-database-schema.sql` for complete schema.

**Core tables:**
- `events` - Event details with Partiful-enhanced fields
- `rsvp_responses` - Guest RSVPs with status, plus ones, food, music
- `guest_activity_log` - Timeline of all guest actions
- `event_waitlist` - Waitlist with position tracking
- `guest_comments` - Optional comment threads
- `reminder_queue` - Automated email reminders

**Helpful views:**
- `event_summary` - RSVP counts and stats
- `guest_list` - Complete guest roster
- `potluck_contributions` - What everyone is bringing
- `potluck_summary` - Food by category
- `event_playlist` - Song requests and custom songs

---

## 🎨 Event Types & Examples

### Example 1: Birthday Party (like Partiful)

```json
{
  "event": {
    "title": "Sarah's 30th Birthday Bash 🎉",
    "coverImage": { "type": "preset", "theme": "fancy" },
    "capacity": { "enabled": true, "maxGuests": 75, "enableWaitlist": true },
    "cost": { "hasCost": true, "amount": 25, "perPerson": true }
  },
  "rsvp": {
    "enabled": true,
    "guestManagement": {
      "requireApproval": false,
      "allowPlusOnes": true,
      "maxPlusOnes": 1
    },
    "musicContributions": {
      "enabled": true,
      "type": "both",
      "instructions": "Request a song OR write a custom song prompt!"
    }
  },
  "visibility": {
    "isPublic": false,
    "guestList": { "showGuestNames": true, "showActivityTimestamps": true }
  }
}
```

### Example 2: Community Potluck

```json
{
  "event": {
    "title": "Summer Community Potluck",
    "coverImage": { "type": "preset", "theme": "eclectic" },
    "location": { "hideUntilRsvp": false },
    "capacity": { "enabled": false }
  },
  "rsvp": {
    "enabled": true,
    "potluck": {
      "enabled": true,
      "categories": ["Appetizer", "Main Dish", "Side Dish", "Dessert", "Drinks"],
      "showWhatOthersBring": true,
      "instructions": "Bring a dish to serve 8-10 people!"
    }
  },
  "visibility": { "isPublic": true }
}
```

### Example 3: Private Fundraiser

```json
{
  "event": {
    "title": "Annual Charity Gala",
    "coverImage": { "type": "preset", "theme": "elegant" },
    "cost": { "hasCost": true, "amount": 150, "perPerson": true }
  },
  "rsvp": {
    "enabled": true,
    "guestManagement": {
      "requireApproval": true,
      "allowMutualInvites": false
    }
  },
  "visibility": {
    "isPublic": false,
    "guestList": { "showGuestNames": false }
  }
}
```

---

## 🔗 Integration with Existing Features

### QR Code Generation (Retained)

**Auto-generated for every event:**
```typescript
// Option 1: Path-based URL (default)
// Event URL: https://events.cloudpeers.com/e/sarahs-30th
// QR Code: https://events.cloudpeers.com/e/sarahs-30th/qr.png

// Option 2: Custom subdomain (NEW!)
// Event URL: https://sarahs30th.redheli.com
// QR Code: https://sarahs30th.redheli.com/qr.png

// Database fields
events.event_id → "sarahs-30th" (required)
events.custom_subdomain → "sarahs30th" (optional)
events.subdomain_provider → "redheli.com" or "cloudpeers.com" (optional)

// Used in template
visibility.sharing.generateQRCode = true
visibility.sharing.customSubdomain = {
  enabled: true,
  subdomain: "sarahs30th",
  provider: "redheli.com"
}
```

### Custom Subdomain Options (NEW!)

**Two URL schemes available:**

**1. Path-Based (Default)**
```
events.cloudpeers.com/e/sarahs-30th
events.cloudpeers.com/e/techsummit2025
events.cloudpeers.com/e/birthday-bash
```

**2. Custom Subdomain**
```
sarahs30th.redheli.com
techsummit.cloudpeers.com
birthdaybash.redheli.com
```

**Configuration:**
```typescript
{
  visibility: {
    sharing: {
      customSlug: "sarahs-30th",  // Always required

      // Add this for custom subdomain
      customSubdomain: {
        enabled: true,
        subdomain: "sarahs30th",  // Only alphanumeric + hyphens
        provider: "redheli.com"   // or "cloudpeers.com"
      }
    }
  }
}
```

**DNS Setup:**
- Wildcard DNS required: `*.redheli.com` → CloudFlare/Cloud Run
- Wildcard DNS required: `*.cloudpeers.com` → CloudFlare/Cloud Run
- SSL certificates auto-managed by Cloudflare

**When to use subdomains:**
- Premium events that need branded URLs
- Corporate events (techsummit.cloudpeers.com)
- Personal celebrations (sarahs30th.redheli.com)
- Better for social sharing (shorter, memorable URLs)

**When to use path-based:**
- Quick events
- Internal testing
- Don't need custom branding for URL

### Photo Gallery Integration (Retained)

**Linked from event page:**
```typescript
// Gallery URL in event config
links.gallery = "https://events.cloudpeers.com/gallery/album-id"

// Database integration
- Create gallery album when event is created
- Album inherits event branding
- Magic link auth for RSVP'd guests only
```

**Flow:**
1. Event created → Gallery album auto-created
2. Guest RSVPs → Added to gallery access list
3. After event → Host uploads photos
4. Guests receive magic link → View/download photos

### White-Label Branding (Enhanced)

**Applied to:**
- Event landing page
- RSVP form
- Confirmation emails
- Reminder emails
- Photo gallery
- QR code design (optional)

```typescript
branding: {
  organizationName: "Your Organization",
  logo: { url: "...", height: 48 },
  colors: {
    primary: "#FF6B6B",
    secondary: "#4ECDC4",
    accent: "#FFE66D"
  }
}
```

---

## 📱 User Journey Examples

### Standard RSVP Flow

1. **Guest receives invite** (email with QR code)
2. **Scans QR or clicks link** → Event landing page
3. **Views event details** (location may be hidden)
4. **Clicks "RSVP"**
5. **Selects response**: Going ✅ / Maybe 🤔 / Can't Go ❌
6. **Fills out form:**
   - Name, email, phone
   - Plus ones (if allowed)
   - Custom fields (dietary restrictions, etc.)
   - **Potluck** (OPTIONAL): What are you bringing?
   - **Music** (OPTIONAL): Song request or custom prompt
7. **Submits RSVP**
8. **Receives confirmation email** with:
   - Event details (location now visible if it was hidden)
   - Calendar invite (.ics)
   - Gallery link (after event)

### Potluck Flow (Optional)

1. **Guest RSVPs** → Sees potluck section
2. **Adds food items:**
   ```json
   {
     "name": "Pasta Salad",
     "category": "Side Dish",
     "servings": 10,
     "dietaryInfo": ["Vegetarian", "Gluten-free"]
   }
   ```
3. **Views what others are bringing** (if enabled)
4. **Host sees potluck summary** by category
5. **Before event:** Host sends reminder with food list

### Music Contribution Flow (Optional)

**Option A: Song Request**
1. Guest RSVPs → Music section
2. Chooses "Request a Song"
3. Enters: "Dancing Queen - ABBA"
4. Song added to event playlist

**Option B: Custom AI Song**
1. Guest RSVPs → Music section
2. Chooses "Create Custom Song"
3. Enters: "A funky celebration of Sarah's love for coffee and adventure"
4. Song queued for AI generation (Suno/Udio)
5. Generated song added to playlist
6. Song played at event

---

## 🎯 Implementation Checklist

### Phase 1: Database Setup
- [ ] Run `partiful-database-schema.sql`
- [ ] Verify all tables created
- [ ] Test views and triggers
- [ ] Seed sample event

### Phase 2: API Development
- [ ] Event creation endpoint with Partiful fields
- [ ] RSVP submission with multi-response types
- [ ] Waitlist management
- [ ] Guest approval workflow
- [ ] Potluck CRUD operations (optional)
- [ ] Music contribution endpoints (optional)
- [ ] QR code generation
- [ ] Gallery album creation

### Phase 3: Frontend Components
- [ ] Event landing page with cover themes
- [ ] RSVP form with conditional fields
- [ ] Guest list with status grouping
- [ ] Potluck tracker (optional)
- [ ] Playlist viewer (optional)
- [ ] Activity timeline
- [ ] Host dashboard

### Phase 4: Email Templates
- [ ] RSVP confirmation (branded)
- [ ] Approval notifications
- [ ] Waitlist notifications
- [ ] Reminder emails
- [ ] Gallery access emails

### Phase 5: Integrations
- [ ] QR code generator
- [ ] Calendar (.ics) generation
- [ ] Gallery magic links
- [ ] AI music service (Suno/Udio)
- [ ] CloudPeers MCP webhooks

---

## 🚀 Quick Start

### Create Your First Event

```bash
# 1. Use the TypeScript template
cp partiful-enhanced-schema.ts my-event-config.ts

# 2. Customize your event
# - Set event details
# - Configure RSVP options
# - Enable optional features (potluck, music)
# - Set branding

# 3. Generate event page
node generate-event.js my-event-config.json

# 4. Event created with:
# - Landing page: events.cloudpeers.com/e/my-event
# - QR code: events.cloudpeers.com/e/my-event/qr.png
# - Gallery: events.cloudpeers.com/gallery/my-event-album
```

---

## 📊 Database Queries

### Get RSVP Summary with URLs
```sql
SELECT
  event_id,
  title,
  event_url,
  qr_code_url,
  gallery_url,
  going_count,
  maybe_count,
  cant_go_count,
  pending_count,
  current_guest_count,
  max_guests
FROM event_summary
WHERE event_id = 'sarahs-30th';

-- Example output:
-- event_id: sarahs-30th
-- title: Sarah's 30th Birthday Bash
-- event_url: https://sarahs30th.redheli.com (if subdomain enabled)
--            OR https://events.cloudpeers.com/e/sarahs-30th (if path-based)
-- qr_code_url: https://sarahs30th.redheli.com/qr.png
-- gallery_url: https://sarahs30th.redheli.com/gallery
-- going_count: 45
-- maybe_count: 12
-- cant_go_count: 8
```

### View Guest List by Status
```sql
SELECT guest_name, status, plus_ones, created_at
FROM rsvp_responses
WHERE event_id = (SELECT id FROM events WHERE event_id = 'sarahs-30th')
ORDER BY status, created_at;
```

### Potluck Summary
```sql
SELECT * FROM potluck_summary WHERE event_id = 'sarahs-30th';
```

### Music Playlist
```sql
SELECT guest_name, song_request, custom_prompt
FROM event_playlist
WHERE event_id = 'sarahs-30th'
ORDER BY submitted_at;
```

### Guest Activity Timeline
```sql
SELECT guest_name, activity_type, activity_data, created_at
FROM guest_activity_log
WHERE event_id = (SELECT id FROM events WHERE event_id = 'sarahs-30th')
ORDER BY created_at DESC;
```

---

## 🎨 Customization Examples

### Theme Presets

**Fancy Theme:**
```json
{
  "coverImage": { "type": "preset", "theme": "fancy" },
  "branding": {
    "colors": {
      "primary": "#D4AF37",
      "secondary": "#1A1A2E",
      "accent": "#E94560"
    }
  }
}
```

**Eclectic Theme:**
```json
{
  "coverImage": { "type": "preset", "theme": "eclectic" },
  "branding": {
    "colors": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4",
      "accent": "#FFE66D"
    }
  }
}
```

### Custom Branding

```json
{
  "branding": {
    "organizationName": "Tech Startup Inc",
    "logo": {
      "url": "https://cdn.example.com/logo.png",
      "height": 64
    },
    "colors": {
      "primary": "#5E60CE",
      "secondary": "#240046",
      "accent": "#10002B"
    },
    "fonts": {
      "heading": "Poppins, sans-serif",
      "body": "Inter, sans-serif"
    }
  }
}
```

---

## 📝 Next Steps

1. **Review** `partiful-enhanced-schema.ts` - Understand the full interface
2. **Run** `partiful-database-schema.sql` - Set up database
3. **Create** your first event configuration
4. **Test** RSVP flow with optional features
5. **Deploy** to production

---

## 🔗 Related Documentation

- `03_EVENT_TEMPLATE_ENGINE.md` - Template generation system
- `04_GALLERY_SYSTEM.md` - Photo gallery integration
- `05_DATABASE_SCHEMA.md` - Complete database design
- `QUICK_START.md` - Get running in 2 hours

---

## 💡 Tips & Best Practices

### For Birthday Parties
- Enable music contributions for fun custom songs
- Use "Fancy" or "Eclectic" themes
- Set capacity + waitlist to manage space
- Hide location until RSVP for surprise parties

### For Potlucks
- Enable potluck tracking
- Set `showWhatOthersBring: true` to avoid duplicates
- Suggest categories in instructions
- Send reminder with food list 2 days before

### For Fundraisers
- Require approval for exclusive events
- Show guest count but not names (privacy)
- Disable mutual invites
- Set cost per person clearly

### For Corporate Events
- Use white-label branding
- Collect custom fields (company, role)
- Enable check-ins for attendance tracking
- Generate QR codes for registration desk

---

**Last Updated**: December 21, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for implementation
