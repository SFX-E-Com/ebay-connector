# GitHub + Cloud Build CI/CD Setup

Automatisches Deployment zu Cloud Run bei jedem Push auf `main` Branch.

## Schritt 1: GitHub Repository vorbereiten

### 1.1 Repository initialisieren (falls noch nicht geschehen)

```bash
cd /Users/simonfestl/Documents/new-ewbay-connector/ebay-connector

# Git initialisieren
git init

# .gitignore erstellen/prüfen
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Next.js
.next/
out/
build/

# Production
dist/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env*.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# Service Account (WICHTIG!)
service-account.json

# IDE
.vscode/
.idea/

# Tests
*.log
EOF

# Ersten Commit
git add .
git commit -m "Initial commit - eBay Connector"
```

### 1.2 GitHub Repository erstellen

Gehe zu https://github.com/new und erstelle ein neues Repository:
- Name: `ebay-connector`
- Private: ✅ (empfohlen)
- Keine README/gitignore hinzufügen (haben wir schon)

```bash
# Remote hinzufügen (ersetze USERNAME)
git remote add origin https://github.com/USERNAME/ebay-connector.git

# Pushen
git branch -M main
git push -u origin main
```

## Schritt 2: Cloud Build mit GitHub verbinden

### 2.1 Cloud Build API aktivieren

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2.2 GitHub App installieren

**Option A: Über Console (einfacher)**

1. Gehe zu: https://console.cloud.google.com/cloud-build/triggers
2. Klicke auf "CREATE TRIGGER"
3. Wähle "Connect Repository"
4. Wähle "GitHub (Cloud Build GitHub App)"
5. Klicke auf "CONTINUE"
6. Authentifiziere dich mit GitHub
7. Wähle dein Repository aus
8. Klicke auf "CONNECT"

**Option B: Über gcloud CLI**

```bash
# GitHub App Installation URL öffnen
echo "Öffne: https://github.com/apps/google-cloud-build"

# Installiere die App für dein Repository
# Dann Repository verbinden:
gcloud alpha builds connections create github \
    --region=europe-west1 \
    github-connection

# Repository verbinden
gcloud alpha builds repositories create ebay-connector \
    --remote-uri=https://github.com/USERNAME/ebay-connector.git \
    --connection=github-connection \
    --region=europe-west1
```

### 2.3 Cloud Build Trigger erstellen

```bash
gcloud builds triggers create github \
    --name="ebay-connector-main" \
    --repo-name="ebay-connector" \
    --repo-owner="USERNAME" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --region=europe-west1
```

**Oder über Console:**

1. Gehe zu: https://console.cloud.google.com/cloud-build/triggers
2. Klicke "CREATE TRIGGER"
3. Konfiguration:
   - **Name**: `ebay-connector-main`
   - **Region**: `europe-west1`
   - **Event**: Push to a branch
   - **Repository**: Wähle dein verbundenes Repository
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file (yaml or json)
   - **Location**: `cloudbuild.yaml`
4. Klicke "CREATE"

## Schritt 3: Service Account Berechtigungen

Cloud Build braucht Berechtigungen für Cloud Run:

```bash
# Projekt ID
PROJECT_ID=$(gcloud config get-value project)

# Cloud Build Service Account
CLOUD_BUILD_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

# Cloud Run Admin Berechtigung
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/run.admin"

# Service Account User (um als Compute SA zu agieren)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/iam.serviceAccountUser"

# Firestore Zugriff für den Compute Engine Service Account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/datastore.user"
```

## Schritt 4: Environment Variables in Cloud Run setzen

Nach dem ersten erfolgreichen Deployment:

### 4.1 Über Console (empfohlen für Secrets)

1. Gehe zu: https://console.cloud.google.com/run
2. Klicke auf `ebay-connector` Service
3. Klicke "EDIT & DEPLOY NEW REVISION"
4. Unter "Variables & Secrets" → "Reference a secret"

**Secrets erstellen:**

```bash
# JWT Secret generieren und speichern
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# eBay Client Secret (ersetze mit deinem echten Secret)
echo -n "YOUR_EBAY_CLIENT_SECRET" | gcloud secrets create ebay-client-secret --data-file=-
```

**Environment Variables setzen:**

