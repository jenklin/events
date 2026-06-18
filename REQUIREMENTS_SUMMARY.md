# cloudpeers Events Platform - Requirements Summary

## What You Need to Get events.cloudpeers.com Live

### 🎯 Quick Summary
**Timeline**: 3-4 weeks
**Team Size**: 2-3 developers
**Budget**: ~$30-75/month
**Effort**: ~120-160 hours total

---

## 🔑 Critical Requirements (Must Have)

### 1. Accounts & Services
| Service | Purpose | Cost | Setup Time |
|---------|---------|------|------------|
| **Google Cloud Platform** | Host gallery app (Cloud Run) | $20-50/mo | 2-3 hours |
| **Supabase** | Database + Auth | Free tier | 2-3 hours |
| **Cloudflare** | Images + DNS + Worker | $5-20/mo | 2-3 hours |
| **GitHub** | Code repository + CI/CD | Free | 1 hour |
| **cloudpeers** | Service marketplace | TBD | 1 hour |

**Total Setup Time**: ~8-12 hours
**Monthly Cost**: ~$30-75

---

### 2. Domain Configuration
- [ ] Configure `events.cloudpeers.com` DNS
- [ ] Configure `events-api.cloudpeers.com` DNS
- [ ] SSL/TLS certificates (auto via Cloudflare)

**Time**: 2-4 hours
**Owner**: DevOps

---

### 3. Infrastructure Setup

#### Google Cloud (GCP)
```bash
# Required:
- Project ID: cloudpeers-events
- Enable APIs: Cloud Run, Secret Manager, Container Registry
- Service account with deployment permissions
- Secrets Manager configured
```

#### Supabase
```bash
# Required:
- PostgreSQL database
- Email authentication enabled
- Row-level security (RLS) policies
- Magic link email templates configured
```

#### Cloudflare
```bash
# Required:
- Images enabled (photo storage)
- Worker deployed (gallery routing)
- DNS records configured
- API tokens generated
```

**Time**: 8-12 hours total
**Owner**: DevOps

---

### 4. Codebase Development

#### Event Generator Service
- **Language**: Node.js/TypeScript
- **Framework**: Express
- **Features**:
  - Template rendering
  - QR code generation
  - Calendar integration
  - Branding customization

**Time**: 8-12 hours
**Owner**: Backend Dev

#### Gallery Application
- **Framework**: Next.js 14 (App Router)
- **Features**:
  - Magic link authentication
  - Photo galleries with Cloudflare Images
  - White-label branding
  - Mobile-responsive design

**Time**: 12-16 hours
**Owner**: Frontend Dev

#### Cloudflare Worker
- **Purpose**: Route `/gallery` to Cloud Run
- **Features**: Proxy, redirect handling

**Time**: 2-3 hours
**Owner**: DevOps

**Total Development Time**: ~24-32 hours

---

### 5. Database Schema

**Tables to Create** (Supabase):
```sql
1. organizations      - Multi-tenant org management
2. events             - Event metadata + branding
3. events_registrations - User registrations
4. gallery_albums     - Photo album metadata
5. gallery_assets     - Individual photos
6. gallery_access_logs - Access tracking
7. organization_members - Team management (optional)
8. user_accounts      - Admin accounts (optional)
```

**Plus**:
- Row-level security (RLS) policies
- Database functions (branding inheritance, counters)
- Indexes for performance

**Time**: 4-6 hours
**Owner**: Backend Dev
**Reference**: `05_DATABASE_SCHEMA.md`

---

### 6. cloudpeers Integration

**Required**:
- [ ] Service registration with cloudpeers
- [ ] MCP webhook handler (`/api/webhooks/mcp`)
- [ ] Signature verification (HMAC)
- [ ] Capability implementations:
  - `event.create`
  - `event.register`
  - `gallery.create`
  - `gallery.authorize`
  - `event.analytics`
- [ ] Metrics reporting to cloudpeers API
- [ ] Agent card (`/.well-known/agent.json`)

**Time**: 6-8 hours
**Owner**: Backend Dev
**Reference**: `07_INTEGRATION_GUIDE.md`

---

### 7. CI/CD Pipeline

