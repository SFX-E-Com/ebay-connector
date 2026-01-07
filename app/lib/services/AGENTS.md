# SERVICES - eBay Connector Core

**Parent:** See root AGENTS.md

## OVERVIEW
Core business logic services for eBay API integration, authentication, and data persistence.

## SERVICE FILES

| File | Purpose | Key Methods |
|------|---------|-------------|
| `ebayOAuth.ts` | OAuth 2.0 flow | `generateUserAuthorizationUrl()`, `exchangeCodeForAccessToken()`, `refreshUserAccessToken()` |
| `ebayTokenRefresh.ts` | Auto token refresh | `ensureValidToken()` - **call before any eBay API** |
| `ebay-trading-api.ts` | Trading API (XML) | `addFixedPriceItem()`, `reviseFixedPriceItem()`, `getItem()`, `searchItemBySkuAndTitle()` |
| `ebay-trading.ts` | Trading API wrapper | Higher-level operations |
| `ebay-listing.ts` | Inventory API listings | `createListing()`, REST-based |
| `ebay-orders.ts` | Order management | `getOrders()`, `shipOrder()` |
| `ebay-returns.ts` | Return handling | Post-order API |
| `ebay-inquiries.ts` | Inquiry handling | Post-order API |
| `ebay-cancellations.ts` | Cancellation handling | Post-order API |
| `ebayAccountService.ts` | Account CRUD | Firestore operations |
| `firestore.ts` | Database layer | `getDoc()`, `queryDocs()`, `createDoc()`, `updateDoc()` |
| `realtimeDebugLogger.ts` | Debug logging | `debug()`, `info()`, `error()` |
| `apiTokenService.ts` | API token management | Token validation, generation |
| `userService.ts` | User management | CRUD operations |

## PATTERNS

### Service Instantiation
```typescript
// Singleton pattern - import the instance, not class
import { ebayOAuthService } from './ebayOAuth';
import { EbayAccountService } from './ebayAccountService'; // Static methods
```

### Trading API Service
```typescript
// Instantiate per-request with account token
const tradingApi = new EbayTradingApiService(
  { accessToken, refreshToken, expiresAt, ...account },
  'EBAY_DE',  // marketplace
  true        // debugMode
);
```

### Token Validation (CRITICAL)
```typescript
// ALWAYS call before eBay API operations
const validAccount = await EbayTokenRefreshService.ensureValidToken({
  id, accessToken, refreshToken, expiresAt, friendlyName
});
```

## TODO
- Line 147 `ebay-listing.ts`: `// TODO: Implement proper token decryption`
