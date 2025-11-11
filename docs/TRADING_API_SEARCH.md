# Trading API - Search Items by Title and/or SKU

Search for eBay listings from a seller's inventory using title and/or SKU.

## Endpoint

```
GET /api/ebay/[accountId]/trading/search
```

## Authentication

Requires valid eBay Trading API token with scope: `/ebay/{accountId}/inventory`

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | No* | - | Search by title (case-insensitive, partial match) |
| `sku` | string | No* | - | Search by SKU (exact match) |
| `marketplace` | string | No | `EBAY_DE` | eBay marketplace (e.g., `EBAY_US`, `EBAY_DE`, `EBAY_GB`) |
| `limit` | integer | No | `50` | Maximum number of results to return |
| `debug` | string | No | - | Set to `1` to enable debug mode with detailed logging |

**Note:** At least one of `title` or `sku` is required. If both are provided, items must match BOTH conditions.

## Search Behavior

### Single Parameter Search

**By Title Only:**
- Performs case-insensitive partial match
- Example: `title=iPhone` will match "iPhone 12", "Apple iPhone 13 Pro", "iPhone SE"

**By SKU Only:**
- Performs exact match
- Example: `sku=PROD-001` will only match items with exactly that SKU

### Both Parameters (AND Logic)

**When both title AND sku are provided:**
- Items must match BOTH conditions
- Title is partial match (case-insensitive)
- SKU is exact match
- Example: `title=iPhone&sku=PROD-001` will only return items that:
  - Contain "iPhone" in the title (case-insensitive)
  - AND have SKU exactly "PROD-001"

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "searchCriteria": {
      "title": "iPhone",
      "sku": "PROD-001",
      "matchBoth": true
    },
    "totalFound": 2,
    "items": [
      {
        "itemId": "123456789012",
        "sku": "PROD-001",
        "title": "Apple iPhone 13 Pro Max 256GB",
        "currentPrice": 999.99,
        "currency": "EUR",
        "quantity": {
          "total": 10,
          "sold": 3,
          "available": 7
        },
        "listingStatus": "Active",
        "listingType": "FixedPriceItem",
        "startTime": "2024-01-01T10:00:00.000Z",
        "endTime": "2024-12-31T23:59:59.000Z",
        "pictureUrls": [
          "https://i.ebayimg.com/images/g/abc/s-l1600.jpg"
        ],
        "categoryId": "9355",
        "categoryName": "Cell Phones & Smartphones",
        "listingUrl": "https://www.ebay.de/itm/123456789012"
      }
    ]
  },
  "metadata": {
    "account_used": "seller_username",
    "account_id": "acc_123456",
    "marketplace": "EBAY_DE",
    "api_type": "TRADING",
    "operation": "SEARCH_ITEMS",
    "limit": 50
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "At least one search parameter is required (title or sku)",
  "errors": [],
  "ack": "Failure"
}
```

## Usage Examples

### 1. Search by Title Only

```bash
curl "https://your-domain.com/api/ebay/acc_123456/trading/search?title=iPhone" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Case:** Find all listings with "iPhone" in the title

### 2. Search by SKU Only

```bash
curl "https://your-domain.com/api/ebay/acc_123456/trading/search?sku=PROD-001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Case:** Find specific item by your internal SKU

### 3. Search by BOTH Title AND SKU

```bash
curl "https://your-domain.com/api/ebay/acc_123456/trading/search?title=iPhone&sku=PROD-001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Case:** Find items that match both title pattern and exact SKU

### 4. With Marketplace and Limit

```bash
curl "https://your-domain.com/api/ebay/acc_123456/trading/search?title=iPhone&marketplace=EBAY_US&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. With Debug Mode

```bash
curl "https://your-domain.com/api/ebay/acc_123456/trading/search?title=iPhone&sku=PROD-001&debug=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Code Examples

### JavaScript/TypeScript

```javascript
// Search by title only
async function searchByTitle(accountId, title) {
  const response = await fetch(
    `/api/ebay/${accountId}/trading/search?title=${encodeURIComponent(title)}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  return data.data.items;
}

