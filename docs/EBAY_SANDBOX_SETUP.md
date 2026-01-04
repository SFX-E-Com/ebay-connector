# eBay Sandbox Configuration Guide

This guide explains how to set up and test the eBay Connector with eBay's Sandbox environment.

## Table of Contents

1. [What is eBay Sandbox?](#what-is-ebay-sandbox)
2. [Getting Started](#getting-started)
3. [Environment Configuration](#environment-configuration)
4. [Creating Test Users](#creating-test-users)
5. [Testing Messaging API](#testing-messaging-api)
6. [Common Issues](#common-issues)

---

## What is eBay Sandbox?

eBay Sandbox is a testing environment that mirrors the production eBay API but uses test data. It allows you to:

- Test API integrations without affecting real listings or orders
- Create test buyers and sellers
- Simulate transactions, messages, returns, etc.
- Debug issues before going live

**Important:** Sandbox and Production are completely separate environments with different:
- API credentials
- User accounts
- Listings and orders
- OAuth tokens

---

## Getting Started

### 1. Create eBay Developer Account

1. Go to [eBay Developers Program](https://developer.ebay.com/)
2. Sign up or log in
3. Navigate to **My Account** → **Application Keys**

### 2. Create a Sandbox Application

1. Click **Create Application**
2. Fill in application details:
   - **Application Title**: e.g., "eBay Connector Sandbox"
   - **Application Type**: "Server-to-Server"
3. Submit and wait for approval (usually instant)

### 3. Get Sandbox Keys

Once approved, you'll get:
- **Sandbox App ID (Client ID)**
- **Sandbox Cert ID (Client Secret)**
- **Sandbox Dev ID** (for Trading API)

---

## Environment Configuration

### Required Environment Variables

Create or update your `.env.local` file:

```bash
# eBay Sandbox Configuration
EBAY_SANDBOX=true

# Sandbox API Credentials
EBAY_CLIENT_ID=your-sandbox-app-id
EBAY_CLIENT_SECRET=your-sandbox-cert-id
EBAY_DEV_ID=your-sandbox-dev-id

# Redirect URI (must match in Developer Portal)
EBAY_REDIRECT_URI=http://localhost:3000/api/ebay/oauth/callback

# Default Marketplace
EBAY_DEFAULT_MARKETPLACE=EBAY_DE

# OAuth Scopes (space-separated)
EBAY_OAUTH_SCOPES=https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.fulfillment
```

### Sandbox vs Production Toggle

The `EBAY_SANDBOX` variable controls which environment is used:

```typescript
// In your code, this automatically selects the right endpoint
const apiUrl = process.env.EBAY_SANDBOX === 'true'
  ? 'https://api.sandbox.ebay.com/...'
  : 'https://api.ebay.com/...';
```

**Current Sandbox Endpoints:**
- REST APIs: `https://api.sandbox.ebay.com`
- Trading API: `https://api.sandbox.ebay.com/ws/api.dll`
- OAuth: `https://auth.sandbox.ebay.com/oauth2/authorize`

---

## Creating Test Users

### 1. Access Sandbox User Management

1. Go to [eBay Sandbox User Registration](https://developer.ebay.com/sandbox/register)
2. Log in with your developer account

### 2. Create Test Seller

1. Click **Create User**
2. Fill in details:
   - **User Type**: Seller
   - **Username**: e.g., `testseller_de123`
   - **Email**: Your email (will receive test notifications)
   - **Password**: Set a password
   - **Site ID**: Select your marketplace (e.g., Germany - 77)

3. Click **Create**
4. Note down the credentials

### 3. Create Test Buyer (Optional)

Same steps as above, but select **User Type: Buyer**

### 4. Add Test Listings

You can either:

**Option A: Use eBay Sandbox UI**
1. Go to [Sandbox Seller Hub](https://sandbox.ebay.com)
2. Log in with your test seller account
3. Create listings manually

**Option B: Use the API**
```bash
# Using your eBay Connector
# 1. Connect your sandbox seller account
# 2. Use the Inventory API to create listings
POST /api/ebay/{accountId}/listings
```

---

## Testing Messaging API

### Method 1: Using the Test Script

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the interactive test script
npx tsx scripts/test-messaging.ts
```

The script will prompt you for:
- Auth token (get from login)
- eBay account ID
- Then select which endpoints to test

### Method 2: Using the Test UI

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to: `http://localhost:3000/messages-test`

3. Steps:
   - Select your connected sandbox account
   - Click "Load Messages" to fetch
   - Use the "Send Message" tab to test sending

### Method 3: Manual API Testing

```bash
# Get your auth token
TOKEN="your-jwt-token"
ACCOUNT_ID="your-sandbox-account-id"

# List messages
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages?limit=10"

# Get single message
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages/{messageId}"

# Send message
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "123456789",
    "recipientId": "testbuyer",
    "body": "Test message",
    "questionType": "General"
  }' \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages"
```

### Method 4: E2E Tests

```bash
# Set test environment variables
export TEST_EBAY_ACCOUNT_ID="your-sandbox-account-id"
export TEST_USER_EMAIL="admin@example.com"
export TEST_USER_PASSWORD="your-password"

# Run E2E tests
npm run test:e2e -- e2e/messaging.spec.ts
```

---

## Testing Full Messaging Flow

### 1. Create Test Conversation

1. **As Seller** (using Sandbox UI):
   - Create a listing
   - Note the Item ID

2. **As Buyer** (using different browser/incognito):
   - Log in to Sandbox with test buyer account
   - Find the listing
   - Click "Ask a question"
   - Send a message to seller

3. **As Seller** (using your app):
   - Connect sandbox seller account in eBay Connector
   - Navigate to `/messages-test`
   - Click "Load Messages"
   - You should see the buyer's question

4. **Reply to Buyer**:
   - Use "Send Message" tab
   - Enter Item ID, Buyer username, and message
   - Send

### 2. Test Order Messages

```bash
# 1. Create a test order in Sandbox
# (Place order as test buyer)

# 2. Get order messages
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/orders/{orderId}/messages"

# 3. Send message to buyer about order
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Your order has shipped!"
  }' \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/orders/{orderId}/messages"
```

---

## Common Issues

### Issue 1: "Invalid OAuth token"

**Cause:** Sandbox tokens are separate from production tokens.

**Solution:**
1. Make sure `EBAY_SANDBOX=true` in `.env.local`
2. Re-authenticate your sandbox account
3. Generate a new OAuth token for sandbox

### Issue 2: "Application not found"

**Cause:** Using production Client ID with sandbox environment.

**Solution:** Double-check you're using sandbox credentials:
```bash
# These should be different from production
EBAY_CLIENT_ID=your-SANDBOX-app-id
EBAY_CLIENT_SECRET=your-SANDBOX-cert-id
```

### Issue 3: "User not found"

**Cause:** Test users only exist in sandbox.

**Solution:**
- Create test users through Sandbox User Registration
- Use sandbox-specific usernames (e.g., `testseller_de123`)

### Issue 4: No messages appearing

**Cause:** Messages must be created within sandbox environment.

**Solutions:**
1. Log into [Sandbox eBay](https://sandbox.ebay.com) with test buyer
2. Send a message to your test seller via "Ask a question"
3. Or create messages through the API

### Issue 5: "Item not found"

**Cause:** Item IDs are environment-specific.

**Solution:**
- Create test listings in sandbox first
- Use sandbox item IDs (visible in Sandbox Seller Hub)

### Issue 6: Rate Limiting

**Issue:** Sandbox has stricter rate limits than production.

**Solution:**
- Add delays between API calls in tests
- Use pagination to reduce request frequency
- Contact eBay Developer Support for limit increases

---

## Switching Between Sandbox and Production

### To Use Sandbox:

```bash
# .env.local
EBAY_SANDBOX=true
EBAY_CLIENT_ID=sandbox-app-id
EBAY_CLIENT_SECRET=sandbox-cert-id
```

### To Use Production:

```bash
# .env.local
EBAY_SANDBOX=false
EBAY_CLIENT_ID=production-app-id
EBAY_CLIENT_SECRET=production-cert-id
```

**Important:**
- Always test in Sandbox first
- Keep separate accounts for sandbox and production
- Never mix sandbox and production data

---

## Additional Resources

- [eBay Sandbox Documentation](https://developer.ebay.com/api-docs/static/gs_sandbox.html)
- [Trading API Reference](https://developer.ebay.com/devzone/xml/docs/reference/ebay/index.html)
- [Post-Order API](https://developer.ebay.com/api-docs/sell/post-order/overview.html)
- [OAuth in Sandbox](https://developer.ebay.com/api-docs/static/oauth-sandbox-tokens.html)

---

## Quick Reference: Sandbox URLs

| Service | URL |
|---------|-----|
| REST APIs | `https://api.sandbox.ebay.com` |
| Trading API | `https://api.sandbox.ebay.com/ws/api.dll` |
| OAuth Authorize | `https://auth.sandbox.ebay.com/oauth2/authorize` |
| OAuth Token | `https://api.sandbox.ebay.com/identity/v1/oauth2/token` |
| Seller Hub | `https://sandbox.ebay.com` |
| User Registration | `https://developer.ebay.com/sandbox/register` |

---

## Need Help?

If you encounter issues:

1. Check this guide first
2. Review the [eBay Developer Forums](https://community.ebay.com/t5/Developer-Forums/ct-p/developer-forums)
3. Create an issue in the project repository
4. Contact eBay Developer Support for API-specific questions
