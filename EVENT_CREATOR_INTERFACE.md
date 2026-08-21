# Event Creator Interface - cloudpeers.com/events

## Overview

A user-friendly form at **cloudpeers.com/events** where anyone can create, customize, and publish events in minutes.

---

## 🎯 User Flow

```
1. Visit cloudpeers.com/events
2. Click "Create Event"
3. Fill in form (5-10 minutes)
4. Preview event page
5. Click "Publish"
6. Get event URL + QR code
```

---

## 📋 Form Interface Sections

### Section 1: Event Basics (Required)

```typescript
┌─────────────────────────────────────────────────────┐
│  Create Your Event                                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Event Title *                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ Sarah's 30th Birthday Bash                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Description                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Join us for an unforgettable celebration...   │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Cover Image                                         │
│  ○ Choose Theme:                                     │
│     ○ Classic  ○ Eclectic  ○ Fancy                  │
│     ○ Literary ○ Digital    ○ Elegant  ○ Simple     │
│  ○ Upload Custom Image                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Section 2: Date & Location

```typescript
┌─────────────────────────────────────────────────────┐
│  When & Where                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Date *                          Time *              │
│  ┌──────────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ March 15, 2025   │  │ 7:00 PM  │  │ 11:00 PM │  │
│  └──────────────────┘  └──────────┘  └──────────┘  │
│                        Start          End (optional) │
│                                                      │
│  Timezone                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ America/New_York ▼                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Venue Name *                                        │
│  ┌────────────────────────────────────────────────┐ │
│  │ The Rooftop Garden                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Address *                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ 123 Park Avenue, New York, NY 10016            │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ☐ Hide location until guests RSVP                  │
│                                                      │
│  Venue Plus Code (optional)                          │
│  ┌────────────────────────────────────────────────┐ │
│  │ 8Q98HXCR+2X                                    │ │
│  └────────────────────────────────────────────────┘ │
│  Google Maps → venue → Share → Plus code             │
│                                                      │
│  ☐ Publish this event to cloudpeers services         │
│     (off by default — see note)                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Added 2026-08-21 — Plus Code + publish to services.** The Plus Code is the venue's coordinate in a form that decodes offline (no geocoding API). **Publish this event to cloudpeers services** is the host's deliberate, reversible choice to contribute a read-only record of the event — title, date and times, venue name, the Plus Code coordinate, the event link and the gallery link — to cloudpeers labs and governed agents, so guests can compose scenes at the venue before, during and after the date and keep the story going in the gallery. **Off by default.** Address, password and guest list are never published. If *Hide location until guests RSVP* is on, the venue name and coordinate stay hidden from services too. Unpublished events are indistinguishable from nonexistent ones to services (404). Full contract: `08_PUBLISHING_TO_SERVICES.md`.

### Section 3: Guest Settings

```typescript
┌─────────────────────────────────────────────────────┐
│  Guest Management                                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Capacity                                            │
│  ○ Unlimited                                         │
│  ● Limited capacity                                  │
│     ┌────┐ guests                                    │
│     │ 75 │                                           │
│     └────┘                                           │
│     ☑ Enable waitlist when full                     │
│                                                      │
│  Plus Ones                                           │
│  ☑ Allow guests to bring plus ones                  │
│     Max per guest: ┌────┐                            │
│                    │ 1  │                            │
│                    └────┘                            │
│                                                      │
│  Approval                                            │
│  ☐ Require host approval for RSVPs                  │
│  ☑ Allow guests to invite friends                   │
│  ☑ Allow guests to upload photos                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Section 4: RSVP Options

```typescript
┌─────────────────────────────────────────────────────┐
│  RSVP Settings                                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Response Options                                    │
│  ☑ Going ✅      (Required)                          │
│  ☑ Maybe 🤔     (Required)                           │
│  ☑ Can't Go ❌  (Required)                           │
│                                                      │
│  Collect Guest Information                           │
│  ☑ Name (required)                                   │
│  ☑ Email (required)                                  │
│  ☑ Phone number (optional)                           │
│                                                      │
│  Custom Questions                                    │
│  ┌────────────────────────────────────────────────┐ │
│  │ + Add Question                                 │ │
│  │                                                │ │
│  │ 1. Dietary Restrictions (dropdown)             │ │
│  │    Options: None, Vegetarian, Vegan...         │ │
│  │                                                │ │
│  │ 2. Song Request (text)                         │ │
│  │    "What song should the DJ play?"             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Section 5: Optional Features

