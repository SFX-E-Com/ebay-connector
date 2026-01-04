# eBay Connector - Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud SDK** installiert:
   ```bash
   gcloud --version
   ```

2. **Authentifizierung**:
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```

3. **Erforderliche APIs aktivieren**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

## Deployment

### 1. Schnelles Deployment

```bash
./deploy.sh production
```

### 2. Staging Deployment

```bash
./deploy.sh staging
```

## Environment Variables Setup

Nach dem ersten Deployment musst du die Umgebungsvariablen in der Cloud Run Console setzen:

### Über Console (empfohlen für Secrets):

1. Gehe zu: https://console.cloud.google.com/run
2. Wähle deinen Service aus
3. Klicke auf "Edit & Deploy New Revision"
4. Unter "Variables & Secrets" → "Add Variable"

### Erforderliche Environment Variables:

```bash
# eBay API Credentials
EBAY_CLIENT_ID=your-production-client-id
EBAY_CLIENT_SECRET=your-production-client-secret
EBAY_DEV_ID=your-dev-id
EBAY_SANDBOX=false
EBAY_DEFAULT_MARKETPLACE=EBAY_DE

# OAuth URLs (ersetze mit deiner Cloud Run URL)
EBAY_REDIRECT_URI=https://your-service-url.run.app/api/ebay/oauth/callback
AUTH_URL=https://your-service-url.run.app

# JWT Secret (generiere neu!)
JWT_SECRET=$(openssl rand -base64 32)

# Google Cloud
GOOGLE_CLOUD_PROJECT=sharkyv0
FIRESTORE_DATABASE_ID=ebay-connector

# Service Account wird automatisch von Cloud Run bereitgestellt
# GOOGLE_APPLICATION_CREDENTIALS nicht nötig in Cloud Run!

# App Configuration
NODE_ENV=production
PORT=8080
NEXT_TELEMETRY_DISABLED=1
```

### Service Account Setup

Cloud Run nutzt automatisch den Compute Engine Service Account. Stelle sicher, dass dieser Zugriff auf Firestore hat:

```bash
# Service Account Email
SERVICE_ACCOUNT="PROJECT_NUMBER-compute@developer.gserviceaccount.com"

# Firestore Berechtigung geben
gcloud projects add-iam-policy-binding sharkyv0 \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/datastore.user"
```

## Nach dem Deployment

### 1. URL erhalten

```bash
gcloud run services describe ebay-connector \
    --region europe-west1 \
    --format='value(status.url)'
```

### 2. eBay Developer Portal aktualisieren

Gehe zu https://developer.ebay.com und aktualisiere:

**Production RuName:**
- Display Title: `eBay Connector`
- Privacy Policy URL: `https://your-service.run.app/privacy`
- Auth Accepted URL: `https://your-service.run.app/oauth/accepted`
- Auth Declined URL: `https://your-service.run.app/oauth/declined`

**WICHTIG**: Verwende die EXAKTE URL von Cloud Run!

### 3. Ersten Admin-User erstellen

```bash
# Mit Cloud Run verbinden
gcloud run services proxy ebay-connector --region europe-west1

# In neuem Terminal:
FIRESTORE_DATABASE_ID=ebay-connector \
GOOGLE_CLOUD_PROJECT=sharkyv0 \
node scripts/create-admin.js
```

Oder verwende Cloud Shell direkt in der GCP Console.

## Logs anzeigen

```bash
# Live Logs
gcloud run services logs tail ebay-connector --region europe-west1

# Logs in Console
https://console.cloud.google.com/run/detail/europe-west1/ebay-connector/logs
```

## Troubleshooting

### Build schlägt fehl

```bash
# Lokalen Build testen
docker build -t ebay-connector .
docker run -p 8080:8080 ebay-connector
```

### Service startet nicht

1. Überprüfe Logs in Cloud Console
2. Stelle sicher, dass PORT=8080 gesetzt ist
3. Überprüfe Service Account Berechtigungen

### Firestore Connection Error

```bash
# Service Account Berechtigungen überprüfen
gcloud projects get-iam-policy sharkyv0 \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:*compute@developer.gserviceaccount.com"
```

## Kosten optimieren

### Auto-Scaling konfigurieren:

```bash
gcloud run services update ebay-connector \
    --region europe-west1 \
    --min-instances 0 \
    --max-instances 3 \
    --concurrency 80
```

### Memory/CPU reduzieren (wenn möglich):

```bash
gcloud run services update ebay-connector \
    --region europe-west1 \
    --memory 256Mi \
    --cpu 1
```

## Custom Domain (optional)

```bash
# Domain mapping erstellen
gcloud run domain-mappings create \
    --service ebay-connector \
    --domain yourdomain.com \
    --region europe-west1
```

## Rollback

```bash
# Liste alle Revisionen
gcloud run revisions list --service ebay-connector --region europe-west1

# Rollback zu vorheriger Revision
gcloud run services update-traffic ebay-connector \
    --region europe-west1 \
    --to-revisions REVISION-NAME=100
```
