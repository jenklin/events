#!/bin/bash

# Custom Events Deployment Script using Cloud Build
# Usage: ./deploy.sh [staging|prod]
# Service: custom-events (CloudPeers vertical - Event Management)
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
  echo "This script deploys: ${GREEN}Custom Events${NC}"
  echo "Expected directory:  ${GREEN}events${NC}"
  echo "Current directory:   ${RED}$CURRENT_DIR${NC}"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Correct directory: events${NC}"
echo -e "${GREEN}✓ Deploying: Custom Events (CloudPeers Event Management Service)${NC}"
echo ""

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0243928474}"
REGION="${CLOUD_RUN_REGION:-us-west1}"
IMAGE_NAME="custom-events"

# Verify active account
ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
REQUIRED_ACCOUNT="jkl@cloudpeers.com"

if [[ "$ACTIVE_ACCOUNT" != "$REQUIRED_ACCOUNT" ]]; then
  echo -e "${YELLOW}Warning: Active account is ${ACTIVE_ACCOUNT}${NC}"
  echo -e "${YELLOW}Custom Events deployments should use ${REQUIRED_ACCOUNT}${NC}"
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
  SERVICE_NAME="custom-events"
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
  SERVICE_NAME="custom-events-staging"
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

# Get Supabase credentials from environment or .env.local
if [ -f app/.env.local ]; then
  export $(grep -v '^#' app/.env.local | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}ERROR: NEXT_PUBLIC_SUPABASE_URL not found${NC}"
  echo "Please set Supabase credentials in app/.env.local"
  exit 1
fi

# Submit build to Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_IMAGE_URI=${IMAGE_URI},_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
  --project="${PROJECT_ID}" \
  --timeout=20m

echo -e "${GREEN}Step 2: Deploying to Cloud Run${NC}"

# Deploy to Cloud Run
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --memory="${MEMORY}" \
  --cpu="${CPU}" \
  --min-instances="${MIN_INSTANCES}" \
  --max-instances="${MAX_INSTANCES}" \
  --concurrency="${CONCURRENCY}" \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
  --timeout=540 \
  --no-cpu-throttling \
  --execution-environment=gen2

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
echo "Service ID: custom-events"
echo "Marketplace: https://services.cloudpeers.com/custom-events"
echo "Documentation: See MCP_SERVICE_REGISTRATION.md"
echo ""

# Test the service
echo -e "${GREEN}Testing service...${NC}"
sleep 5
curl -I "${SERVICE_URL}" || echo -e "${RED}Service test failed${NC}"
echo ""
