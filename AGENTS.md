# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-07
**Commit:** 932c12e
**Branch:** main

## OVERVIEW
eBay Connector API - Next.js 16 app for multi-account eBay OAuth management, inventory/order sync, and Trading API integration. Uses Firestore, Chakra UI, and supports sandbox/production modes.

## STRUCTURE
```
ebay_connector/
├── app/
│   ├── api/           # Next.js API routes
│   │   ├── auth/      # User auth (JWT-based)
│   │   ├── ebay/      # eBay API proxy routes
│   │   └── ...
│   ├── lib/           # Core business logic
│   │   ├── services/  # See services/AGENTS.md
│   │   ├── middleware/# See middleware/AGENTS.md
│   │   ├── config/    # eBay endpoints, scopes
│   │   ├── constants/ # OAuth scope definitions
│   │   └── types/     # Trading API types
│   ├── components/    # React components (Chakra UI)
│   └── hooks/         # Data table hooks
├── docs/              # API documentation
└── public/
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add eBay API endpoint | `app/api/ebay/[accountId]/` | Use `withEbayAuth` middleware |
| Modify OAuth flow | `app/lib/services/ebayOAuth.ts` | Token exchange logic |
| Add eBay scope | `app/lib/constants/ebayScopes.ts` | Update EBAY_OAUTH_SCOPES |
| Change auth middleware | `app/lib/middleware/` | apiAuth, ebayAuth, requireAuth |
| Add Trading API call | `app/lib/services/ebay-trading-api.ts` | XML builder/parser included |
| Debug API issues | Enable `debug=1` query param | Uses RealtimeDebugLogger |

## CONVENTIONS

### API Routes
- All eBay routes: `/api/ebay/[accountId]/...` - dynamic account ID
- Auth via Bearer token: `requireApiToken()` middleware
- eBay auth: `withEbayAuth(endpoint, handler, operation?)` wrapper
- Response format: `{ success: bool, data?: any, message?: string }`

### Services Pattern
- Singleton exports: `export const serviceName = new ServiceClass()`
- Async methods with try/catch, error logging
- Use `RealtimeDebugLogger` for debug mode

### Types
- Firestore types in `app/lib/services/firestore.ts`
- Trading API types in `app/lib/types/ebay-trading-api.types.ts`
- Use Zod for runtime validation (imported in routes)

## ANTI-PATTERNS (THIS PROJECT)

- `// TODO: Implement proper token decryption` in ebay-listing.ts (line 147)
- Don't use `any` for eBay API responses - use defined types
- Don't call Trading API without debug mode consideration
- Never store plain OAuth tokens - always use Firestore encryption pattern

## UNIQUE STYLES

### Country Normalization
All country inputs auto-normalized to ISO 3166-1 alpha-2:
```typescript
// "Germany", "DE", "DEU", "Deutschland" -> "DE"
import { normalizeCountry } from '@/app/lib/utils/country-normalizer';
```

### XML Building (Trading API)
```typescript
// Uses fast-xml-parser with CDATA for descriptions
const xml = this.xmlBuilder.build(request);
xml = xml.replace(`<Description>...</Description>`, 
  `<Description><![CDATA[${description}]]></Description>`);
```

### Firestore Proxy
```typescript
// Lazy-loaded singleton with proxy pattern
export const db = new Proxy({} as Firestore, { get() { ... } });
```

## COMMANDS
```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run lint      # ESLint check
```

## ENV VARS (Critical)
```
GOOGLE_CLOUD_PROJECT     # Firestore project
EBAY_CLIENT_ID           # OAuth credentials
EBAY_CLIENT_SECRET       
EBAY_REDIRECT_URI        
EBAY_SANDBOX=true/false  # Toggle sandbox mode
JWT_SECRET               # Auth token signing
```

## NOTES

- eBay has TWO APIs: **Inventory API** (RESTful) and **Trading API** (XML/SOAP)
- Trading API needed for: item status, search by SKU+title, bulk operations
- Token refresh automatic via `EbayTokenRefreshService.ensureValidToken()`
- Rate limits: OAuth refresh 1/min, listings 5k/day, API calls 5k/hour