// Search by SKU only
async function searchBySku(accountId, sku) {
  const response = await fetch(
    `/api/ebay/${accountId}/trading/search?sku=${encodeURIComponent(sku)}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  return data.data.items;
}

// Search by BOTH title AND SKU (AND logic)
async function searchByTitleAndSku(accountId, title, sku) {
  const params = new URLSearchParams({
    title: title,
    sku: sku
  });

  const response = await fetch(
    `/api/ebay/${accountId}/trading/search?${params}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();

  // These items match BOTH title and SKU
  return data.data.items;
}

// Example usage
const items = await searchByTitleAndSku('acc_123', 'iPhone', 'PROD-001');
console.log(`Found ${items.length} items matching both conditions`);
```

### Python

```python
import requests

def search_items(account_id, title=None, sku=None, marketplace='EBAY_DE', limit=50):
    """
    Search eBay items by title and/or SKU

    Args:
        account_id: eBay account ID
        title: Search by title (optional)
        sku: Search by SKU (optional)
        marketplace: eBay marketplace
        limit: Maximum results

    Returns:
        List of matching items
    """
    params = {
        'marketplace': marketplace,
        'limit': limit
    }

    if title:
        params['title'] = title
    if sku:
        params['sku'] = sku

    if not title and not sku:
        raise ValueError("At least one of title or sku is required")

    response = requests.get(
        f'https://your-domain.com/api/ebay/{account_id}/trading/search',
        params=params,
        headers={'Authorization': f'Bearer {token}'}
    )

    data = response.json()
    return data['data']['items']

# Search by both (AND logic)
items = search_items('acc_123', title='iPhone', sku='PROD-001')
print(f"Found {len(items)} items matching both title and SKU")
```

## Response Fields

### Item Object

| Field | Type | Description |
|-------|------|-------------|
| `itemId` | string | eBay Item ID |
| `sku` | string | Your SKU |
| `title` | string | Item title |
| `currentPrice` | number | Current price |
| `currency` | string | Price currency code |
| `quantity.total` | integer | Total quantity listed |
| `quantity.sold` | integer | Number sold |
| `quantity.available` | integer | Remaining quantity |
| `listingStatus` | string | Active, Completed, Ended |
| `listingType` | string | FixedPriceItem, Auction |
| `startTime` | string | Listing start time (ISO 8601) |
| `endTime` | string | Listing end time (ISO 8601) |
| `pictureUrls` | array | Image URLs |
| `categoryId` | string | eBay category ID |
| `categoryName` | string | eBay category name |
| `listingUrl` | string | Direct link to listing on eBay |

## Performance Notes

- The API searches through seller's active listings
- Maximum 200 items fetched per page
- Searches up to 10 pages (2000 items) maximum
- Returns as soon as `limit` is reached
- For best performance, use specific SKU when possible

## Use Cases

### 1. Verify Item Exists by Title and SKU
```javascript
const items = await searchByTitleAndSku(accountId, 'iPhone 13', 'PROD-001');
if (items.length > 0) {
  console.log('Item found:', items[0].itemId);
} else {
  console.log('No item matches both title and SKU');
}
```

### 2. Find All Variants of a Product
```javascript
// Find all iPhone listings
const iphones = await searchByTitle(accountId, 'iPhone');
console.log(`Found ${iphones.length} iPhone listings`);
```

### 3. Get Item Details by Your SKU
```javascript
// Find specific item by your internal SKU
const items = await searchBySku(accountId, 'PROD-001');
if (items.length > 0) {
  console.log('Current price:', items[0].currentPrice);
  console.log('Available:', items[0].quantity.available);
}
```

### 4. Validate Listing Matches Expected Data
```javascript
// Check if listing with specific SKU has correct title
const items = await searchByTitleAndSku(accountId, 'Expected Title', 'PROD-001');
if (items.length === 0) {
  console.warn('Warning: Item with SKU PROD-001 does not have expected title');
}
```

## Error Codes

| HTTP Status | Description | Solution |
|-------------|-------------|----------|
| 400 | Missing search parameters | Provide at least `title` or `sku` |
| 400 | eBay API error | Check error details in response |
| 500 | Internal server error | Check server logs, retry request |

## Related Endpoints

- [Check Item Status](./TRADING_API_STATUS.md) - Get detailed status of specific item
- [Get Listing Details](./TRADING_API_CREATE_UPDATE_DOCS.md) - Get full details by ItemID
- [Update Listing](./TRADING_API_CREATE_UPDATE_DOCS.md) - Update item after finding it

## Implementation Details

- **Location**: `app/api/ebay/[accountId]/trading/search/route.ts`
- **Service Method**: `EbayTradingApiService.searchItems()`
- **eBay API Call**: `GetSellerList` with pagination
- **Debug Logging**: Uses `RealtimeDebugLogger` when `debug=1`
