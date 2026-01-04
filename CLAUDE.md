# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eBay Connector is a Next.js 16 application that provides a unified API and dashboard for managing eBay seller accounts. It handles OAuth authentication, token management, and provides REST API endpoints for eBay operations (inventory, orders, listings, returns, cancellations).

**Context:**
- **Deployment target:** Google Cloud Run (not yet deployed)
- **Usage:** Internal tool for managing own eBay accounts (currently one account)
- **Why Trading API:** The legacy XML-based Trading API is still required because the modern REST APIs don't work reliably for Germany

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run unit tests in watch mode
npm run test:run     # Run unit tests once
npm run test:coverage # Run tests with coverage report
npm run test:integration # Run integration tests with Firebase Emulator
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run E2E tests with Playwright UI
npm run emulator     # Start Firebase Emulator (for manual testing)
```

## Architecture

### Database: Google Firestore (not Prisma)

All data persistence uses Firebase Admin SDK with Firestore. The database service is in `app/lib/services/firestore.ts`.

**Collections:**
- `users` - User accounts with bcrypt password hashing
- `api_tokens` - API tokens for authentication
- `ebay_accounts` - Connected eBay seller accounts with OAuth tokens
- `debug_logs` - Request/response logging
- `user_plans` - Subscription plans
- `api_usage` - API usage tracking

### Authentication Flow

Two authentication layers:

1. **User Auth** (`app/lib/middleware/requireAuth.ts`): JWT-based session auth for dashboard
2. **API Token Auth** (`app/lib/middleware/apiAuth.ts`): Bearer token auth for API endpoints - uses `requireApiToken()` wrapper

### eBay Integration

**Multi-layer auth middleware** (`app/lib/middleware/ebayAuth.ts`):
- `withEbayAuth(endpoint, handler, operation?)` - Wraps handlers with API token + eBay account validation
- Validates endpoint permissions, eBay scopes, and auto-refreshes expired tokens

**Key Services:**
- `ebayOAuth.ts` - OAuth flow using `ebay-oauth-nodejs-client`
- `ebayTokenRefresh.ts` - Automatic token refresh
- `ebayAccountService.ts` - CRUD for eBay accounts
- `ebay-orders.ts` - Fulfillment API wrapper
- `ebay-trading-api.ts` - Legacy Trading API (XML)
- `ebay-listing.ts` - Inventory/Offer API

**Environment toggle:** `EBAY_SANDBOX=true|false` switches between sandbox and production eBay APIs.

### API Route Pattern

All eBay API routes follow `/api/ebay/[accountId]/...` pattern. Example:

```typescript
export const GET = withEbayAuth(
  'ebay.orders',           // Required endpoint permission
  async (request, authData) => {
    // authData.ebayAccount.accessToken is already validated/refreshed
  },
  'ORDERS_READ'            // Optional: required eBay scope
);
```

### Frontend

- **UI Framework:** Chakra UI v3 with Emotion
- **State:** React hooks, no global state library
- **Layout:** `app/components/layout/` - MainLayout, Sidebar, ConditionalLayout
- **eBay Components:** `app/components/ebay/` - Account management modals and cards

### Key Configuration Files

- `app/lib/config/ebay.ts` - eBay API URLs and scopes
- `app/lib/config/endpoints.ts` - API endpoint definitions
- `app/lib/constants/ebayScopes.ts` - Full list of eBay OAuth scopes

### TypeScript Path Alias

`@/*` maps to project root (configured in `tsconfig.json`).

## Testing Strategy

**Recommended Stack:**
- **Vitest** - Fast, ESM-native test runner (preferred over Jest for Next.js 15+)
- **React Testing Library** - Component testing
- **Firebase Emulator Suite** - Integration tests with real Firestore behavior
- **Playwright** - E2E tests for critical flows (OAuth, order fulfillment)

**Test Categories:**
1. **Unit tests** (`*.test.ts`) - Services, utilities, middleware logic
2. **Integration tests** (`*.integration.test.ts`) - API routes with Firebase Emulator
3. **E2E tests** (`e2e/*.spec.ts`) - Login flow, dashboard interactions

**Test Locations:**
- `app/lib/__tests__/` - Unit tests for utilities
- `app/lib/services/__tests__/` - Unit tests for services
- `tests/integration/` - Integration tests
- `e2e/` - Playwright E2E tests
