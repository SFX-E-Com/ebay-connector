# eBay Item Management Guide

## 1. Check if Item Exists

### Endpoint: GET /api/ebay/[accountId]/check-item

Check if an item already exists in your eBay inventory by SKU or Item ID.

```bash
# Check by SKU
curl -X GET "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/check-item?sku=TEST-SKU-001"

# Check by Item ID
curl -X GET "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/check-item?itemId=123456789"

# Check by both (will check SKU first)
curl -X GET "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/check-item?sku=TEST-SKU-001&itemId=123456789"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "location": "inventory_api", // or "trading_api"
    "item": { /* item details */ },
    "searchCriteria": {
      "sku": "TEST-SKU-001",
      "itemId": null
    }
  }
}
```

## 2. Creating Multiple Variations (Different SKUs, Same Product)

### Important: eBay SKU Rules
- **You CANNOT have multiple active listings with the same SKU**
- Instead, use variations for products with different attributes (color, size, etc.)
- Each variation needs a unique SKU

### Method 1: Create Variations Using Inventory Item Group

```bash
# Create an inventory item group with variations
curl -X POST "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/inventory-group" \
  -H "Content-Type: application/json" \
  -d '{
    "inventoryItemGroupKey": "SHIRT-GROUP-001",
    "title": "Cotton T-Shirt",
    "description": "High quality cotton t-shirt",
    "imageUrls": ["https://example.com/shirt.jpg"],
    "variantSKUs": [
      "SHIRT-RED-S",
      "SHIRT-RED-M",
      "SHIRT-RED-L",
      "SHIRT-BLUE-S",
      "SHIRT-BLUE-M",
      "SHIRT-BLUE-L"
    ],
    "aspects": {
      "Brand": "YourBrand",
      "Material": "Cotton"
    }
  }'
```

### Method 2: Create Multiple Variations at Once

```bash
curl -X PUT "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/inventory-group" \
  -H "Content-Type: application/json" \
  -d '{
    "baseSKU": "SHIRT",
    "commonData": {
      "title": "Cotton T-Shirt",
      "description": "High quality cotton t-shirt",
      "imageUrls": ["https://example.com/shirt.jpg"],
      "condition": "NEW",
      "aspects": {
        "Brand": "YourBrand",
        "Material": "100% Cotton"
      }
    },
    "variations": [
      {
        "suffix": "RED-S",
        "name": "Red Small",
        "quantity": 10,
        "aspects": {
          "Color": "Red",
          "Size": "Small"
        }
      },
      {
        "suffix": "RED-M",
        "name": "Red Medium",
        "quantity": 15,
        "aspects": {
          "Color": "Red",
          "Size": "Medium"
        }
      },
      {
        "suffix": "BLUE-S",
        "name": "Blue Small",
        "quantity": 8,
        "aspects": {
          "Color": "Blue",
          "Size": "Small"
        }
      }
    ]
  }'
```

This will create:
- `SHIRT-RED-S` - Red Small with 10 quantity
- `SHIRT-RED-M` - Red Medium with 15 quantity
- `SHIRT-BLUE-S` - Blue Small with 8 quantity

## 3. Example: Complete Workflow

### Step 1: Check if SKU exists
```bash
curl -X GET "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/check-item?sku=PRODUCT-001"
```

### Step 2: If not exists, create inventory item
```bash
curl -X POST "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PRODUCT-001",
    "product": {
      "title": "Your Product",
      "description": "Product description"
    },
    "condition": "NEW",
    "availability": {
      "shipToLocationAvailability": {
        "quantity": 10
      }
    }
  }'
```

### Step 3: Create offer (listing)
```bash
curl -X POST "http://localhost:3000/api/ebay/YOUR_ACCOUNT_ID/offers" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PRODUCT-001",
    "marketplaceId": "EBAY_US",
    "format": "FIXED_PRICE",
    "pricingSummary": {
      "price": {
        "value": "29.99",
        "currency": "USD"
      }
    }
  }'
```

## 4. Best Practices

### For Similar Products with Variations:
1. **Use unique SKUs for each variation**:
   - `SHIRT-RED-S`, `SHIRT-RED-M`, `SHIRT-BLUE-S`

2. **Group them using Inventory Item Groups**:
   - All variations can be displayed as options on a single listing

3. **Share common attributes**:
   - Brand, Material, Care Instructions

4. **Specify variation attributes**:
   - Color, Size, Style

### For Completely Different Products:
1. **Use entirely different SKUs**:
   - `LAPTOP-001`, `MOUSE-001`, `KEYBOARD-001`

2. **Create separate listings**:
   - Each product gets its own listing

### Error Prevention:
1. **Always check if SKU exists before creating**
2. **Use descriptive SKUs**: `BRAND-PRODUCT-COLOR-SIZE`
3. **Keep a SKU management system** to avoid duplicates
4. **Never reuse SKUs** even after deleting items

## Common Errors and Solutions

### Error: "Duplicate SKU"
**Solution:** Each SKU must be unique. Use variations for similar products.

### Error: "Invalid inventory item group"
**Solution:** Ensure all variant SKUs exist as inventory items first.

### Error: "Variation limit exceeded"
**Solution:** eBay limits variations per listing (usually 250). Split into multiple listings if needed.

## Summary

- **Single SKU = Single Inventory Item = Can have one active listing**
- **Multiple variations = Multiple SKUs grouped together = Displayed as options on one listing**
- **Always check existence before creating** to avoid duplicates
- **Use the bulk variations endpoint** to create multiple items efficiently