```typescript
┌─────────────────────────────────────────────────────┐
│  🍕 Potluck (Optional)                               │
├─────────────────────────────────────────────────────┤
│  ☑ Enable potluck food tracking                     │
│                                                      │
│  Food Categories                                     │
│  ☑ Appetizers    ☑ Main Dishes  ☑ Side Dishes       │
│  ☑ Desserts      ☑ Drinks                           │
│                                                      │
│  ☑ Show what others are bringing (avoid duplicates) │
│                                                      │
│  Instructions for Guests                             │
│  ┌────────────────────────────────────────────────┐ │
│  │ Please bring a dish to serve 8-10 people!     │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🎵 Music Contributions (Optional)                   │
├─────────────────────────────────────────────────────┤
│  ☑ Enable music contributions                        │
│                                                      │
│  Contribution Type                                   │
│  ○ Song requests only                                │
│  ○ AI-generated songs only                           │
│  ● Both (let guests choose)                          │
│                                                      │
│  AI Music Service                                    │
│  ○ Suno  ○ Udio  ○ Custom                           │
│                                                      │
│  Instructions for Guests                             │
│  ┌────────────────────────────────────────────────┐ │
│  │ Request a song OR write a prompt for a custom │ │
│  │ AI-generated song!                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Max songs per guest: ┌────┐                         │
│                       │ 1  │                         │
│                       └────┘                         │
└─────────────────────────────────────────────────────┘
```

### Section 6: Event URL & Branding

```typescript
┌─────────────────────────────────────────────────────┐
│  Event URL                                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Custom URL Slug *                                   │
│  events.cloudpeers.com/e/                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ sarahs-30th                                    │ │
│  └────────────────────────────────────────────────┘ │
│  ✓ Available                                         │
│                                                      │
│  🌟 Premium: Custom Subdomain                        │
│  ☑ Use custom subdomain                              │
│     ┌─────────────────┐  .  ┌──────────────────┐    │
│     │ sarahs30th      │  .  │ redheli.com    ▼│    │
│     └─────────────────┘     └──────────────────┘    │
│                             or cloudpeers.com        │
│  Your event will be at: sarahs30th.redheli.com       │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Branding (Optional)                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Organization Name                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ cloudpeers Events                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Logo                                                │
│  [Upload Logo] or enter URL                          │
│                                                      │
│  Colors                                              │
│  Primary:   ┌────────┐  ◉ #FF6B6B                   │
│  Secondary: ┌────────┐  ◉ #4ECDC4                   │
│  Accent:    ┌────────┐  ◉ #FFE66D                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Section 7: Visibility & Sharing

```typescript
┌─────────────────────────────────────────────────────┐
│  Visibility & Privacy                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Event Visibility                                    │
│  ○ Public (anyone with link can view and RSVP)      │
│  ● Private (invite only)                             │
│                                                      │
│  Guest List Display                                  │
│  ☑ Show guest names                                  │
│  ☑ Show guest count                                  │
│  ☑ Show guest photos                                 │
│  ☑ Show when people RSVP'd                           │
│                                                      │
│  Optional Password Protection                        │
│  ☐ Require password to view event                    │
│     Password: ┌──────────────────────────────────┐  │
│              │                                   │  │
│              └──────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Section 8: Additional Details (Optional)

```typescript
┌─────────────────────────────────────────────────────┐
│  More Details                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Event Cost                                          │
│  ☐ This event has a cost                             │
│     $ ┌────────┐  per person                         │
│       │ 25.00  │                                     │
│       └────────┘                                     │
│     Description:                                     │
│     ┌────────────────────────────────────────────┐  │
│     │ Covers food, drinks, and venue             │  │
│     └────────────────────────────────────────────┘  │
│                                                      │
│  Event Schedule/Agenda                               │
│  [+ Add Schedule Item]                               │
│                                                      │
│  7:00 PM - Arrival & Welcome Drinks                  │
│  8:00 PM - Dinner Service                            │
│  9:00 PM - Birthday Toasts & Cake                    │
│  9:30 PM - Dance Party                               │
│                                                      │
│  Photo Gallery                                       │
│  ☑ Create private photo gallery for this event       │
│     (Guests can view/download photos after event)    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Preview & Publish Screen

```typescript
┌─────────────────────────────────────────────────────┐
│  Preview Your Event                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Event Landing Page Preview]                        │
│  ┌────────────────────────────────────────────────┐ │
│  │  🎉 Sarah's 30th Birthday Bash                 │ │
│  │  ----------------------------------------       │ │
│  │  March 15, 2025 • 7:00 PM                      │ │
│  │  The Rooftop Garden                            │ │
│  │                                                │ │
│  │  [RSVP Button]                                 │ │
│  │                                                │ │
│  │  45 Going • 12 Maybe • 30 spots left           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Your Event URL:                                     │
│  🔗 https://sarahs30th.redheli.com                   │
│     [Copy Link]  [Download QR Code]                 │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │         [QR Code Image]                        │ │
│  │                                                │ │
│  │     Scan to RSVP                               │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [← Back to Edit]    [Publish Event →]              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 After Publishing

