# Testing eBay Messaging API - Quick Start

This guide provides quick instructions for testing the eBay Messaging API integration.

## Prerequisites

1. **Environment configured** (see `.env.example`)
2. **eBay account connected** (via OAuth)
3. **Dev server running**: `npm run dev`

---

## Method 1: Interactive Test Script (Recommended)

The easiest way to test all messaging endpoints:

```bash
# Run the interactive test script
npx tsx scripts/test-messaging.ts
```

**What it does:**
- Prompts for your auth token and account ID
- Provides a menu of tests:
  1. Get Messages (list)
  2. Get Single Message
  3. Send Message
  4. Mark Message as Read
  5. Get Order Messages
  6. Run All Tests (read-only)

**Example Session:**
```
Enter your auth token: eyJhbGciOiJIUzI1NiIs...
Enter eBay account ID: abc123...

Available Tests:
1. Get Messages (list)
2. Get Single Message
...
Select test (0-6): 1

✅ Success!
Total messages: 5
Messages returned: 5
```

---

## Method 2: UI Testing Page

Visual interface for testing messaging:

1. **Navigate to**: `http://localhost:3000/messages-test`

2. **Select Account**: Choose your connected eBay account

3. **Test Inbox**:
   - Click "Load Messages"
   - View messages in table
   - Click "Mark Read" on unread messages

4. **Test Sending**:
   - Switch to "Send Message" tab
   - Fill in:
     - Item ID (from eBay)
     - Recipient Username
     - Message body
   - Click "Send Message"

---

## Method 3: E2E Tests

Automated tests using Playwright:

```bash
# Set up test environment
export TEST_EBAY_ACCOUNT_ID="your-account-id"
export TEST_USER_EMAIL="admin@example.com"
export TEST_USER_PASSWORD="your-password"

# Run all messaging tests
npm run test:e2e -- e2e/messaging.spec.ts

# Run specific test
npm run test:e2e -- e2e/messaging.spec.ts -g "should return messages list"
```

---

## Method 4: Manual API Testing

Using curl or any HTTP client:

### Get Messages

```bash
TOKEN="your-jwt-token"
ACCOUNT_ID="your-account-id"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages?limit=10&includeBody=true"
```

### Get Single Message

```bash
MESSAGE_ID="12345"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages/$MESSAGE_ID"
```

### Send Message

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "123456789",
    "recipientId": "buyer_username",
    "body": "Thank you for your question!",
    "subject": "Re: Your Question",
    "questionType": "General"
  }' \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages"
```

### Mark as Read

```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read": true}' \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/messages/$MESSAGE_ID"
```

### Get Order Messages

```bash
ORDER_ID="12-34567-89012"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/orders/$ORDER_ID/messages"
```

### Send Order Message

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Your order has been shipped!"
  }' \
  "http://localhost:3000/api/ebay/$ACCOUNT_ID/orders/$ORDER_ID/messages"
```

---

## Unit Tests

Test the service layer without hitting eBay APIs:

```bash
# Run all unit tests
npm run test:run

# Run only messaging tests
npm run test:run -- app/lib/services/__tests__/ebay-messaging.test.ts

# Watch mode
npm run test -- app/lib/services/__tests__/ebay-messaging.test.ts
```

**Current Coverage:**
- 20 tests for `EbayMessagingService`
- Tests cover: getMyMessages, getMessage, sendMessage, markAsRead, flagMessages, deleteMessages
- All tests use mocked eBay API responses

---

## Getting Your Auth Token

### From Browser (Dev Tools)

1. Log in to the app
2. Open browser DevTools (F12)
3. Go to **Application** → **Local Storage**
4. Copy value of `token`

### From Login Response

```bash
# Login via API
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}' \
  http://localhost:3000/api/auth/login

# Response includes token:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

---

## Getting Your Account ID

### From UI

1. Navigate to eBay Accounts page
2. The account ID is shown in the URL or account details

### From API

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ebay-accounts

# Response includes accounts:
{
  "success": true,
  "accounts": [
    {
      "id": "abc123...",  // <-- This is your account ID
      "friendlyName": "My eBay Account",
      ...
    }
  ]
}
```

---

## Troubleshooting

### "Unauthorized" Error

- Check that your token is valid (not expired)
- Make sure you're logged in
- Token format: `Authorization: Bearer <token>`

### "Account not found"

- Verify the account ID is correct
- Make sure the account is connected via OAuth
- Check that the account belongs to your user

### "Invalid OAuth token" (from eBay)

- eBay access token may be expired
- The app should auto-refresh, but you may need to re-authenticate
- Check `EBAY_SANDBOX` matches your environment

### No messages returned

- Make sure you have messages in your eBay account
- Try with `includeBody=true` to see full message details
- Check folder filter (0=Inbox, 1=Sent)

### "Item not found" when sending

- Verify the item ID exists and belongs to your account
- For sandbox, use sandbox item IDs
- Item must be active

---

## Next Steps

1. **Run the interactive test script** first to verify setup
2. **Use the UI** for manual testing and exploration
3. **Set up E2E tests** for automated testing
4. **See EBAY_SANDBOX_SETUP.md** for sandbox configuration

---

## API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ebay/[accountId]/messages` | List messages |
| POST | `/api/ebay/[accountId]/messages` | Send message |
| GET | `/api/ebay/[accountId]/messages/[messageId]` | Get single message |
| PATCH | `/api/ebay/[accountId]/messages/[messageId]` | Update message (read/flagged) |
| DELETE | `/api/ebay/[accountId]/messages/[messageId]` | Delete message |
| GET | `/api/ebay/[accountId]/orders/[orderId]/messages` | Get order messages |
| POST | `/api/ebay/[accountId]/orders/[orderId]/messages` | Send order message |

---

## Support

- **API Docs**: See `docs/API.md`
- **Sandbox Setup**: See `docs/EBAY_SANDBOX_SETUP.md`
- **Issues**: GitHub Issues
- **eBay Developer**: https://developer.ebay.com/support
