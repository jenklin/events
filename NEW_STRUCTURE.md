# CloudPeers Events Platform - New Directory Structure

## Proposed Clean Structure

```
cloudpeers-mcp/events/
├── README.md                          # Main project overview
├── package.json                       # Root package.json for scripts
│
├── creator-portal/                    # Next.js Creator Dashboard (already built)
│   ├── app/                          # Next.js 14 app directory
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── create/page.tsx           # Event creation wizard
│   │   ├── events/[id]/page.tsx      # Event details/edit
│   │   └── api/                      # API routes
│   ├── components/                   # UI components
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/                          # Utilities
│   ├── public/                       # Static assets
│   └── package.json
│
├── event-pages/                       # Generated event landing pages
│   ├── templates/                    # Event page templates
│   │   ├── default.html              # Default template (CloudPeers branded)
│   │   ├── minimal.html              # Minimal template
│   │   └── premium.html              # Premium template
│   ├── generator/                    # Event generator
│   │   ├── generate.ts               # TypeScript generator
│   │   └── config.schema.ts          # Config validation
│   └── output/                       # Generated event pages
│       └── .gitkeep
│
├── gallery/                          # Photo gallery system (Next.js)
│   ├── app/                          # Next.js app
│   │   ├── login/page.tsx            # Magic link login
│   │   ├── albums/[id]/page.tsx      # Album viewer
│   │   └── api/                      # Gallery API
│   ├── lib/                          # Gallery utilities
│   │   ├── auth.ts                   # Multi-platform auth
│   │   └── cloudflare.ts             # Cloudflare Images
│   └── package.json
│
├── api/                              # Shared API services
│   ├── registration/                 # Registration endpoints
│   ├── qr-codes/                     # QR code generation
│   ├── speakers/                     # Speaker profiles
│   └── analytics/                    # Event analytics
│
├── database/                         # Database setup & migrations
│   ├── schema.sql                    # Supabase schema
│   ├── migrations/                   # Database migrations
│   └── seed.sql                      # Seed data
│
├── shared/                           # Shared code across apps
│   ├── types/                        # TypeScript types
│   ├── utils/                        # Utility functions
│   └── config/                       # Shared configuration
│
├── scripts/                          # Deployment & utility scripts
│   ├── deploy-creator.sh             # Deploy creator portal
│   ├── deploy-gallery.sh             # Deploy gallery
│   ├── deploy-event.sh               # Deploy single event
│   └── setup-database.sh             # Database setup
│
└── docs/                             # Documentation
    ├── MIGRATION_GUIDE.md            # Migration from seoul-events
    ├── API_REFERENCE.md              # API documentation
    ├── DEPLOYMENT.md                 # Deployment guide
    └── FEATURES.md                   # Feature documentation
```

## What Gets Migrated Where

### From Seoul-Events-Site → CloudPeers Events

**Event Generator** (`template.html`, `generate-event.js`):
- → `event-pages/templates/default.html` (with CloudPeers branding)
- → `event-pages/generator/generate.ts` (TypeScript version)

**Gallery** (`/gallery` folder):
- → `gallery/` (updated with CloudPeers branding)
- Keep magic link authentication
- Update Cloudflare Images integration

**Registration System** (Supabase integration):
- → `api/registration/` (API routes)
- → `creator-portal/app/api/registrations/` (Next.js API)

**QR Code Generation**:
- → `api/qr-codes/` (API route)
- → `creator-portal/app/api/events/[id]/qr/` (already exists, enhance)

**Config Structure**:
- → `shared/types/event.ts` (TypeScript interfaces)
- → `event-pages/generator/config.schema.ts` (Zod validation)

## Benefits of New Structure

1. **Clear Separation**: Creator portal, event pages, and gallery are separate
2. **Shared Code**: Common utilities and types in `/shared`
3. **Type Safety**: TypeScript everywhere
4. **Modern Stack**: Next.js 14, React 18, shadcn/ui
5. **CloudPeers Branded**: All templates use CloudPeers colors
6. **Maintainable**: Clear organization, easy to find code
7. **Scalable**: Easy to add new features

## Migration Steps

1. Create new directory structure
2. Move existing creator-portal code to new location
3. Migrate event generator with CloudPeers branding
4. Migrate gallery system
5. Create shared types and utilities
6. Update all import paths
7. Test end-to-end
8. Clean up old files
9. Update documentation

## Current Status

✅ Creator Portal UI built with shadcn/ui
❌ Event generator not migrated yet
❌ Gallery not migrated yet
❌ Registration API not migrated yet
❌ QR code generation needs enhancement
❌ Speaker profiles not built yet

---

**Next**: Execute migration plan
