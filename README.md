# CloudPeers Events Platform

> Complete event management platform with creator portal, event page generation, and photo galleries

## Overview

CloudPeers Events is a multi-tenant event management platform that provides:

1. **Creator Portal** - Modern dashboard to create and manage events
2. **Event Page Generator** - Generate branded event landing pages
3. **Photo Gallery** - Secure photo sharing with magic link authentication
4. **Registration System** - Handle event registrations with Supabase
5. **QR Code Generation** - Mobile-friendly event sharing
6. **Speaker Profiles** - Showcase speakers with photos and social links

## Quick Start

### Installation

```bash
# Install all dependencies for all apps
npm run install:all
```

### Development

```bash
# Start creator portal (http://localhost:3000)
npm run dev:portal

# Start photo gallery (http://localhost:3001)
npm run dev:gallery

# Generate an event page from config
npm run generate:event path/to/config.json

# Generate example event
npm run generate:example
```

## Directory Structure

```
cloudpeers-events/
├── creator-portal/          # Next.js creator dashboard
├── event-pages/            # Event page templates & generator
│   ├── templates/          # HTML templates
│   ├── generator/          # TypeScript generator
│   └── output/             # Generated pages
├── gallery/                # Photo gallery app (TBD)
├── api/                    # Shared API services
├── database/               # Database schema & migrations
├── shared/                 # Shared types & utilities
├── scripts/                # Deployment scripts
└── docs/                   # Documentation
```

## Features

### ✅ Implemented

- **Creator Portal UI** - Modern dashboard with shadcn/ui
- **CloudPeers Branding** - Maroon, tan, and grey color scheme
- **Event Page Template** - CloudPeers branded event landing page
- **Event Generator** - TypeScript generator for event pages
- **Type Definitions** - Complete TypeScript types
- **Registration Form** - Alpine.js form with Supabase integration
- **QR Code Generation** - Built-in QR code for event sharing
- **Speaker Profiles** - Display speakers with social links
- **Schedule Builder** - Dynamic schedule with time blocks
- **Responsive Design** - Mobile-first approach

### 🚧 In Progress

- **Photo Gallery Migration** - Moving from seoul-events-site
- **Registration API** - API routes for registration management
- **Analytics Dashboard** - Event metrics and insights
- **Email Notifications** - Automated confirmation emails

### 📋 Planned

- **Multi-platform Auth** - Recognize users from multiple platforms
- **Custom Domains** - Support for custom event domains
- **Capacity Management** - Waitlists and approval workflows
- **Calendar Integration** - Google Calendar and .ics export
- **Social Sharing** - Open Graph and Twitter cards

## Creating an Event

### 1. Create Configuration File

```json
{
  "event": {
    "id": "my-event-2026",
    "title": "My Amazing Event",
    "slug": "my-event-2026",
    "category": "Technology",
    "date": "March 15, 2026",
    "time": "6:00 PM - 9:00 PM",
    "description": "Join us for an amazing event!"
  },
  "venue": { ... },
  "schedule": [ ... ],
  "speakers": [ ... ],
  "registration": { ... },
  "integrations": { ... }
}
```

See `event-pages/example-config.json` for a complete example.

### 2. Generate Event Page

```bash
npm run generate:event path/to/your-config.json
```

This creates a fully functional event page at `event-pages/output/your-slug.html`

### 3. Deploy

Deploy the generated HTML file to:
- Cloudflare Pages
- Netlify
- Vercel
- Google Cloud Storage
- Any static hosting

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare Images
- **Deployment**: Google Cloud Run, Cloudflare Pages

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# App URLs
NEXT_PUBLIC_APP_URL=https://events.cloudpeers.com
```

## Scripts

```bash
# Development
npm run dev:portal          # Start creator portal
npm run dev:gallery         # Start photo gallery

# Build
npm run build:portal        # Build creator portal
npm run build:gallery       # Build photo gallery

# Event Generation
npm run generate:event <config>  # Generate event from config
npm run generate:example    # Generate example event

# Utilities
npm run install:all         # Install all dependencies
npm run clean               # Clean build artifacts
npm run typecheck           # TypeScript type checking
```

## Migration from Seoul-Events-Site

This platform is the evolution of the seoul-events-site with:

✅ **CloudPeers Branding** - Updated from Red Helicopter colors
✅ **TypeScript** - Type-safe event generation
✅ **Modern UI** - shadcn/ui components
✅ **Clean Architecture** - Organized directory structure
✅ **Better DX** - Improved developer experience

See `docs/MIGRATION_GUIDE.md` for detailed migration instructions.

## Documentation

- [New Structure](./NEW_STRUCTURE.md) - Architecture overview
- [Creator Portal](./creator-portal/README.md) - Portal documentation
- [Event Generator](./event-pages/README.md) - Generator guide
- [API Reference](./docs/API_REFERENCE.md) - API documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Copyright © 2025 CloudPeers. All rights reserved.

---

**Built with ❤️ by the CloudPeers Team**
