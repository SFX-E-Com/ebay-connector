# Trading API - Item Status Check

Check the status of an eBay listing using the Trading API.

## Endpoint

```
GET /api/ebay/[accountId]/trading/status
```

## Authentication

Requires valid eBay Trading API token with scope: `/ebay/{accountId}/inventory`

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `itemId` | string | Yes | - | eBay Item ID to check status for |
| `marketplace` | string | No | `EBAY_DE` | eBay marketplace (e.g., `EBAY_US`, `EBAY_DE`, `EBAY_GB`) |
| `debug` | string | No | - | Set to `1` to enable debug mode with detailed logging |

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "itemId": "123456789012",
    "sku": "YOUR-SKU-123",
    "title": "Product Title Here",
    "status": {
      "listingStatus": "Active",
      "isActive": true,
      "isEnded": false
    },
    "quantity": {
      "total": 10,
      "sold": 2,
      "available": 8
    },
    "pricing": {
      "currentPrice": 99.99,
      "currency": "EUR",
      "convertedPrice": 109.99,
      "convertedCurrency": "USD"
    },
    "timing": {
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-12-31T23:59:59.000Z",
      "listingDuration": "GTC"
    },
    "listingType": "FixedPriceItem",
    "viewCount": 150,
    "watchCount": 5
  },
  "metadata": {
    "account_used": "seller_username",
    "account_id": "acc_123456",
    "marketplace": "EBAY_US",
    "api_type": "TRADING",
    "operation": "CHECK_STATUS"
  }
}
```

### Status Values

#### listingStatus

| Status | Description |
|--------|-------------|
| `Active` | Listing is currently active and live on eBay |
| `Completed` | Listing has ended (sold out or time expired) |
| `Ended` | Listing was ended manually or expired |
| `NotFound` | Item does not exist or has been deleted |

#### isActive

- `true` - Item is currently active and available for purchase
- `false` - Item is not active (ended, completed, or deleted)

#### isEnded

- `true` - Listing has ended (completed, manually ended, or deleted)
- `false` - Listing is still active

#### isDeleted (only present when NotFound)

- `true` - Item was deleted or never existed

### Item Not Found Response

When an item doesn't exist or has been deleted:

```json
{
  "success": true,
  "data": {
    "success": true,
    "itemId": "999999999999",
    "status": {
      "listingStatus": "NotFound",
      "isActive": false,
      "isEnded": true,
      "isDeleted": true
    },
    "message": "Item not found or has been deleted"
  },
  "metadata": {
    "account_used": "seller_username",
    "account_id": "acc_123456",
    "marketplace": "EBAY_US",
    "api_type": "TRADING",
    "operation": "CHECK_STATUS"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "eBay Trading API error: [21917062] Invalid or missing ItemID - ItemID 123 is invalid",
  "errors": [
    {
      "shortMessage": "Invalid or missing ItemID",
      "longMessage": "ItemID 123 is invalid",
      "errorCode": "21917062",
      "severityCode": "Error",
      "errorClassification": "RequestError"
    }
  ],
  "ack": "Failure"
}
```

## Usage Examples

### Basic Status Check

```bash
curl -X GET "https://your-domain.com/api/ebay/acc_123456/trading/status?itemId=123456789012" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### With Marketplace

```bash
curl -X GET "https://your-domain.com/api/ebay/acc_123456/trading/status?itemId=123456789012&marketplace=EBAY_DE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### With Debug Mode

```bash
curl -X GET "https://your-domain.com/api/ebay/acc_123456/trading/status?itemId=123456789012&debug=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Use Cases

### 1. Check if Item is Active

```javascript
const response = await fetch(`/api/ebay/${accountId}/trading/status?itemId=${itemId}`);
const { data } = await response.json();

if (data.status.isActive) {
  console.log('Item is active and available for purchase');
} else {
  console.log('Item is not active');
}
```

### 2. Get Available Quantity

```javascript
const { data } = await response.json();

console.log(`Total: ${data.quantity.total}`);
console.log(`Sold: ${data.quantity.sold}`);
console.log(`Available: ${data.quantity.available}`);
```

### 3. Check Current Price

```javascript
const { data } = await response.json();

console.log(`Price: ${data.pricing.currentPrice} ${data.pricing.currency}`);
```

### 4. Monitor Views and Watches

```javascript
const { data } = await response.json();

console.log(`Views: ${data.viewCount}`);
console.log(`Watchers: ${data.watchCount}`);
```

### 5. Verify Item Exists

```javascript
const { data } = await response.json();

if (data.status.listingStatus === 'NotFound') {
  console.log('Item does not exist or has been deleted');
} else {
  console.log(`Item exists: ${data.title}`);
}
```

## Response Fields Reference

### data.status

| Field | Type | Description |
|-------|------|-------------|
| `listingStatus` | string | Current status: Active, Completed, Ended, NotFound |
| `isActive` | boolean | Whether item is currently active |
| `isEnded` | boolean | Whether listing has ended |
| `isDeleted` | boolean | Whether item was deleted (only when NotFound) |

### data.quantity

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total quantity listed |
| `sold` | number | Number of items sold |
| `available` | number | Number of items still available |

### data.pricing

| Field | Type | Description |
|-------|------|-------------|
| `currentPrice` | number | Current item price |
| `currency` | string | Price currency code (e.g., EUR, USD) |
| `convertedPrice` | number | Price converted to buyer's currency (if applicable) |
| `convertedCurrency` | string | Converted currency code (if applicable) |

### data.timing

| Field | Type | Description |
|-------|------|-------------|
| `startTime` | string | When listing started (ISO 8601 format) |
| `endTime` | string | When listing ends/ended (ISO 8601 format) |
| `listingDuration` | string | Duration type (e.g., GTC, Days_7, Days_30) |

## Error Codes

| eBay Error Code | Description | Solution |
|-----------------|-------------|----------|
| `17` | Item not found | Item may have been deleted or never existed |
| `361` | Invalid ItemID | Check if ItemID is correct |
| `21917062` | Invalid or missing ItemID | Provide valid eBay ItemID |
| `931` | Auth token invalid | Refresh eBay access token |

## Implementation Details

- **Location**: `app/api/ebay/[accountId]/trading/status/route.ts`
- **Service Method**: `EbayTradingApiService.getItemStatus()`
- **eBay API Call**: `GetItem` with minimal detail level
- **Debug Logging**: Uses `RealtimeDebugLogger` when `debug=1`

## Related Endpoints

- [Create Listing](./TRADING_API_CREATE.md) - Create new eBay listing
- [Update Listing](./TRADING_API_UPDATE.md) - Update existing listing
- [Delete Listing](./TRADING_API_DELETE.md) - End/delete listing
- [Relist Item](./TRADING_API_RELIST.md) - Relist ended item

## Notes

- ItemID is different from SKU. ItemID is assigned by eBay when listing is created.
- For GTC (Good 'Til Cancelled) listings, `endTime` may be far in the future.
- `viewCount` and `watchCount` are useful for monitoring listing performance.
- The endpoint returns `success: true` even for NotFound items to distinguish from API errors.
