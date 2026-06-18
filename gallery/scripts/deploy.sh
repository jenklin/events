#!/bin/bash

# CloudPeers Gallery Deployment — reuses the events.cloudpeers.com deploy approach.
#
# Usage: ./scripts/deploy.sh [events|root]
#   events  (DEFAULT) -> service cloudpeers-gallery-events, basePath '/gallery'
#                        reached via creator-portal rewrite at events.cloudpeers.com/gallery
#   root    (OPT-IN)  -> service cloudpeers-gallery, basePath ''
#                        for a standalone gallery.cloudpeers.com (only if you map that domain)
#
# Default is events-only; the separate gallery.cloudpeers.com surface is NOT deployed
# unless you explicitly run `./scripts/deploy.sh root`.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

# Resolve repo root from THIS script's location (gallery/scripts/deploy.sh) so it
# works regardless of the invoking cwd. (Don't use `git rev-parse` from cwd.)
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

# --- Config (same project/SA/secrets as the events service) ---
PROJECT_ID="heli-ent"
REGION="us-central1"
RUNTIME_SA="cloudpeers-deployer@heli-ent.iam.gserviceaccount.com"
CF_IMAGES_HASH="FhizCHnEg5H49vwsYLeUJw"   # shared Cloudflare Images delivery hash

# --- Surface selection (default: events) ---
SURFACE=${1:-events}
case "$SURFACE" in
  events)
    SERVICE_NAME="cloudpeers-gallery-events"
    GALLERY_BASE_PATH="/gallery"
    APP_URL="https://events.cloudpeers.com/gallery"
    ;;
  root)
    SERVICE_NAME="cloudpeers-gallery"
    GALLERY_BASE_PATH=""
    APP_URL="https://gallery.cloudpeers.com"
    echo -e "${YELLOW}Deploying the OPT-IN standalone gallery.cloudpeers.com surface.${NC}"
    ;;
  *)
    echo -e "${RED}Error: surface must be 'events' (default) or 'root'${NC}"
    echo "Usage: ./scripts/deploy.sh [events|root]"
    exit 1
    ;;
esac

# Verify active account (events deploys use jkl@cloudpeers.com / heli-ent)
ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
REQUIRED_ACCOUNT="jkl@cloudpeers.com"
if [[ "$ACTIVE_ACCOUNT" != "$REQUIRED_ACCOUNT" ]]; then
  echo -e "${YELLOW}Switching active account to ${REQUIRED_ACCOUNT}...${NC}"
  gcloud config set account "$REQUIRED_ACCOUNT" 2>/dev/null || true
fi

echo -e "${GREEN}Surface:  ${SURFACE}  (service ${SERVICE_NAME}, basePath '${GALLERY_BASE_PATH}')${NC}"
echo -e "${GREEN}Project:  ${PROJECT_ID} / ${REGION}${NC}"
echo ""

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_URI="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${TIMESTAMP}"

# Public Supabase config (efps) → build args (Next bakes NEXT_PUBLIC_* at build time).
echo -e "${GREEN}Fetching public Supabase config from Secret Manager...${NC}"
NEXT_PUBLIC_SUPABASE_URL=$(gcloud secrets versions access latest --secret="SUPABASE_URL" --project="${PROJECT_ID}" 2>/dev/null)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(gcloud secrets versions access latest --secret="SUPABASE_ANON_KEY" --project="${PROJECT_ID}" 2>/dev/null)
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}ERROR: Failed to fetch SUPABASE_URL / SUPABASE_ANON_KEY from ${PROJECT_ID}${NC}"
  exit 1
fi

# Pre-flight: runtime SA must read the service-role secret it mounts.
if ! gcloud secrets get-iam-policy "SUPABASE_SERVICE_ROLE_KEY" --project="${PROJECT_ID}" \
    --flatten="bindings[].members" \
    --filter="bindings.role=roles/secretmanager.secretAccessor AND bindings.members=serviceAccount:${RUNTIME_SA}" \
    --format="value(bindings.members)" 2>/dev/null | grep -q "${RUNTIME_SA}"; then
  echo -e "${YELLOW}Granting secretAccessor on SUPABASE_SERVICE_ROLE_KEY to ${RUNTIME_SA}...${NC}"
  gcloud secrets add-iam-policy-binding "SUPABASE_SERVICE_ROLE_KEY" \
    --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}" >/dev/null || { echo -e "${RED}Grant failed — run as a heli-ent owner${NC}"; exit 1; }
fi

echo -e "${GREEN}Step 1: Building with Cloud Build (${IMAGE_URI})${NC}"
gcloud builds submit . \
  --config=gallery/cloudbuild.yaml \
  --substitutions="_IMAGE_URI=${IMAGE_URI},_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},_CF_IMAGES_HASH=${CF_IMAGES_HASH},_GALLERY_BASE_PATH=${GALLERY_BASE_PATH}" \
  --project="${PROJECT_ID}" \
  --timeout=20m

echo -e "${GREEN}Step 2: Deploying to Cloud Run${NC}"
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --service-account="${RUNTIME_SA}" \
  --memory="1Gi" --cpu=1 --min-instances=0 --max-instances=5 --concurrency=80 \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GALLERY_BASE_PATH=${GALLERY_BASE_PATH},NEXT_PUBLIC_APP_URL=${APP_URL},NEXT_PUBLIC_CF_IMAGES_HASH=${CF_IMAGES_HASH},NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --update-secrets="SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest" \
  --timeout=540 --execution-environment=gen2

# Force 100% traffic to the new revision (Cloud Run won't auto-shift if pinned).
gcloud run services update-traffic "${SERVICE_NAME}" \
  --platform=managed --region="${REGION}" --project="${PROJECT_ID}" --to-latest

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform=managed --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')

echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo "Surface:     ${SURFACE}"
echo "Service:     ${SERVICE_NAME}"
echo "Service URL: ${SERVICE_URL}"
echo ""
if [ "$SURFACE" = "events" ]; then
  echo -e "${YELLOW}Next: set GALLERY_ORIGIN=${SERVICE_URL} on the creator-portal (events) service and redeploy it,${NC}"
  echo -e "${YELLOW}so events.cloudpeers.com/gallery/* proxies here.${NC}"
else
  echo -e "${YELLOW}Next: map gallery.cloudpeers.com -> ${SERVICE_NAME} (gcloud beta run domain-mappings create).${NC}"
fi
