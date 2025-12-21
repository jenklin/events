# CloudPeers Custom Events - Deployment Guide

## 🎯 Quick Start

The Custom Events service can be deployed from **two locations**:

### Option 1: From Events Directory
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/events
npm run deploy:staging  # or deploy:prod
```

### Option 2: From MCP Directory (Unified Deployment)
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/mcp
npm run deploy:events:staging  # or deploy:events:prod
```

Both methods execute the same `deploy.sh` script with proper directory validation.

---

## 📦 Deployment Scripts Reference

### From Events Directory

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3001)
npm run build            # Build production bundle
npm run verify-db        # Verify database setup

# Deployment
npm run deploy:staging   # Deploy to staging environment
npm run deploy:prod      # Deploy to production (requires confirmation)
npm run deploy:ga        # Alias for deploy:prod
```

### From MCP Directory

```bash
# MCP Service Deployment
npm run deploy:staging   # Deploy MCP service
npm run deploy:prod      # Deploy MCP service to production

# Events Service Deployment
npm run deploy:events:staging   # Deploy events service to staging
npm run deploy:events:prod      # Deploy events service to production
npm run deploy:events:ga        # Alias for deploy:events:prod
```

---

## 🔧 Deployment Process

### What Happens When You Deploy

The `deploy.sh` script performs the following steps:

#### 1. Pre-Deployment Validation
```bash
✓ Verify current directory is "events"
✓ Check GCP account (jkl@cloudpeers.com)
✓ Load Supabase credentials from app/.env.local
✓ Confirm environment (staging/prod)
```

#### 2. Cloud Build
```bash
# Build Docker image using Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_IMAGE_URI=${IMAGE_URI},..." \
  --project="${PROJECT_ID}" \
  --timeout=20m
```

**What's Built:**
- Multi-stage Docker image (deps → builder → runner)
- Next.js 14 production build
- Standalone output for Cloud Run
- Environment variables baked in at build time

#### 3. Cloud Run Deployment
```bash
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
  --region="${REGION}" \
  --memory="${MEMORY}" \
  --cpu="${CPU}" \
  --min-instances="${MIN_INSTANCES}" \
  --max-instances="${MAX_INSTANCES}" \
  --allow-unauthenticated
```

#### 4. Verification
```bash
✓ Retrieve service URL
✓ Test HTTP endpoint
✓ Display deployment summary
```

---

## 🌐 Environment Configuration

### Staging Environment

**Service Name**: `custom-events-staging`

| Setting | Value |
|---------|-------|
| Memory | 1GB |
| CPU | 1 vCPU |
| Min Instances | 0 (scales to zero) |
| Max Instances | 3 |
| Concurrency | 40 requests/container |
| Region | us-west1 |

**Expected URL**: `https://custom-events-staging-[hash]-uw.a.run.app`

### Production Environment

**Service Name**: `custom-events`

| Setting | Value |
|---------|-------|
| Memory | 2GB |
| CPU | 2 vCPU |
| Min Instances | 0 (scales to zero) |
| Max Instances | 10 |
| Concurrency | 80 requests/container |
| Region | us-west1 |

**Expected URL**: `https://custom-events-[hash]-uw.a.run.app`

**Production Confirmation**:
```
Are you sure you want to deploy to PRODUCTION? (yes/no):
```

---

## 🔐 Required Secrets & Environment Variables

### Build-Time Variables (from app/.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://efpspxzgvbsqfyelbkdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Runtime Environment Variables (set by deploy.sh)
```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```

### Google Cloud Secrets
```bash
# Service role key stored in Secret Manager
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest
```

---

## 🚀 Complete Deployment Workflow

### First-Time Deployment

```bash
# 1. Navigate to events directory
cd /Users/jenklin/dev/cloudpeers-mcp/events

# 2. Verify database setup
npm run verify-db

# 3. Test locally
npm run dev
# Open http://localhost:3001 and create a test event

# 4. Deploy to staging
npm run deploy:staging

# 5. Test staging deployment
# Visit the staging URL from deployment output
# Create a test event, verify all features work

# 6. Deploy to production
npm run deploy:prod
# Type "yes" to confirm
```

### Subsequent Deployments

```bash
# From MCP directory (recommended for unified workflow)
cd /Users/jenklin/dev/cloudpeers-mcp/mcp

# Deploy events service to staging
npm run deploy:events:staging

# After testing, deploy to production
npm run deploy:events:prod
```

---

## 🔍 Monitoring & Logs

### View Deployment Logs
```bash
# Real-time logs during deployment
gcloud builds log --stream
```

### View Service Logs
```bash
# Events service logs (staging)
gcloud run logs read custom-events-staging \
  --region=us-west1 \
  --project=gen-lang-client-0243928474

# Events service logs (production)
gcloud run logs read custom-events \
  --region=us-west1 \
  --project=gen-lang-client-0243928474 \
  --limit=100
```

### Cloud Run Console
- **Staging**: https://console.cloud.google.com/run/detail/us-west1/custom-events-staging
- **Production**: https://console.cloud.google.com/run/detail/us-west1/custom-events

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Wrong directory" Error
```bash
ERROR: Wrong directory!
Expected directory: events
Current directory: mcp
```

**Fix**: Make sure you're in the events directory or use the full path:
```bash
cd /Users/jenklin/dev/cloudpeers-mcp/events
./deploy.sh staging
```

#### 2. "Missing Supabase credentials" Error
```bash
ERROR: NEXT_PUBLIC_SUPABASE_URL not found
```

**Fix**: Create `app/.env.local` with Supabase credentials:
```bash
cp /Users/jenklin/dev/cloudpeers-mcp/mcp/.env app/.env.local
```

#### 3. Build Timeout
```bash
ERROR: Build timed out after 20 minutes
```

**Fix**: Increase timeout in `cloudbuild.yaml`:
```yaml
timeout: '1800s'  # 30 minutes
```

#### 4. Database Connection Issues
```bash
Error: Cannot connect to Supabase
```

**Fix**: Verify database setup:
```bash
npm run verify-db
```

---

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] Database schema executed successfully
- [ ] Local development tested (`npm run dev`)
- [ ] All environment variables configured
- [ ] Build passes locally (`npm run build`)
- [ ] Database verification passed (`npm run verify-db`)

### Staging Deployment
- [ ] Staging deployment successful
- [ ] Service URL accessible
- [ ] Create test event works
- [ ] Potluck features work
- [ ] Music contributions work
- [ ] QR code generation works
- [ ] API endpoints respond correctly

### Production Deployment
- [ ] Staging fully tested
- [ ] Production deployment confirmed
- [ ] Service URL accessible
- [ ] Health check passes
- [ ] Performance acceptable
- [ ] Error monitoring configured

### Post-Deployment
- [ ] Service registered in CloudPeers marketplace
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring alerts configured

---

## 🔗 Related Documentation

- `DATABASE_SETUP.md` - Database schema setup instructions
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `MCP_SERVICE_REGISTRATION.md` - MCP service registration details
- `README.md` - Project overview and features

---

## 📞 Support

**Project**: CloudPeers Custom Events
**Repository**: https://github.com/jenklin/events
**Service ID**: `custom-events`
**Marketplace**: https://services.cloudpeers.com/custom-events

For deployment issues, check:
1. Cloud Build logs: `gcloud builds log`
2. Cloud Run logs: `gcloud run logs read custom-events`
3. Supabase dashboard: https://supabase.com/dashboard/project/efpspxzgvbsqfyelbkdw