**GitHub Actions Workflows**:
```yaml
.github/workflows/
├── deploy-gallery.yml      # Deploy Next.js to Cloud Run
├── deploy-worker.yml       # Deploy Cloudflare Worker
├── run-migrations.yml      # Database migrations
└── tests.yml              # Run test suite
```

**Time**: 4-6 hours
**Owner**: DevOps
**Reference**: `06_DEPLOYMENT_WORKFLOW.md`

---

### 8. Testing Requirements

**Must Test**:
- [ ] Event creation flow
- [ ] User registration flow
- [ ] Magic link authentication
- [ ] Gallery photo upload
- [ ] Gallery photo access
- [ ] Branding customization
- [ ] cloudpeers webhook
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

**Time**: 8-12 hours
**Owner**: QA + Dev Team

---

## 📋 Environment Variables Required

### Development (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Server-only

# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
CF_IMAGES_ACCOUNT_HASH=xxx
NEXT_PUBLIC_CF_IMAGES_HASH=xxx

# App
NEXT_PUBLIC_APP_URL=https://events.cloudpeers.com
JWT_SECRET=xxx  # openssl rand -hex 32

# cloudpeers
CLOUDPEERS_WEBHOOK_SECRET=xxx  # openssl rand -hex 32
CLOUDPEERS_SERVICE_ID=xxx  # From registration
CLOUDPEERS_API_KEY=xxx

# Google Cloud
GCP_PROJECT_ID=cloudpeers-events
GCP_REGION=us-central1
```

### Production (Google Cloud Secrets Manager)
```bash
# Store these as secrets:
- SUPABASE_SERVICE_ROLE_KEY
- CLOUDFLARE_API_TOKEN
- JWT_SECRET
- CLOUDPEERS_WEBHOOK_SECRET
- CLOUDPEERS_API_KEY
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Secrets stored in GCP Secret Manager
- [ ] GitHub Actions workflows tested

### Deployment Steps
```bash
# 1. Build and push Docker image
docker build -t gcr.io/cloudpeers-events/events-gallery .
docker push gcr.io/cloudpeers-events/events-gallery

# 2. Deploy to Cloud Run
gcloud run deploy events-gallery \
  --image gcr.io/cloudpeers-events/events-gallery \
  --region us-central1 \
  --allow-unauthenticated

# 3. Deploy Cloudflare Worker
cd cloudflare-worker
wrangler deploy

# 4. Map custom domain
gcloud run domain-mappings create \
  --service events-gallery \
  --domain events.cloudpeers.com
```

### Post-Deployment
- [ ] Health check endpoint returns 200
- [ ] Test event creation
- [ ] Test registration flow
- [ ] Test gallery access
- [ ] Test cloudpeers webhook
- [ ] Monitor error rates

---

## 💰 Cost Breakdown

### Monthly Recurring Costs
| Service | Free Tier | Paid Tier | Our Usage |
|---------|-----------|-----------|-----------|
| **Google Cloud Run** | 2M requests/mo | $0.40/M requests | ~$20-50/mo |
| **Supabase** | 50k MAU, 500MB DB | $25/mo (Pro) | Free tier OK |
| **Cloudflare Images** | None | $5 + $1/1000 images | ~$5-20/mo |
| **Domain** | N/A | $10-15/year | ~$1/mo |
| **Total** | **~$0-10/mo** | **~$50-100/mo** | **~$30-75/mo** |

### One-Time Costs
- Development: ~120-160 hours @ developer rates
- Setup/Configuration: ~20-30 hours
- Testing/QA: ~10-15 hours

---

## 👥 Team Requirements

### Minimum Team
| Role | Hours | Responsibilities |
|------|-------|------------------|
| **Backend Developer** | 40-50h | Database, APIs, cloudpeers integration |
| **Frontend Developer** | 30-40h | Gallery UI, event templates |
| **DevOps Engineer** | 30-40h | Cloud setup, CI/CD, deployment |

**Total**: ~100-130 hours (2-3 weeks with 3-person team)

### Optional
- **QA Engineer**: 10-15h (testing)
- **Product Manager**: 10-15h (planning, documentation)
- **Designer**: 5-10h (branding, UX)

---

