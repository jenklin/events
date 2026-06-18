# Deployment Workflow - CI/CD Pipeline

## Overview

Complete deployment pipeline for the Events Platform service, including:
- Event generator deployment
- Gallery system (Next.js) deployment to Cloud Run
- Cloudflare Worker configuration
- Database migrations
- cloudpeers service integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Git Repository (GitHub)                   │
│                github.com/org/events-platform               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Push to main
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions (CI/CD)                         │
│  - Run tests                                                │
│  - Build containers                                         │
│  - Deploy to Cloud Run                                      │
│  - Update Cloudflare Workers                                │
│  - Run database migrations                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│  Cloud Run  │ │ Cloudflare  │ │   Supabase   │
│  (Gallery)  │ │  (Worker)   │ │ (Database)   │
└─────────────┘ └─────────────┘ └──────────────┘
```

## Repository Structure

```
events-platform/
├── .github/
│   └── workflows/
│       ├── deploy-gallery.yml      # Deploy gallery to Cloud Run
│       ├── deploy-worker.yml       # Deploy Cloudflare Worker
│       ├── run-migrations.yml      # Database migrations
│       └── tests.yml               # Run test suite
├── event-generator/                # Event template generator
│   ├── src/
│   ├── templates/
│   ├── package.json
│   └── Dockerfile
├── gallery/                        # Gallery Next.js app
│   ├── src/
│   ├── Dockerfile
│   ├── next.config.js
│   └── package.json
├── cloudflare-worker/              # Cloudflare Worker code
│   ├── worker.js
│   └── wrangler.toml
├── supabase/                       # Database migrations
│   ├── migrations/
│   └── seed.sql
└── scripts/
    ├── deploy-gallery.sh
    ├── deploy-worker.sh
    └── run-migrations.sh
```

## GitHub Actions Workflows

### 1. Gallery Deployment

**File**: `.github/workflows/deploy-gallery.yml`

```yaml
name: Deploy Gallery to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'gallery/**'
      - '.github/workflows/deploy-gallery.yml'
  workflow_dispatch:

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: events-gallery

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker

      - name: Build Docker image
        working-directory: ./gallery
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }} \
            -t gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }} \
            -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
            .

      - name: Push Docker image
        run: |
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }}
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }} \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 0 \
            --max-instances 10 \
            --memory 1Gi \
            --cpu 1 \
            --timeout 300 \
            --set-env-vars "NEXT_PUBLIC_APP_URL=https://events.redheli.com/gallery" \
            --set-secrets \
              "SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,\
               CLOUDFLARE_API_TOKEN=CLOUDFLARE_API_TOKEN:latest,\
               CLOUDPEERS_WEBHOOK_SECRET=CLOUDPEERS_WEBHOOK_SECRET:latest"

      - name: Get Cloud Run URL
        id: get-url
        run: |
          URL=$(gcloud run services describe $SERVICE_NAME \
            --region $REGION \
            --format 'value(status.url)')
          echo "url=$URL" >> $GITHUB_OUTPUT

      - name: Notify cloudpeers
        run: |
          curl -X POST https://services.cloudpeers.com/api/observability/services/${{ secrets.CLOUDPEERS_SERVICE_ID }}/metrics \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.CLOUDPEERS_API_KEY }}" \
            -d '{
              "metric_type": "deployment",
              "value": 1,
              "metadata": {
                "service": "gallery",
                "version": "${{ github.sha }}",
                "url": "${{ steps.get-url.outputs.url }}"
              }
            }'

      - name: Send deployment notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Gallery deployed to Cloud Run
            Service: ${{ env.SERVICE_NAME }}
            URL: ${{ steps.get-url.outputs.url }}
            Commit: ${{ github.sha }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 2. Cloudflare Worker Deployment

**File**: `.github/workflows/deploy-worker.yml`

```yaml
name: Deploy Cloudflare Worker

on:
  push:
    branches:
      - main
    paths:
      - 'cloudflare-worker/**'
      - '.github/workflows/deploy-worker.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Wrangler
        run: npm install -g wrangler

      - name: Deploy Worker
        working-directory: ./cloudflare-worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          wrangler deploy worker.js \
            --name events-gallery-proxy \
            --compatibility-date 2024-01-01

      - name: Update Worker Environment Variables
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          # Update CLOUD_RUN_URL if needed
          curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${{ secrets.CLOUDFLARE_ACCOUNT_ID }}/workers/scripts/events-gallery-proxy/settings" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
              "bindings": [
                {
                  "name": "CLOUD_RUN_URL",
                  "type": "plain_text",
                  "text": "${{ needs.get-cloud-run-url.outputs.url }}"
                }
              ]
            }'
```

### 3. Database Migrations

**File**: `.github/workflows/run-migrations.yml`

```yaml
name: Run Database Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'
      - '.github/workflows/run-migrations.yml'
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link Supabase Project
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase link \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

      - name: Run Migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          supabase db push

      - name: Verify Migrations
        run: |
          supabase db diff \
            --linked \
            --schema public

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Database migration failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Manual Deployment Scripts

### Gallery Deployment Script

**File**: `scripts/deploy-gallery.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Events Gallery to Cloud Run..."

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION="us-central1"
SERVICE_NAME="events-gallery"
IMAGE_TAG=$(git rev-parse --short HEAD)

# Navigate to gallery directory
cd gallery

# Build Docker image
echo "📦 Building Docker image..."
docker build \
  --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$IMAGE_TAG \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  .

# Push to GCR
echo "⬆️  Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$IMAGE_TAG
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$IMAGE_TAG \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://events.redheli.com/gallery" \
  --set-secrets \
    "SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,\
     CLOUDFLARE_API_TOKEN=CLOUDFLARE_API_TOKEN:latest,\
     CLOUDPEERS_WEBHOOK_SECRET=CLOUDPEERS_WEBHOOK_SECRET:latest" \
  --project $PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)' \
  --project $PROJECT_ID)

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📊 View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"

