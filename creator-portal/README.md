# CloudPeers Events - Creator Portal

Modern event creation and management dashboard built with Next.js 14.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

**Local Development:** Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual Supabase credentials from:
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)

**Production/Deployment:** Credentials are stored in **GCP Secret Manager**:

The deployment uses these secrets from GCP Secret Manager:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

These secrets are automatically fetched during deployment and mounted to Cloud Run.

To view secrets:
```bash
gcloud secrets list --project=gen-lang-client-0243928474
```

To update a secret:
```bash
echo -n "your-new-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### 3. Verify Database Setup

Run the database verification script from the parent directory:

```bash
cd ..
node verify-database.js
```

This checks that all required tables exist:
- `events`
- `rsvp_responses`
- `guest_activity_log`
- `event_waitlist`
- `guest_comments`
- `reminder_queue`
- `event_metrics`

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3001

## Features

### Event Creation
- Step-by-step wizard interface
- Cover image selection (presets or custom upload)
- Date, time, and location management
- RSVP settings and capacity limits
- Potluck food tracking (optional)
- Music contributions (optional)
- Guest approval workflow
- Custom subdomains support

### Event Management
- View all created events
- Track RSVPs in real-time
- Manage guest approvals
- Export guest lists
- QR code generation
- Activity timeline

### RSVP System
- Going/Maybe/Can't Go responses
- Plus-ones support
- Waitlist when at capacity
- Email confirmations
- Check-in tracking

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deployment:** Google Cloud Run

## Project Structure

```
creator-portal/
├── app/
│   ├── api/                    # API routes
│   │   └── events/
│   │       ├── create/         # Event creation
│   │       └── [eventId]/      # Event-specific APIs
│   │           ├── rsvp/       # RSVP submission
│   │           ├── guests/     # Guest management
│   │           ├── stats/      # Event statistics
│   │           └── qr/         # QR code generation
│   ├── e/[eventId]/            # Event pages
│   ├── events/                 # Event list
│   ├── create/                 # Event creator wizard
│   └── layout.tsx              # Root layout
├── components/
│   ├── forms/                  # Multi-step form components
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── eventSchema.ts          # Validation schemas
└── .env.example                # Environment template

```

## Environment Setup

### Development
```bash
npm run dev              # Start dev server on port 3001
```

### Production Build
```bash
npm run build            # Build for production
npm start                # Start production server
```

## Database Schema

See `/events/templates/enhanced-event-database.sql` for the complete schema.

### Core Tables
1. **events** - Event details, settings, capacity
2. **rsvp_responses** - Guest RSVPs with status tracking
3. **guest_activity_log** - Activity timeline
4. **event_waitlist** - Waitlist management
5. **guest_comments** - Event messaging
6. **reminder_queue** - Automated emails
7. **event_metrics** - Analytics

### Views
- `event_summary` - Event overview with counts
- `guest_list` - Complete guest list
- `potluck_contributions` - Food tracking
- `potluck_summary` - Food by category
- `event_playlist` - Music requests

## Troubleshooting

### RSVP Submission Fails (500 Error)
**Cause:** Missing Supabase environment variables

**Fix:**
1. Ensure `.env.local` exists with valid credentials
2. Restart the dev server after adding env vars
3. Verify database tables exist with `node ../verify-database.js`

### Database Tables Missing
**Cause:** Database schema not set up

**Fix:**
1. Open Supabase SQL Editor
2. Copy contents of `/events/templates/enhanced-event-database.sql`
3. Run the SQL script

### Port Already in Use
**Cause:** Another process using port 3001

**Fix:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
npm run dev -- -p 3002
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly (especially RSVP flow)
4. Commit with clear messages
5. Push and create PR

## License

Copyright © 2025 CloudPeers. All rights reserved.
