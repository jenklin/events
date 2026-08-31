#!/bin/bash

# CloudPeers Events Deployment Script using Cloud Build
# Usage: ./deploy.sh [staging|prod]
# Service: cloudpeers-events (CloudPeers vertical - Event Management)
# Marketplace: services.cloudpeers.com

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate we're in the correct directory
EXPECTED_DIR="events"
CURRENT_DIR=$(basename "$PWD")

if [[ "$CURRENT_DIR" != "$EXPECTED_DIR" ]]; then
  echo -e "${RED}ERROR: Wrong directory!${NC}"
  echo ""
  echo "This script deploys: ${GREEN}CloudPeers Events${NC}"
  echo "Expected directory:  ${GREEN}events${NC}"
  echo "Current directory:   ${RED}$CURRENT_DIR${NC}"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Correct directory: events${NC}"
echo -e "${GREEN}✓ Deploying: CloudPeers Events (CloudPeers Event Management Service)${NC}"
echo ""

# Configuration — events runs on heli-ent (org project), consolidated off the
# personal gen-lang project on 2026-06-17. Runbook:
# cloudpeers-mcp/mcp/docs/GEN_LANG_TO_HELI_ENT_MIGRATION_RUNBOOK_2026-06-17.md
PROJECT_ID="heli-ent"
REGION="us-central1"
IMAGE_NAME="cloudpeers-events"
RUNTIME_SA="cloudpeers-deployer@heli-ent.iam.gserviceaccount.com"

# Verify active account
ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
REQUIRED_ACCOUNT="jkl@cloudpeers.com"

if [[ "$ACTIVE_ACCOUNT" != "$REQUIRED_ACCOUNT" ]]; then
  echo -e "${YELLOW}Warning: Active account is ${ACTIVE_ACCOUNT}${NC}"
  echo -e "${YELLOW}CloudPeers Events deployments should use ${REQUIRED_ACCOUNT}${NC}"
  echo -e "${YELLOW}Switching to ${REQUIRED_ACCOUNT}...${NC}"
  gcloud config set account "$REQUIRED_ACCOUNT" 2>/dev/null || true
fi

ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
echo -e "${GREEN}Active account: ${ACTIVE_ACCOUNT}${NC}"
echo -e "${GREEN}Project: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo ""

# Parse environment argument
ENV=${1:-prod}

if [[ "$ENV" != "staging" && "$ENV" != "prod" ]]; then
  echo -e "${RED}Error: Environment must be 'staging' or 'prod'${NC}"
  echo "Usage: ./deploy.sh [staging|prod]"
  exit 1
fi

# Environment-specific configuration
if [ "$ENV" = "prod" ]; then
  SERVICE_NAME="cloudpeers-events"
  MAX_INSTANCES=10
  MIN_INSTANCES=0
  MEMORY="2Gi"
  CPU=2
  CONCURRENCY=80
  echo -e "${YELLOW}Deploying to PRODUCTION${NC}"

  # Confirmation for production
  read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
  fi
else
  SERVICE_NAME="cloudpeers-events-staging"
  MAX_INSTANCES=3
  MIN_INSTANCES=0
  MEMORY="1Gi"
  CPU=1
  CONCURRENCY=40
  echo -e "${YELLOW}Deploying to STAGING${NC}"
fi

# Build timestamp for image tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="${ENV}-${TIMESTAMP}"
IMAGE_URI="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${GREEN}Step 1: Building with Cloud Build${NC}"
echo "Image URI: ${IMAGE_URI}"