```typescript
┌─────────────────────────────────────────────────────┐
│  ✅ Event Published!                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Your event is live at:                              │
│  🔗 https://sarahs30th.redheli.com                   │
│     [Copy Link]  [Share on Social Media]            │
│                                                      │
│  Event Management                                    │
│  📊 [View Dashboard]  - See RSVPs, guest list        │
│  ✏️  [Edit Event]     - Make changes                 │
│  📧 [Email Guests]    - Send updates                 │
│  📥 [Download QR Code] - For printing                │
│  📤 [Export Guest List] - CSV/Excel                  │
│                                                      │
│  Next Steps:                                         │
│  1. Share your event link with guests                │
│  2. Print QR codes for invitations                   │
│  3. Monitor RSVPs in your dashboard                  │
│  4. Send reminders before the event                  │
│                                                      │
│  [Go to Dashboard →]                                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Technical Implementation

### Frontend (cloudpeers.com/events)

```typescript
// React app with form builder
/events
  /create        - Main event creation form
  /preview/:id   - Preview before publishing
  /dashboard/:id - Event management dashboard

// Key components:
- EventCreatorForm.tsx     - Multi-step form
- ThemeSelector.tsx        - Cover theme picker
- PotluckSettings.tsx      - Potluck configuration
- MusicSettings.tsx        - Music contribution setup
- URLBuilder.tsx           - Custom URL/subdomain
- BrandingEditor.tsx       - Logo, colors
- EventPreview.tsx         - Live preview
- QRCodeGenerator.tsx      - Auto QR generation
```

### API Endpoints

```typescript
POST   /api/events/create
  - Creates event from form data
  - Validates subdomain availability
  - Generates event page
  - Returns event URL + QR code

GET    /api/events/:eventId/preview
  - Returns preview data

PATCH  /api/events/:eventId
  - Update event settings

POST   /api/events/:eventId/publish
  - Publishes event
  - Creates gallery album
  - Sends confirmation email

GET    /api/events/:eventId/dashboard
  - RSVP stats
  - Guest list
  - Potluck summary
  - Music playlist
```

### Data Flow

```
1. User fills form
   ↓
2. Frontend validates + formats data
   ↓
3. POST /api/events/create
   ↓
4. Backend:
   - Insert into events table
   - Check subdomain availability
   - Generate QR code
   - Create gallery album
   - Return event URLs
   ↓
5. Frontend shows preview
   ↓
6. User clicks "Publish"
   ↓
7. Event goes live at custom URL
```

---

## 📱 Mobile-Friendly Form

```
┌─────────────────────┐
│  Create Event       │
├─────────────────────┤
│                     │
│ Step 1 of 7         │
│ ████████░░░░░░░░    │
│                     │
│ Event Basics        │
│ ┌─────────────────┐ │
│ │ Event Title     │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ [Continue →]        │
│                     │
└─────────────────────┘
```

---

## 🎨 Form Templates (Quick Start)

```typescript
Pre-filled templates for common events:

1. Birthday Party
   - Cover: Fancy theme
   - Capacity: 50 guests
   - Features: Music contributions, photo gallery

2. Community Potluck
   - Cover: Eclectic theme
   - Features: Potluck tracking enabled
   - Visibility: Public

3. Fundraiser
   - Cover: Elegant theme
   - Approval required
   - Cost per person: $50

4. Corporate Event
   - Cover: Digital theme
   - White-label branding
   - Custom subdomain
   - Guest approval required

User clicks template → Form pre-fills → User customizes
```

---

## 🔧 Form Validation

```typescript
Required Fields:
✓ Event title
✓ Date & time
✓ Venue name
✓ Address
✓ URL slug (auto-generated from title, editable)

Validation Rules:
✓ URL slug: alphanumeric + hyphens only
✓ Subdomain: check availability via API
✓ Date: must be future date
✓ Capacity: if enabled, must be > 0
✓ Email notifications: valid email template

Smart Defaults:
✓ Timezone: Auto-detect from browser
✓ URL slug: Auto-generate from title
✓ RSVP options: All three enabled
✓ Guest info: Name + email required
```

---

## 💾 Save Draft Feature

```typescript
┌─────────────────────────────────────────────────────┐
│  Your draft has been saved                           │
│  Resume anytime at:                                  │
│  cloudpeers.com/events/draft/abc123                  │
│                                                      │
│  [Continue Editing]  [Discard Draft]                │
└─────────────────────────────────────────────────────┘

// Auto-save every 30 seconds
// Persists in localStorage + backend
// Expire after 7 days
```

---

## 🎯 Next Steps to Build This

1. **Create React Form** (2-3 days)
   - Multi-step wizard
   - Form validation
   - Live preview

2. **Build API** (2-3 days)
   - Event creation endpoint
   - Subdomain validation
   - QR code generation

3. **Event Landing Pages** (2-3 days)
   - Dynamic template rendering
   - RSVP form
   - Guest list display

4. **Dashboard** (2-3 days)
   - Host management interface
   - Analytics
   - Guest communication

5. **Deploy** (1 day)
   - cloudpeers.com/events
   - Wildcard subdomains
   - SSL certificates

**Total**: ~2 weeks for MVP

---

**Ready to implement?** Start with the form interface and I can help build it out!