## 📅 Timeline (Realistic)

### Week 1: Infrastructure Setup
- **Days 1-2**: Accounts setup (GCP, Supabase, Cloudflare)
- **Days 3-4**: Database schema + migrations
- **Day 5**: CI/CD pipeline setup

### Week 2: Core Development
- **Days 1-2**: Event template engine
- **Days 3-4**: Gallery application
- **Day 5**: Cloudflare Worker

### Week 3: Integration & Testing
- **Days 1-2**: cloudpeers integration
- **Days 3-4**: End-to-end testing
- **Day 5**: Bug fixes

### Week 4: Launch
- **Days 1-2**: Staging deployment + QA
- **Day 3**: Production deployment
- **Day 4**: cloudpeers marketplace publish
- **Day 5**: Monitor + optimize

**Total**: 20 working days (~4 weeks)

---

## ⚠️ Critical Path Items

These MUST be completed in order:

1. **GCP Project + Supabase** → Need database for dev work
2. **Database Schema** → Required before app development
3. **Gallery Application** → Core functionality
4. **Cloud Run Deployment** → Need live URL for DNS
5. **Domain Configuration** → Need for Cloudflare Worker
6. **cloudpeers Registration** → Need webhook secret for integration
7. **Testing** → Must pass before launch
8. **Launch** → Go live!

---

## 🔴 High-Risk Items

### 1. Email Delivery
**Risk**: Magic links not arriving
**Mitigation**:
- Test Supabase SMTP thoroughly
- Have backup SMTP provider ready (SendGrid, AWS SES)
- Monitor email delivery rates

### 2. cloudpeers Integration
**Risk**: Webhook signature verification issues
**Mitigation**:
- Test webhook locally with ngrok
- Verify signature algorithm matches
- Have fallback manual registration flow

### 3. Database Performance
**Risk**: Slow queries with RLS policies
**Mitigation**:
- Proper indexing from day 1
- Test with realistic data volumes
- Monitor query performance

### 4. Cloudflare Images Costs
**Risk**: Unexpected costs with high usage
**Mitigation**:
- Set spending alerts
- Monitor usage dashboard
- Have fallback to S3 planned

---

## ✅ Launch Day Requirements

### Must Be Working
- [ ] `https://events.cloudpeers.com` - Homepage loads
- [ ] `https://events.cloudpeers.com/gallery` - Gallery login
- [ ] Event creation via API
- [ ] User registration
- [ ] Magic link emails sent
- [ ] Gallery photo upload
- [ ] Gallery photo viewing
- [ ] cloudpeers webhook responding
- [ ] Metrics being reported
- [ ] Health check endpoint returns 200

### Must Be Monitoring
- [ ] Error rates (target: <1%)
- [ ] Response times (target: <500ms p95)
- [ ] User registrations
- [ ] Gallery uploads
- [ ] cloudpeers agent invocations

---

## 📞 Support & Resources

### Documentation
- **Implementation**: `/Users/jenklin/dev/cloudpeers-mcp/events/`
- **Full Checklist**: `LAUNCH_CHECKLIST.md`
- **Architecture**: `02_SERVICE_ARCHITECTURE.md`
- **Quick Start**: `QUICK_START.md`

### External Services
- **cloudpeers**: https://services.cloudpeers.com
- **Supabase**: https://supabase.com/dashboard
- **GCP Console**: https://console.cloud.google.com
- **Cloudflare**: https://dash.cloudflare.com

---

## 🎯 Success Criteria

### Technical
- ✅ 99.5%+ uptime
- ✅ <500ms response time (p95)
- ✅ <1% error rate
- ✅ All tests passing

### Business
- ✅ 10+ organizations (first month)
- ✅ 50+ events created (first month)
- ✅ 500+ registrations (first month)

### User Experience
- ✅ Event creation in <5 minutes
- ✅ Gallery access in <1 minute
- ✅ Mobile-friendly
- ✅ <4 hour support response time

---

**Ready to Start?**

1. Review this document
2. Read `LAUNCH_CHECKLIST.md` for detailed steps
3. Begin with Phase 1: Infrastructure Setup

**Questions?** See full implementation guides in this directory.

**Last Updated**: December 19, 2025
