# ✅ CloudPeers Custom Events - Ready to Deploy!

## 🎉 Status: Fully Configured and Tested

Everything is set up and ready for deployment. You can deploy the Custom Events service from **either location**.

---

## 🚀 Quick Deploy Commands

### Deploy from MCP Directory (Recommended - Unified Workflow)
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/mcp

# Deploy to staging
npm run deploy:events:staging

# After testing, deploy to production
npm run deploy:events:prod
```

### Deploy from Events Directory
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/events

# Deploy to staging
npm run deploy:staging

# After testing, deploy to production
npm run deploy:prod
```

---

## ✅ What's Been Completed

### 1. ✅ Database Setup
- **Status**: All 7 tables created ✅
- **Views**: All 5 views created ✅
- **Functions**: URL generators, triggers working ✅
- **Verification**: `npm run verify-db` passing

### 2. ✅ Development Environment
- **Dev Server**: Running at http://localhost:3001
- **Build**: Successfully tested and compiled
- **Dependencies**: 426 packages installed
- **Environment**: Supabase credentials configured (shared with cloudpeers-mcp)

### 3. ✅ Deployment Configuration
- **Dockerfile**: Multi-stage build for Cloud Run ✅
- **cloudbuild.yaml**: Google Cloud Build config ✅
- **deploy.sh**: Staging/prod deployment script ✅
- **Validation**: Directory checking and confirmation prompts ✅

### 4. ✅ Features Implemented

#### Event Creation Wizard (8 Steps + Preview)
- ✅ Event basics (title, description, cover image)
- ✅ Date & location (with hide-until-RSVP option)
- ✅ Guest settings (capacity, plus-ones, mutual invites)
- ✅ RSVP options (approval workflow, visibility)
- ✅ **Potluck tracking** (OPTIONAL - food categories, servings)
- ✅ **Music contributions** (OPTIONAL - song requests OR AI-generated)
- ✅ URL & branding (custom subdomains: *.redheli.com, *.cloudpeers.com)
- ✅ Visibility controls (public/private, password protection)
- ✅ Additional details (cost, check-ins, instructions)
- ✅ Preview before publishing

#### API Endpoints
- ✅ `POST /api/events/create` - Create events
- ✅ `GET /api/events/[eventId]/guests` - Guest list
- ✅ `GET /api/events/[eventId]/stats` - RSVP statistics
- ✅ `GET /api/events/[eventId]/potluck` - Food contributions by category
- ✅ `GET /api/events/[eventId]/music` - Music playlist (songs + AI-generated)
- ✅ `GET /api/events/[eventId]/qr` - QR code generation

### 5. ✅ Documentation
- ✅ `DATABASE_SETUP.md` - Database setup instructions
- ✅ `DEPLOYMENT_GUIDE.md` - Complete deployment workflow
- ✅ `DEPLOYMENT_STATUS.md` - Current status and metrics
- ✅ `MCP_SERVICE_REGISTRATION.md` - MCP service details
- ✅ `README.md` - Project overview

### 6. ✅ Git Repository
- **Repository**: https://github.com/jenklin/events
- **Commits**: 5 commits
- **Latest**: "Add comprehensive deployment guide with unified workflow"

### 7. ✅ Unified Deployment from MCP
- **MCP Scripts**: Added to `/cloudpeers-mcp/mcp/package.json`
- **Commands**:
  - `npm run deploy:events:staging`
  - `npm run deploy:events:prod`
  - `npm run deploy:events:ga`

---

## 🎯 Next Steps - Deploy!

### Step 1: Test Locally (Optional)
```bash
# Dev server is already running at http://localhost:3001
# Open browser and create a test event
```

