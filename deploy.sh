#!/bin/bash
set -e

echo "🚀 Deploying Multiplayer AGY Coding Platform to Google Cloud Run"
echo ""

PROJECT_ID="finance-flow-482819"
REGION="us-central1"
SERVICE_NAME="multiplayer-coding-agent"
REPO_NAME="multiplayer-coding-agent-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

GEMINI_API_KEY="${GEMINI_API_KEY:-}"

echo "🔑 Step 1: Ensuring GCP services are enabled..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project ${PROJECT_ID} --quiet

echo "📦 Step 2: Ensuring Artifact Registry exists..."
if ! gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Multiplayer AGY Coding Agent Docker Repository" \
    --project=${PROJECT_ID}
fi

echo "🏗️ Step 3: Building Docker image..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
docker build -t ${IMAGE_NAME} .

echo "⬆️ Step 4: Pushing Docker image to Artifact Registry..."
docker push ${IMAGE_NAME}

echo "🌐 Step 5: Deploying to Google Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --project ${PROJECT_ID}

echo ""
echo "✅ Cloud Run Deployment Complete!"
echo ""
echo "🌍 App active at:"
gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)' --project ${PROJECT_ID}
