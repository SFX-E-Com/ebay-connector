#!/bin/bash

# Cloud Run Deployment Script for eBay Connector
# Usage: ./deploy.sh [production|staging]

set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"sharkyv0"}
REGION=${CLOUD_RUN_REGION:-"europe-west1"}
SERVICE_NAME="ebay-connector"
FIRESTORE_DATABASE_ID="ebay-connector"

# Environment (default to production)
ENV=${1:-production}

echo "🚀 Deploying eBay Connector to Cloud Run"
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
echo "   Environment: $ENV"
echo ""

# Set the active GCP project
echo "📋 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Build the Docker image using Cloud Build
echo "🔨 Building Docker image with Cloud Build..."
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
gcloud builds submit --tag $IMAGE_NAME

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."

if [ "$ENV" = "production" ]; then
    # Production deployment
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --timeout 300 \
        --concurrency 80 \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
        --set-env-vars "FIRESTORE_DATABASE_ID=$FIRESTORE_DATABASE_ID" \
        --set-env-vars "NEXT_TELEMETRY_DISABLED=1"
else
    # Staging deployment
    gcloud run deploy "$SERVICE_NAME-staging" \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --timeout 300 \
        --concurrency 80 \
        --min-instances 0 \
        --max-instances 5 \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
        --set-env-vars "FIRESTORE_DATABASE_ID=$FIRESTORE_DATABASE_ID" \
        --set-env-vars "NEXT_TELEMETRY_DISABLED=1"
fi

# Get the deployed URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URL:"
if [ "$ENV" = "production" ]; then
    gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
else
    gcloud run services describe "$SERVICE_NAME-staging" --region $REGION --format='value(status.url)'
fi

echo ""
echo "📝 Next steps:"
echo "   1. Set up environment variables in Cloud Run console"
echo "   2. Configure secrets for sensitive data"
echo "   3. Update eBay OAuth redirect URLs with the deployed URL"
echo "   4. Test the deployment"
