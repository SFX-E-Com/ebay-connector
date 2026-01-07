# EBAY API ROUTES - Dynamic Account Routes

**Parent:** See root AGENTS.md

## OVERVIEW
eBay API proxy routes organized by domain. All routes use `[accountId]` dynamic segment.

## STRUCTURE
```
[accountId]/
├── inventory/           # Inventory API
│   ├── route.ts        # GET list, POST create
│   └── [sku]/route.ts  # GET/PUT/DELETE by SKU
├── offers/              # Offer management
│   └── [offerId]/
│       ├── publish/    # POST publish
│       └── withdraw/   # POST withdraw
├── orders/              # Order management
│   ├── route.ts        # GET orders
│   ├── pending/        # GET pending orders
│   └── [orderId]/
│       └── ship/       # POST ship order
├── trading/             # Trading API (XML)
│   ├── listing/        # Create/update via Trading API
│   ├── item/           # Get item details
│   ├── items/          # Bulk operations
│   ├── search/         # Search by SKU+title
│   ├── status/         # Check item status
│   └── test/           # Verify listing (dry run)
├── returns/             # Post-order returns
├── inquiries/           # Post-order inquiries
├── cancellations/       # Post-order cancellations
├── locations/           # Inventory locations
├── policies/            # Business policies
└── scopes/              # Account scope info
```

## ROUTE PATTERNS

### Standard GET Route
```typescript
export const GET = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request, authData) => {
    const { searchParams } = new URL(request.url);
    // Use authData.ebayAccount.accessToken for eBay API calls
    return NextResponse.json({ success: true, data: result });
  }
);
```

### With eBay Scope Validation
```typescript
export const POST = withEbayAuth(
  '/ebay/{accountId}/inventory',
  async (request, authData) => {
    const body = authData.requestBody; // Pre-parsed!
    // ...
  },
  'INVENTORY_WRITE'  // Validates eBay scope permission
);
```

## KEY ENDPOINTS

| Endpoint | Method | Service | Notes |
|----------|--------|---------|-------|
| `/inventory` | GET/POST | Inventory API | REST-based |
| `/trading/listing` | POST | Trading API | XML, supports regulatory data |
| `/trading/search` | GET | Trading API | SKU+title hybrid search |
| `/trading/status` | GET | Trading API | Check if item active/ended |
| `/orders` | GET | Fulfillment API | Order listing |
| `/returns` | GET/POST | Post-Order API | Return management |

## DEBUG MODE
Add `?debug=1` to any route for detailed logging via RealtimeDebugLogger.