```bash
gcloud run services update ebay-connector \
    --region=europe-west1 \
    --update-env-vars="EBAY_CLIENT_ID=YOUR_EBAY_CLIENT_ID" \
    --update-env-vars="EBAY_DEV_ID=YOUR_EBAY_DEV_ID" \
    --update-env-vars="EBAY_SANDBOX=true" \
    --update-env-vars="EBAY_DEFAULT_MARKETPLACE=EBAY_DE" \
    --update-secrets="JWT_SECRET=jwt-secret:latest" \
    --update-secrets="EBAY_CLIENT_SECRET=ebay-client-secret:latest"

# Hinweis: EBAY_REDIRECT_URI und AUTH_URL werden nach erstem Deployment gesetzt
```

### 4.2 Cloud Run URL erhalten

```bash
SERVICE_URL=$(gcloud run services describe ebay-connector \
    --region=europe-west1 \
    --format='value(status.url)')

echo "Deine Cloud Run URL: $SERVICE_URL"

# Redirect URLs setzen
gcloud run services update ebay-connector \
    --region=europe-west1 \
    --update-env-vars="EBAY_REDIRECT_URI=${SERVICE_URL}/api/ebay/oauth/callback" \
    --update-env-vars="AUTH_URL=${SERVICE_URL}"
```

## Schritt 5: Erstes Deployment testen

### 5.1 Manueller Build (zum Testen)

```bash
# Von lokalem Repo
gcloud builds submit --config=cloudbuild.yaml

# Oder Cloud Build Trigger manuell starten
gcloud builds triggers run ebay-connector-main --branch=main
```

### 5.2 Automatisches Deployment via Git Push

```bash
# Änderung machen
echo "# Test" >> README.md

# Commit & Push
git add .
git commit -m "test: trigger cloud build"
git push origin main

# Build Status verfolgen
gcloud builds list --ongoing
```

### 5.3 Logs anschauen

```bash
# Build Logs
gcloud builds list --limit=5
BUILD_ID="[BUILD_ID_FROM_LIST]"
gcloud builds log $BUILD_ID

# Cloud Run Logs
gcloud run services logs tail ebay-connector --region=europe-west1
```

## Schritt 6: eBay RuName mit Cloud Run URL erstellen

Jetzt wo du eine HTTPS URL hast:

1. Gehe zu: https://developer.ebay.com/my/keys (Sandbox)
2. Klicke "+ Add eBay Redirect URL"
3. Fülle aus:
   - **RuName**: `Simon_Festl-SimonFes-n8n-SB-YOUR-SERVICE-NAME`
   - **Display Title**: `eBay Connector - Sandbox`
   - **Privacy Policy URL**: `https://your-service.run.app/privacy`
   - **Auth Accepted URL**: `https://your-service.run.app/oauth/accepted`
   - **Auth Declined URL**: `https://your-service.run.app/oauth/declined`

## Troubleshooting

### Build schlägt fehl: Permission denied

```bash
# Service Account Berechtigungen prüfen
gcloud projects get-iam-policy $(gcloud config get-value project) \
    --flatten="bindings[].members" \
    --filter="bindings.members:*cloudbuild*"
```

### Cloud Run Deployment schlägt fehl

```bash
# Build Logs checken
gcloud builds list --limit=1
gcloud builds log [LATEST_BUILD_ID]
```

### Environment Variables fehlen

```bash
# Alle Env Vars anzeigen
gcloud run services describe ebay-connector \
    --region=europe-west1 \
    --format='value(spec.template.spec.containers[0].env)'
```

## Best Practices

1. **Secrets Management**: Nutze Google Secret Manager für sensible Daten
2. **Branch Protection**: Schütze `main` Branch in GitHub
3. **Testing**: Erstelle separate Trigger für `develop` Branch
4. **Rollback**: Nutze Cloud Run Revisions für schnelles Rollback
5. **Monitoring**: Aktiviere Cloud Monitoring für Alerts

## Nächste Schritte

1. ✅ GitHub Repository pushen
2. ✅ Cloud Build Trigger erstellen
3. ✅ Service Account Berechtigungen setzen
4. ✅ Erstes Deployment durchführen
5. ✅ Environment Variables konfigurieren
6. ✅ eBay RuName mit HTTPS URL erstellen
7. ✅ Admin User erstellen
8. ✅ Testen!
