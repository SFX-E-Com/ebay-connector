# MIDDLEWARE - Auth & Validation Layer

**Parent:** See root AGENTS.md

## OVERVIEW
Authentication, authorization, and validation middleware for API routes.

## FILES

| File | Purpose | Usage |
|------|---------|-------|
| `apiAuth.ts` | API token auth | `requireApiToken(handler)` |
| `ebayAuth.ts` | eBay account + token validation | `withEbayAuth(endpoint, handler, operation?)` |
| `ebayScopeValidation.ts` | eBay OAuth scope check | Auto-validates scope permissions |
| `endpointValidation.ts` | Endpoint permission check | Validates token has endpoint access |
| `requireAuth.ts` | JWT user auth | For UI routes |
| `queryDebugMiddleware.ts` | Debug logging | `logToDebug()` helper |

## MIDDLEWARE CHAIN

```
Request -> requireApiToken -> withEbayAuth -> Handler
              |                   |
         Validate Bearer    1. Extract accountId
         API token          2. Validate endpoint access
                            3. Validate eBay scope (if specified)
                            4. Ensure valid eBay token
                            5. Pass EbayAuthData to handler
```

## USAGE

### Standard eBay Route
```typescript
// app/api/ebay/[accountId]/example/route.ts
import { withEbayAuth, EbayAuthData } from '@/app/lib/middleware/ebayAuth';

export const GET = withEbayAuth(
  '/ebay/{accountId}/inventory',  // endpoint permission
  async (request, authData: EbayAuthData) => {
    const { ebayAccount, user } = authData;
    // ebayAccount.accessToken is guaranteed valid
  },
  'INVENTORY_READ'  // optional: required eBay scope operation
);
```

### EbayAuthData Shape
```typescript
interface EbayAuthData {
  user: { id, email, role };
  token: { id, name };
  ebayAccount: {
    id, accessToken, refreshToken, expiresAt,
    friendlyName, ebayUserId, ebayUsername, status
  };
  requestBody?: any;  // Pre-parsed body (POST/PUT)
}
```

## ANTI-PATTERNS
- Don't read `request.json()` in handler - use `authData.requestBody`
- Don't skip `withEbayAuth` for eBay routes - token may be expired