# Public client config (URL + anon key) → build args: Next.js bakes NEXT_PUBLIC_* at
# build time. The service-role key is deliberately NOT baked into the image — it's
# injected at runtime as a secret (deploy step below). heli-ent secret names are
# SUPABASE_URL / SUPABASE_ANON_KEY (NOT the VITE_* names, which don't exist here and
# were the cause of the 2026-06-17 events outage).
echo -e "${GREEN}Fetching public Supabase config from Secret Manager...${NC}"
NEXT_PUBLIC_SUPABASE_URL=$(gcloud secrets versions access latest --secret="SUPABASE_URL" --project="${PROJECT_ID}" 2>/dev/null)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(gcloud secrets versions access latest --secret="SUPABASE_ANON_KEY" --project="${PROJECT_ID}" 2>/dev/null)

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}ERROR: Failed to fetch SUPABASE_URL / SUPABASE_ANON_KEY from ${PROJECT_ID}${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Public config fetched${NC}"

# Gallery proxy origin: the events-flavored gallery service (cloudpeers-gallery-events,
# built with GALLERY_BASE_PATH=/gallery). Empty => /gallery proxy disabled (rewrites()
# no-ops). Must be a BUILD arg — Next bakes rewrites() into the routes manifest.
GALLERY_ORIGIN=$(gcloud run services describe cloudpeers-gallery-events --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)
if [ -n "$GALLERY_ORIGIN" ]; then
  echo -e "${GREEN}✓ Gallery proxy origin: ${GALLERY_ORIGIN}${NC}"
else
  echo -e "${YELLOW}⚠ cloudpeers-gallery-events not found — /gallery proxy disabled this build${NC}"
fi

# Pre-flight: the runtime SA must read every secret the revision mounts, or it fails
# with "Permission denied on secret" (mirrors geojourney/deploy.sh).
for SECRET in SUPABASE_SERVICE_ROLE_KEY EVENTS_CLOUDPEERS_WEBHOOK_SECRET; do
  if ! gcloud secrets get-iam-policy "$SECRET" --project="${PROJECT_ID}" \
      --flatten="bindings[].members" \
      --filter="bindings.role=roles/secretmanager.secretAccessor AND bindings.members=serviceAccount:${RUNTIME_SA}" \
      --format="value(bindings.members)" 2>/dev/null | grep -q "${RUNTIME_SA}"; then
    echo -e "${YELLOW}Granting secretAccessor on ${SECRET} to ${RUNTIME_SA}...${NC}"
    gcloud secrets add-iam-policy-binding "$SECRET" \
      --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor" \
      --project="${PROJECT_ID}" >/dev/null || { echo -e "${RED}Grant failed on ${SECRET} — run as a heli-ent owner${NC}"; exit 1; }
  fi
done
echo -e "${GREEN}✓ Runtime SA can read all mounted secrets${NC}"

# Submit build to Cloud Build (using Secret Manager)
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_IMAGE_URI=${IMAGE_URI},_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},_SUPABASE_SERVICE_KEY=,_GALLERY_ORIGIN=${GALLERY_ORIGIN}" \
  --project="${PROJECT_ID}" \
  --timeout=20m

echo -e "${GREEN}Step 2: Deploying to Cloud Run${NC}"

# Deploy to Cloud Run (using Secret Manager secrets)
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --service-account="${RUNTIME_SA}" \
  --memory="${MEMORY}" \
  --cpu="${CPU}" \
  --min-instances="${MIN_INSTANCES}" \
  --max-instances="${MAX_INSTANCES}" \
  --concurrency="${CONCURRENCY}" \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},GALLERY_ORIGIN=${GALLERY_ORIGIN},CF_IMAGES_HASH=FhizCHnEg5H49vwsYLeUJw" \
  --update-secrets="SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,CLOUDPEERS_WEBHOOK_SECRET=EVENTS_CLOUDPEERS_WEBHOOK_SECRET:latest" \
  --timeout=540 \
  --no-cpu-throttling \
  --cpu-boost \
  --execution-environment=gen2

# Ensure the new revision actually serves. Cloud Run does NOT auto-shift traffic
# if it was previously pinned to a specific revision — every deploy then creates
# a revision that gets 0% traffic and is retired, silently making deploys a no-op
# (mirrors the carepeers prod incident 2026-06-01). Force 100% traffic to latest.
echo -e "${GREEN}Step 2b: Routing traffic to the latest revision${NC}"
gcloud run services update-traffic "${SERVICE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --to-latest

echo -e "${GREEN}Step 3: Retrieving service URL${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format='value(status.url)')

echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""
echo "Environment: ${ENV}"
echo "Service: ${SERVICE_NAME}"
echo "Image: ${IMAGE_URI}"
echo "URL: ${SERVICE_URL}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the deployment: open ${SERVICE_URL}"
echo "2. View logs: gcloud run logs read ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo "3. Register service: See MCP_SERVICE_REGISTRATION.md"
echo ""
echo -e "${GREEN}Service is registered in CloudPeers marketplace:${NC}"
echo "Service ID: cloudpeers-events"
echo "Marketplace: https://services.cloudpeers.com/cloudpeers-events"
echo "Documentation: See MCP_SERVICE_REGISTRATION.md"
echo ""

# Test the service
echo -e "${GREEN}Testing service...${NC}"
sleep 5
curl -I "${SERVICE_URL}" || echo -e "${RED}Service test failed${NC}"
echo ""