### Step 2: Deploy to Staging
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/mcp
npm run deploy:events:staging
```

**What happens:**
1. Validates you're in correct directory
2. Loads Supabase credentials from `app/.env.local`
3. Builds Docker image with Cloud Build (~5-10 minutes)
4. Deploys to Cloud Run as `custom-events-staging`
5. Returns service URL

**Expected output:**
```
✓ Deployment successful!
Service: custom-events-staging
URL: https://custom-events-staging-[hash]-uw.a.run.app
```

### Step 3: Test Staging
Visit the staging URL and:
- [ ] Create an event with custom subdomain
- [ ] Test potluck food tracking
- [ ] Test music contributions (song requests)
- [ ] Generate QR code
- [ ] Test RSVP flow

### Step 4: Deploy to Production
```bash
npm run deploy:events:prod
# Confirm with "yes"
```

**Production settings:**
- Service: `custom-events`
- Memory: 2GB
- CPU: 2 vCPU
- Max instances: 10

---

## 📊 Database Tables & Views

### Tables (7)
- `events` - Event details with custom subdomains
- `rsvp_responses` - Guest RSVPs with potluck/music data
- `guest_activity_log` - Activity tracking
- `event_waitlist` - Waitlist management
- `guest_comments` - Guest messages
- `reminder_queue` - Email automation
- `event_metrics` - Analytics

### Views (5)
- `event_summary` - Event overview with RSVP counts
- `guest_list` - Guest list with details
- `potluck_contributions` - Food items by guest
- `potluck_summary` - Food items by category
- `event_playlist` - Song requests and AI-generated songs

### Functions (3)
- `get_event_url(event)` - Generates full URL (subdomain or path-based)
- `get_qr_code_url(event)` - Generates QR code URL
- `get_gallery_url(event)` - Generates photo gallery URL

---

## 🔧 Environment Configuration

### Supabase (Shared with cloudpeers-mcp)
```
URL: https://efpspxzgvbsqfyelbkdw.supabase.co
Project: CloudPeers MCP
```

### Google Cloud Run
```
Project: gen-lang-client-0243928474
Region: us-west1
Account: jkl@cloudpeers.com
```

---

## 📈 Key Features

### OPTIONAL Potluck Tracking
- Food categories: Appetizer, Main Dish, Side Dish, Dessert, Drinks
- Each guest specifies what they're bringing
- Servings and dietary information
- Category-based organization
- What's needed vs. what's claimed

### OPTIONAL Music Contributions
- **Song Requests**: Guests request existing songs
  - Song name + artist
  - Spotify/Apple Music links
  - Notes about why they chose it

- **AI-Generated Custom Songs**: Guests provide 1-sentence prompts
  - Example: "A funky celebration of Sarah's love for coffee and adventure"
  - Integration with Suno/Udio
  - Unique songs for the event

### Custom Subdomains
- `myevent.redheli.com`
- `myevent.cloudpeers.com`
- Fallback: `events.cloudpeers.com/e/event-slug`

### Core Features
- QR code generation for event sharing
- Photo gallery integration
- RSVP management (Going/Maybe/Can't Go)
- Waitlist and approval workflows
- Guest capacity limits
- Activity logging and analytics
- Password-protected private events
- Cost collection and tracking

---

## 🎯 Deployment Targets

### Staging
- **Service**: `custom-events-staging`
- **URL**: `https://custom-events-staging-[hash]-uw.a.run.app`
- **Resources**: 1GB RAM, 1 CPU, max 3 instances

### Production
- **Service**: `custom-events`
- **URL**: `https://custom-events-[hash]-uw.a.run.app`
- **Resources**: 2GB RAM, 2 CPU, max 10 instances
- **Requires**: Confirmation prompt

---

## 📞 Quick Reference

### Useful Commands
```bash
# Verify database
npm run verify-db

# Local development
npm run dev

# Deploy from MCP directory
cd /Users/jenklin/dev/cloudpeers-mcp/mcp
npm run deploy:events:staging
npm run deploy:events:prod

# Deploy from events directory
cd /Users/jenklin/dev/cloudpeers-mcp/events
npm run deploy:staging
npm run deploy:prod

# View logs
gcloud run logs read custom-events --region=us-west1
```

### Important URLs
- **Local Dev**: http://localhost:3001 (currently running)
- **Repository**: https://github.com/jenklin/events
- **Supabase**: https://supabase.com/dashboard/project/efpspxzgvbsqfyelbkdw
- **Marketplace**: https://services.cloudpeers.com/custom-events (pending)

---

## 🎊 You're Ready!

Everything is configured, tested, and ready to deploy. The service can handle:
- ✅ Event creation with 8-step wizard
- ✅ Custom subdomains (*.redheli.com, *.cloudpeers.com)
- ✅ Potluck food tracking (optional)
- ✅ Music contributions - song requests OR AI-generated (optional)
- ✅ QR code generation
- ✅ RSVP management with waitlists
- ✅ Photo galleries
- ✅ Activity tracking and analytics

**Just run:**
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/mcp
npm run deploy:events:staging
```

🚀 Happy deploying!