# Test health endpoint
echo "🏥 Testing health endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/api/health)
if [ $HTTP_STATUS -eq 200 ]; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed! (HTTP $HTTP_STATUS)"
  exit 1
fi
```

### Cloudflare Worker Deployment

**File**: `scripts/deploy-worker.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Cloudflare Worker..."

# Configuration
WORKER_NAME="events-gallery-proxy"
CLOUD_RUN_URL=${CLOUD_RUN_URL:-""}

if [ -z "$CLOUD_RUN_URL" ]; then
  echo "🔍 Fetching Cloud Run URL..."
  CLOUD_RUN_URL=$(gcloud run services describe events-gallery \
    --region us-central1 \
    --format 'value(status.url)')
fi

echo "📝 Cloud Run URL: $CLOUD_RUN_URL"

# Navigate to worker directory
cd cloudflare-worker

# Update worker.js with Cloud Run URL
echo "📝 Updating worker configuration..."
sed -i "s|const CLOUD_RUN_URL = '.*'|const CLOUD_RUN_URL = '$CLOUD_RUN_URL'|g" worker.js

# Deploy using Wrangler
echo "⬆️  Deploying to Cloudflare..."
wrangler deploy worker.js \
  --name $WORKER_NAME \
  --compatibility-date 2024-01-01

echo "✅ Worker deployed successfully!"
echo "🌐 Worker URL: https://events.redheli.com/gallery"

# Test worker
echo "🏥 Testing worker..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://events.redheli.com/gallery/api/health)
if [ $HTTP_STATUS -eq 200 ]; then
  echo "✅ Worker health check passed!"
else
  echo "❌ Worker health check failed! (HTTP $HTTP_STATUS)"
  exit 1
fi
```

## Google Cloud Secrets Configuration

```bash
# Create secrets
gcloud secrets create SUPABASE_SERVICE_ROLE_KEY \
  --data-file=- <<< "$SUPABASE_SERVICE_ROLE_KEY"

gcloud secrets create CLOUDFLARE_API_TOKEN \
  --data-file=- <<< "$CLOUDFLARE_API_TOKEN"

gcloud secrets create CLOUDPEERS_WEBHOOK_SECRET \
  --data-file=- <<< "$CLOUDPEERS_WEBHOOK_SECRET"

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding SUPABASE_SERVICE_ROLE_KEY \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Repeat for other secrets...
```

## Environment Variables Checklist

### Required for Gallery

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (secret)
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_API_TOKEN` (secret)
- ✅ `CF_IMAGES_ACCOUNT_HASH`
- ✅ `NEXT_PUBLIC_CF_IMAGES_HASH`
- ✅ `JWT_SECRET` (secret)
- ✅ `CLOUDPEERS_WEBHOOK_SECRET` (secret)
- ✅ `CLOUDPEERS_SERVICE_ID`
- ✅ `CLOUDPEERS_API_KEY` (secret)

### Required for Cloudflare Worker

- ✅ `CLOUDFLARE_API_TOKEN` (secret)
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUD_RUN_URL` (auto-fetched)

## Monitoring & Rollback

### View Logs

```bash
# Gallery logs
gcloud run logs tail events-gallery --region us-central1

# Cloudflare Worker logs
wrangler tail events-gallery-proxy
```

### Rollback Deployment

```bash
# List revisions
gcloud run revisions list --service events-gallery --region us-central1

# Rollback to previous revision
gcloud run services update-traffic events-gallery \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

### Health Checks

```bash
# Gallery health
curl https://events.redheli.com/gallery/api/health

# Worker health (via gallery proxy)
curl https://events.redheli.com/gallery/api/health

# cloudpeers integration test
curl -X POST https://events.redheli.com/api/webhooks/mcp \
  -H "Content-Type: application/json" \
  -H "x-cloudpeers-signature: test-signature" \
  -d '{"event_type":"health_check"}'
```

## Next Steps

1. Set up GitHub repository
2. Configure GitHub Secrets
3. Set up Google Cloud secrets
4. Test deployment pipeline
5. Configure monitoring and alerts

Continue to:
- **07_INTEGRATION_GUIDE.md** - cloudpeers integration
- **08_TESTING_GUIDE.md** - End-to-end testing
