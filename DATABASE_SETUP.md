# Database Setup Instructions

## Prerequisites

The Custom Events service uses the same Supabase instance as cloudpeers-mcp:
- **Supabase URL**: `https://efpspxzgvbsqfyelbkdw.supabase.co`
- **Project**: CloudPeers MCP

## Setup Steps

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/efpspxzgvbsqfyelbkdw
   - Or navigate to your Supabase project

2. **Access SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute Schema**
   - Copy the entire contents of `templates/enhanced-event-database.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see these tables:
     - `events`
     - `rsvp_responses`
     - `guest_activity_log`
     - `event_waitlist`
     - `guest_comments`
     - `reminder_queue`
     - `event_metrics`

5. **Verify Views Created**
   - In SQL Editor, run:
     ```sql
     SELECT table_name
     FROM information_schema.views
     WHERE table_schema = 'public';
     ```
   - You should see:
     - `event_summary`
     - `guest_list`
     - `potluck_contributions`
     - `potluck_summary`
     - `event_playlist`

### Option 2: Direct Database Connection (Advanced)

If you have `psql` installed:

```bash
# Using the session pooler connection
psql "postgresql://postgres.efpspxzgvbsqfyelbkdw:hzNGRiuDdn9w9c8T@aws-1-us-east-2.pooler.supabase.com:5432/postgres" \
  -f templates/enhanced-event-database.sql
```

## Database Schema Overview

### Core Tables

1. **events** - Event details with custom subdomain support
   - Supports `*.redheli.com` and `*.cloudpeers.com` subdomains
   - Potluck settings (optional)
   - Music contribution settings (optional)
   - QR code generation
   - Photo gallery integration

2. **rsvp_responses** - Guest RSVPs
   - Going/Maybe/Can't Go statuses
   - Plus-ones support
   - Potluck food items (JSONB)
   - Music contributions (JSONB)
   - Approval workflow

3. **guest_activity_log** - Activity tracking
4. **event_waitlist** - Waitlist management
5. **guest_comments** - Guest comments/messages
6. **reminder_queue** - Automated email reminders
7. **event_metrics** - Analytics and metrics

### Database Functions

- `get_event_url(event_row)` - Generates full event URL (subdomain or path-based)
- `get_qr_code_url(event_row)` - Generates QR code URL
- `get_gallery_url(event_row)` - Generates gallery URL
- Auto-update triggers for guest counts

### Database Views

- `event_summary` - Event overview with RSVP counts
- `guest_list` - Guest list with details
- `potluck_contributions` - Food items by guest
- `potluck_summary` - Food items by category
- `event_playlist` - Song requests and custom songs

## Row Level Security (RLS)

The schema includes RLS policies for:
- Public event viewing
- Host-only event management
- Guest RSVP access
- Activity log visibility

## Verify Setup

Run this query in Supabase SQL Editor to verify everything is set up:

```sql
-- Check tables
SELECT
  'events' as table_name,
  COUNT(*) as count
FROM events
UNION ALL
SELECT 'rsvp_responses', COUNT(*) FROM rsvp_responses
UNION ALL
SELECT 'guest_activity_log', COUNT(*) FROM guest_activity_log
UNION ALL
SELECT 'event_waitlist', COUNT(*) FROM event_waitlist;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%';

-- Check views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
```

## Next Steps

After database setup is complete:

1. ✅ Start the development server:
   ```bash
   cd app
   npm run dev
   ```

2. ✅ Access the event creator at: http://localhost:3001

3. ✅ Test creating an event with:
   - Custom subdomain (e.g., `myevent.redheli.com`)
   - Potluck food tracking
   - Music contributions (song requests or AI-generated)

4. ✅ Deploy to Cloud Run:
   ```bash
   ./deploy.sh staging  # or ./deploy.sh prod
   ```

## Troubleshooting

**Error: permission denied**
- Make sure you're using the service role key
- Check that RLS policies allow your user to create tables

**Error: relation already exists**
- Some tables may already exist
- You can drop them first: `DROP TABLE IF EXISTS events CASCADE;`
- Or skip those specific CREATE statements

**Error: syntax error**
- Make sure you copy the entire SQL file
- Check for any truncation or encoding issues
